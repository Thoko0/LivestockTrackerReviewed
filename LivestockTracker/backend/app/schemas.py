from pydantic import BaseModel

class TrackerDataSchema(BaseModel):
    device_id: str
    lat: float
    lon: float
    ax: float
    ay: float
    az: float
    gyro_x: float
    gyro_y: float
    gyro_z: float

class UserLogin(BaseModel):
    username: str
    password: str