from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class TrackerDataSchema(BaseModel):
    device_id: str
    latitude: float
    longitude: float
    speed: float
    behavior: int
    distance: Optional[float] = 0.0
    timestamp: Optional[datetime] = None

    class Config:
        orm_mode = True

class UserLogin(BaseModel):
    username: str
    password: str