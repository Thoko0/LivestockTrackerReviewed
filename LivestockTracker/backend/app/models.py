from sqlalchemy import Column, Integer, String, Float, DateTime
from database import Base
from datetime import datetime

class TrackerData(Base):
    __tablename__ = "tracker_data"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String, index=True)
    latitude = Column(Float)
    longitude = Column(Float)
    ax = Column(Float)
    ay = Column(Float)
    az = Column(Float)
    gyro_x = Column(Float)
    gyro_y = Column(Float)
    gyro_z = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)  # plaintext for now, later hash it