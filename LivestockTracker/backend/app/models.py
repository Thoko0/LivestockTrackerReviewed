from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean
from database import Base
from datetime import datetime

class TrackerData(Base):
    __tablename__ = "tracker_data"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String, index=True)
    latitude = Column(Float)
    longitude = Column(Float)
    speed = Column(Float)
    distance = Column(Float)
    behavior = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)  # plaintext for now, later hash it

class PlayToneCommand(Base):
    __tablename__ = "playtone_commands"

    id = Column(Integer, primary_key=True, index=True)  # SERIAL in PostgreSQL
    device_id = Column(String, index=True, nullable=False)
    command = Column(String, nullable=False)            # e.g. "PLAY_TONE"
    created_at = Column(DateTime, default=datetime.utcnow)
    sent = Column(Boolean, default=False)
    sent_at = Column(DateTime, nullable=True)