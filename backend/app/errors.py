from enum import Enum

from fastapi import Request
from fastapi.responses import JSONResponse


class ErrorCode(str, Enum):
    USER_NOT_FOUND = "USER_NOT_FOUND"
    USER_INACTIVE = "USER_INACTIVE"
    AMENITY_NOT_FOUND = "AMENITY_NOT_FOUND"
    AMENITY_INACTIVE = "AMENITY_INACTIVE"
    NOT_ELIGIBLE = "NOT_ELIGIBLE"
    CAPACITY_EXCEEDED = "CAPACITY_EXCEEDED"
    OUTSIDE_WORKING_HOURS = "OUTSIDE_WORKING_HOURS"
    INVALID_DURATION = "INVALID_DURATION"
    ADVANCE_BOOKING_WINDOW_EXCEEDED = "ADVANCE_BOOKING_WINDOW_EXCEEDED"
    BOOKING_LIMIT_EXCEEDED = "BOOKING_LIMIT_EXCEEDED"
    SLOT_UNAVAILABLE = "SLOT_UNAVAILABLE"
    INSUFFICIENT_CREDITS = "INSUFFICIENT_CREDITS"
    BOOKING_NOT_FOUND = "BOOKING_NOT_FOUND"
    TOKEN_INVALID = "TOKEN_INVALID"
    TOKEN_EXPIRED = "TOKEN_EXPIRED"
    BOOKING_CANCELLED = "BOOKING_CANCELLED"
    INVALID_REQUEST = "INVALID_REQUEST"
    TRANSCRIPTION_FAILED = "TRANSCRIPTION_FAILED"
    ACCESS_DENIED = "ACCESS_DENIED"
    BOOKING_NOT_CANCELLABLE = "BOOKING_NOT_CANCELLABLE"


_STATUS_BY_CODE = {
    ErrorCode.USER_NOT_FOUND: 404,
    ErrorCode.USER_INACTIVE: 403,
    ErrorCode.AMENITY_NOT_FOUND: 404,
    ErrorCode.AMENITY_INACTIVE: 403,
    ErrorCode.NOT_ELIGIBLE: 403,
    ErrorCode.CAPACITY_EXCEEDED: 422,
    ErrorCode.OUTSIDE_WORKING_HOURS: 422,
    ErrorCode.INVALID_DURATION: 422,
    ErrorCode.ADVANCE_BOOKING_WINDOW_EXCEEDED: 422,
    ErrorCode.BOOKING_LIMIT_EXCEEDED: 422,
    ErrorCode.SLOT_UNAVAILABLE: 409,
    ErrorCode.INSUFFICIENT_CREDITS: 402,
    ErrorCode.BOOKING_NOT_FOUND: 404,
    ErrorCode.TOKEN_INVALID: 400,
    ErrorCode.TOKEN_EXPIRED: 400,
    ErrorCode.BOOKING_CANCELLED: 400,
    ErrorCode.INVALID_REQUEST: 400,
    ErrorCode.TRANSCRIPTION_FAILED: 422,
    ErrorCode.ACCESS_DENIED: 403,
    ErrorCode.BOOKING_NOT_CANCELLABLE: 422,
}


class AppError(Exception):
    def __init__(self, code: ErrorCode, message: str):
        self.code = code
        self.message = message
        self.status_code = _STATUS_BY_CODE.get(code, 400)
        super().__init__(message)

    def to_dict(self) -> dict:
        return {"error": {"code": self.code.value, "message": self.message}}


async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content=exc.to_dict())
