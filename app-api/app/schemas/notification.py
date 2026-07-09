from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator


class PushDeviceRegister(BaseModel):
    expo_push_token: str
    platform: str = "android"
    timezone: str = "UTC"

    @field_validator("expo_push_token")
    @classmethod
    def validate_expo_push_token(cls, value: str) -> str:
        token = value.strip()
        if not token.startswith("ExponentPushToken["):
            raise ValueError("Invalid Expo push token")
        return token

    @field_validator("platform")
    @classmethod
    def normalize_platform(cls, value: str) -> str:
        normalized = value.strip().lower()
        if normalized not in {"android", "ios"}:
            raise ValueError("platform must be 'android' or 'ios'")
        return normalized

    @field_validator("timezone")
    @classmethod
    def normalize_timezone(cls, value: str) -> str:
        return value.strip() or "UTC"


class PushDeviceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    expo_push_token: str
    platform: str
    timezone: str
    is_active: bool
    last_seen_at: datetime
