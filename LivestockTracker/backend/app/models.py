from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean
from database import Base
from datetime import datetime

class TrackerData(Base):
    """
    Define a SQLAlchemy model for tracking data with the following fields:
    - id: Integer, primary key
    - device_id: String, indexed
    - latitude: Float
    - longitude: Float
    - speed: Float
    - distance: Float
    - behavior: Float
    - timestamp: DateTime, defaulting to the current timestamp.
    """
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
    """
    Define a User class that represents a table in the database with columns for id, username, and password.
    - id: Integer, primary key
    - username: String, unique, not nullable
    - password: String, not nullable
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)  # plaintext for now, later hash it

class PlayToneCommand(Base):
    """
    Define a PlayToneCommand class that represents a command to play a tone.
    Attributes:
    - id: Integer, primary key
    - device_id: String, index, not nullable
    - command: String, not nullable
    - created_at: DateTime, default to the current UTC datetime
    - sent: Boolean, default to False
    - sent_at: DateTime, nullable
    """
    __tablename__ = "playtone_commands"

    id = Column(Integer, primary_key=True, index=True)  # SERIAL in PostgreSQL
    device_id = Column(String, index=True, nullable=False)
    command = Column(String, nullable=False)            # e.g. "PLAY_TONE"
    created_at = Column(DateTime, default=datetime.utcnow)
    sent = Column(Boolean, default=False)
    sent_at = Column(DateTime, nullable=True)