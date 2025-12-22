from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from sqlalchemy import desc

from database import SessionLocal, engine
from models import Base, TrackerData, User
from schemas import TrackerDataSchema, UserLogin
from fastapi.responses import JSONResponse

app = FastAPI()

# -------------------------
# Database Initialization
# -------------------------
Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# -------------------------
# TrackerData Endpoints
# -------------------------

@app.post("/data")
def add_data(data: TrackerDataSchema, db: Session = Depends(get_db)):
    print("ENTERED /data ENDPOINT")
    print("RAW DATA:", data)

    record = TrackerData(
        device_id=data.device_id,
        latitude=data.lat,
        longitude=data.lon,
        ax=data.ax,
        ay=data.ay,
        az=data.az,
        gyro_x=data.gyro_x,
        gyro_y=data.gyro_y,
        gyro_z=data.gyro_z
    )

    db.add(record)
    db.commit()
    db.refresh(record)

    print(f"SAVED ID {record.id}")
    return {"status": "saved", "id": record.id}

@app.get("/data", response_model=List[TrackerDataSchema])
def get_data(db: Session = Depends(get_db)):
    return db.query(TrackerData).all()

# -------------------------
# New Endpoint: Latest per device
# -------------------------
@app.get("/data/latest", response_model=List[TrackerDataSchema])
def get_latest_data(db: Session = Depends(get_db)):
    # Get all distinct device_ids
    device_ids = db.query(TrackerData.device_id).distinct().all()
    latest_records = []

    for (device_id,) in device_ids:
        record = (
            db.query(TrackerData)
            .filter(TrackerData.device_id == device_id)
            .order_by(desc(TrackerData.timestamp))
            .first()
        )
        if record:
            latest_records.append(record)

    return latest_records

# -------------------------
# New Endpoint for Map Search
# -------------------------
@app.get("/tracker_data/{device_id}")
def get_tracker_location(device_id: str, db: Session = Depends(get_db)):
    record = (
        db.query(TrackerData)
        .filter(TrackerData.device_id == device_id)
        .order_by(desc(TrackerData.timestamp))
        .first()
    )

    if not record:
        return JSONResponse(status_code=404, content={"detail": "Not Found"})

    return {"latitude": record.latitude, "longitude": record.longitude}

# -------------------------
# Login Endpoint
# -------------------------
@app.post("/login")
def login(request: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == request.username).first()
    if user and user.password == request.password:
        return {"username": user.username}
    raise HTTPException(status_code=401, detail="Invalid username or password")

# -------------------------
# History Endpoint (for reports)
# -------------------------
@app.get("/history/{device_id}")
def get_history(device_id: str, db: Session = Depends(get_db)):
    records = (
        db.query(TrackerData)
        .filter(TrackerData.device_id == device_id)
        .order_by(TrackerData.timestamp)
        .all()
    )
    return [
        {
            "timestamp": r.timestamp.isoformat(),
            "latitude": r.latitude,
            "longitude": r.longitude,
            "ax": r.ax,
            "ay": r.ay,
            "az": r.az,
            "gyro_x": r.gyro_x,
            "gyro_y": r.gyro_y,
            "gyro_z": r.gyro_z
        }
        for r in records
    ]

# -------------------------
# Root Endpoint (optional)
# -------------------------
@app.get("/")
def read_root():
    return {"message": "Hello, FastAPI!"}

# -------------------------
# Create Test User if Not Exists
# -------------------------
def create_test_user():
    db = SessionLocal()
    if not db.query(User).filter(User.username == "admin").first():
        user = User(username="admin", password="1234")
        db.add(user)
        db.commit()
        db.refresh(user)

        print(f"SAVED TO DB WITH ID: {user.id}")
    db.close()

create_test_user()

