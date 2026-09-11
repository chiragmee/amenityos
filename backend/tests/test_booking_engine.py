"""
Proves the deterministic booking engine works correctly, with no LLM
involved. Every scenario the backend build was required to cover:

successful free booking, successful paid booking, insufficient credits,
capacity violation, eligibility violation, outside working hours,
invalid duration, conflicting booking, duplicate booking request,
idempotent retry.
"""

import uuid
from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient


def tomorrow_at(hour: int, minute: int = 0) -> str:
    dt = (datetime.now(timezone.utc) + timedelta(days=1)).replace(
        hour=hour, minute=minute, second=0, microsecond=0
    )
    return dt.isoformat()


def new_key() -> str:
    return f"test-{uuid.uuid4().hex[:10]}"


def book(client: TestClient, **overrides) -> dict:
    payload = {
        "user_id": "usr_chirag",
        "amenity_id": "amenity_emerald",
        "start_time": tomorrow_at(10),
        "duration_minutes": 60,
        "attendee_count": 2,
        "attendee_ids": [],
        "idempotency_key": new_key(),
    }
    payload.update(overrides)
    return client.post("/bookings", json=payload)


def test_successful_free_booking(client: TestClient):
    response = book(
        client,
        user_id="usr_rahul",
        amenity_id="amenity_emerald",
        start_time=tomorrow_at(10),
        duration_minutes=60,
        attendee_count=3,
    )
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["status"] == "confirmed"
    assert body["credits_deducted"] == 0
    assert body["access_token"]

    credits = client.get("/users/usr_rahul/credits").json()
    assert credits["balance"] == 5  # unaffected by a free booking


def test_successful_paid_booking(client: TestClient):
    response = book(
        client,
        user_id="usr_chirag",
        amenity_id="amenity_gym",
        start_time=tomorrow_at(8),
        duration_minutes=60,
        attendee_count=1,
    )
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["status"] == "confirmed"
    assert body["credits_deducted"] == 10

    credits = client.get("/users/usr_chirag/credits").json()
    assert credits["balance"] == 14  # 24 - 10


def test_insufficient_credits(client: TestClient):
    before = client.get("/users/usr_rahul/credits").json()["balance"]

    response = book(
        client,
        user_id="usr_rahul",
        amenity_id="amenity_gym",
        start_time=tomorrow_at(9),
        duration_minutes=60,
        attendee_count=1,
    )
    assert response.status_code == 402, response.text
    assert response.json()["error"]["code"] == "INSUFFICIENT_CREDITS"

    after = client.get("/users/usr_rahul/credits").json()["balance"]
    assert after == before  # no credits touched, no booking created


def test_capacity_violation(client: TestClient):
    response = book(
        client,
        user_id="usr_chirag",
        amenity_id="amenity_ruby",  # capacity 4
        start_time=tomorrow_at(14),
        duration_minutes=30,
        attendee_count=6,
    )
    assert response.status_code == 422, response.text
    assert response.json()["error"]["code"] == "CAPACITY_EXCEEDED"


def test_eligibility_violation(client: TestClient):
    response = book(
        client,
        user_id="usr_guest",
        amenity_id="amenity_gym",  # restricted to employee/manager
        start_time=tomorrow_at(7),
        duration_minutes=60,
        attendee_count=1,
    )
    assert response.status_code == 403, response.text
    assert response.json()["error"]["code"] == "NOT_ELIGIBLE"


def test_outside_working_hours(client: TestClient):
    response = book(
        client,
        user_id="usr_chirag",
        amenity_id="amenity_emerald",  # hours 08:00-20:00
        start_time=tomorrow_at(21),
        duration_minutes=60,
        attendee_count=2,
    )
    assert response.status_code == 422, response.text
    assert response.json()["error"]["code"] == "OUTSIDE_WORKING_HOURS"


