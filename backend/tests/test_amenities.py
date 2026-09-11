"""Admin amenity CRUD — covers the gaps found in the manual admin UI audit
(save/deactivate/new amenity previously had no backend endpoint at all)."""

from fastapi.testclient import TestClient


def new_amenity_payload(**overrides) -> dict:
    payload = {
        "name": "Test Room",
        "description": "A room for testing",
        "type": "Meeting room",
        "building": "Tower A",
        "floor": 3,
        "capacity": 5,
        "default_duration_minutes": 60,
        "minimum_duration_minutes": 30,
        "maximum_duration_minutes": 120,
        "allowed_durations": [30, 60, 120],
        "working_hours_start": "09:00",
        "working_hours_end": "18:00",
    }
    payload.update(overrides)
    return payload


def test_create_amenity(client: TestClient):
    response = client.post("/amenities", json=new_amenity_payload())
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["id"].startswith("amenity_")
    assert body["name"] == "Test Room"
    assert body["is_active"] is True

    listed = client.get("/amenities").json()
    assert any(a["id"] == body["id"] for a in listed)


def test_create_amenity_with_guideline_and_rules(client: TestClient):
    response = client.post(
        "/amenities",
        json=new_amenity_payload(
            name="Restricted Room",
            eligible_roles=["manager"],
            allowed_weekdays=["Monday", "Tuesday"],
            guideline="No food allowed.",
        ),
    )
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["eligible_roles"] == ["manager"]
    assert body["allowed_weekdays"] == ["Monday", "Tuesday"]

    policy = client.get(f"/amenities/{body['id']}/policy").json()
    assert "No food allowed." in policy["guidelines"][0]["content"]


def test_create_amenity_rejects_bad_working_hours(client: TestClient):
    response = client.post("/amenities", json=new_amenity_payload(working_hours_start="25:00"))
    assert response.status_code == 422, response.text


def test_update_amenity_partial(client: TestClient):
    response = client.patch("/amenities/amenity_emerald", json={"capacity": 8})
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["capacity"] == 8
    assert body["name"] == "Emerald Meeting Room"  # untouched

    refetched = client.get("/amenities/amenity_emerald").json()
    assert refetched["capacity"] == 8


def test_deactivate_amenity(client: TestClient):
    response = client.patch("/amenities/amenity_ruby", json={"is_active": False})
    assert response.status_code == 200, response.text
    assert response.json()["is_active"] is False

    # A deactivated amenity must be rejected by real booking validation,
    # not just flagged in the admin view.
    booking = client.post(
        "/bookings",
        json={
            "user_id": "usr_chirag",
            "amenity_id": "amenity_ruby",
            "start_time": "2027-01-01T10:00:00",
            "duration_minutes": 30,
            "attendee_count": 2,
            "attendee_ids": [],
            "idempotency_key": "deactivate-test-key",
        },
    )
    assert booking.status_code == 403
    assert booking.json()["error"]["code"] == "AMENITY_INACTIVE"


def test_update_amenity_eligible_roles_enforced(client: TestClient):
    # Sapphire has no eligibility rules in seed data — open to everyone.
    updated = client.patch("/amenities/amenity_sapphire", json={"eligible_roles": ["manager"]})
    assert updated.status_code == 200, updated.text
    assert updated.json()["eligible_roles"] == ["manager"]

    # usr_chirag is an employee, not a manager — now really restricted.
    booking = client.post(
        "/bookings",
        json={
            "user_id": "usr_chirag",
            "amenity_id": "amenity_sapphire",
            "start_time": "2027-01-01T10:00:00",
            "duration_minutes": 60,
            "attendee_count": 2,
            "attendee_ids": [],
            "idempotency_key": "eligibility-test-key",
        },
    )
    assert booking.status_code == 403
    assert booking.json()["error"]["code"] == "NOT_ELIGIBLE"


def test_update_amenity_not_found(client: TestClient):
    response = client.patch("/amenities/amenity_does_not_exist", json={"capacity": 5})
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "AMENITY_NOT_FOUND"
