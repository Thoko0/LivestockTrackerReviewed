from pydantic import BaseModel

class TrackerDataSchema(BaseModel):
    device_id: str
    lat: float
    lon: float
    speed: float
    distance: float
    behavior: float
    timestamp: str
    
class UserLogin(BaseModel):
    username: str
    password: str