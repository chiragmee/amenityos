import hashlib
import hmac

from .config import ACCESS_TOKEN_SECRET


def generate_token(booking_id: str) -> str:
    signature = hmac.new(
        ACCESS_TOKEN_SECRET.encode(), booking_id.encode(), hashlib.sha256
    ).hexdigest()
    return f"{booking_id}.{signature}"


def verify_token(token: str) -> str | None:
    """Return the booking_id if the token's signature is valid, else None."""
    if "." not in token:
        return None
    booking_id, _, signature = token.partition(".")
    expected = hmac.new(
        ACCESS_TOKEN_SECRET.encode(), booking_id.encode(), hashlib.sha256
    ).hexdigest()
    if not hmac.compare_digest(expected, signature):
        return None
    return booking_id