def test_invalid_duration(client: TestClient):
    response = book(
        client,
        user_id="usr_chirag",
        amenity_id="amenity_emerald",  # allowed durations [30, 60, 90, 120]
        start_time=tomorrow_at(10),
        duration_minutes=45,
        attendee_count=2,
    )
    assert response.status_code == 422, response.text
    assert response.json()["error"]["code"] == "INVALID_DURATION"


def test_conflicting_booking(client: TestClient):
    # Seed data already has usr_chirag booked on amenity_emerald tomorrow 15:00-16:00.
    response = book(
        client,
        user_id="usr_rahul",
        amenity_id="amenity_emerald",
        start_time=tomorrow_at(15, 30),
        duration_minutes=30,
        attendee_count=2,
    )
    assert response.status_code == 409, response.text
    assert response.json()["error"]["code"] == "SLOT_UNAVAILABLE"


def test_duplicate_booking_request(client: TestClient):
    first = book(
        client,
        user_id="usr_chirag",
        amenity_id="amenity_sapphire",
        start_time=tomorrow_at(9),
        duration_minutes=60,
        attendee_count=2,
        idempotency_key=new_key(),
    )
    assert first.status_code == 201, first.text

    # Same amenity/time/user, but a genuinely new request (different
    # idempotency key) — must be rejected as a conflict, not silently
    # deduplicated.
    second = book(
        client,
        user_id="usr_chirag",
        amenity_id="amenity_sapphire",
        start_time=tomorrow_at(9),
        duration_minutes=60,
        attendee_count=2,
        idempotency_key=new_key(),
    )
    assert second.status_code == 409, second.text
    assert second.json()["error"]["code"] == "SLOT_UNAVAILABLE"


def test_idempotent_retry(client: TestClient):
    key = new_key()
    first = book(
        client,
        user_id="usr_chirag",
        amenity_id="amenity_ruby",
        start_time=tomorrow_at(16),
        duration_minutes=30,
        attendee_count=2,
        idempotency_key=key,
    )
    assert first.status_code == 201, first.text
    booking_id = first.json()["id"]

    # Exact same request replayed with the same idempotency key must return
    # the same booking, not create a second one.
    second = book(
        client,
        user_id="usr_chirag",
        amenity_id="amenity_ruby",
        start_time=tomorrow_at(16),
        duration_minutes=30,
        attendee_count=2,
        idempotency_key=key,
    )
    assert second.status_code == 201, second.text
    assert second.json()["id"] == booking_id

    bookings = client.get("/users/usr_chirag/bookings").json()
    matching = [b for b in bookings if b["id"] == booking_id]
    assert len(matching) == 1


# Bonus coverage beyond the required minimum — cheap, and each proves a
# distinct guardrail from docs/17-failure-modes.md.


def test_amenity_inactive(client: TestClient):
    response = book(
        client,
        user_id="usr_chirag",
        amenity_id="amenity_tabletennis",  # seeded is_active=False
        start_time=tomorrow_at(10),
        duration_minutes=30,
        attendee_count=2,
    )
    assert response.status_code == 403, response.text
    assert response.json()["error"]["code"] == "AMENITY_INACTIVE"


def test_user_not_found(client: TestClient):
    response = book(client, user_id="usr_does_not_exist")
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "USER_NOT_FOUND"


def test_access_verify_rejects_tampered_token(client: TestClient):
    response = client.post("/access/verify", json={"token": "bk_fake.notarealsignature"})
    assert response.status_code == 200
    body = response.json()
    assert body["allowed"] is False
    assert body["reason"] == "TOKEN_INVALID"


def test_validate_endpoint_matches_create_outcome(client: TestClient):
    payload = {
        "user_id": "usr_rahul",
        "amenity_id": "amenity_gym",
        "start_time": tomorrow_at(9),
        "duration_minutes": 60,
        "attendee_count": 1,
    }
    validation = client.post("/bookings/validate", json=payload).json()
    assert validation["valid"] is False
    assert validation["error_code"] == "INSUFFICIENT_CREDITS"
    assert validation["sufficient_credits"] is False
