from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta
from sqlalchemy import desc

from database import SessionLocal, engine
from models import Base, TrackerData, User
from schemas import TrackerDataSchema, UserLogin
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()


origins = [
    "https://livestocktrackerzaf.onrender.com",  # your frontend URL
    "http://localhost:3000",                     # if testing locally
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # all origins for testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
        latitude=data.latitude,
        longitude=data.longitude,
        speed=data.speed,
        distance=data.distance,
        behavior=data.behavior,
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

# Listing trackers endpoint #
@app.get("/trackers/list")
def get_tracker_list(db: Session = Depends(get_db)):
    # Return distinct device_ids (or you can include names if you have them)
    trackers = db.query(TrackerData.device_id).distinct().all()
    return [{"id": t[0]} for t in trackers]  # simple list of trackers

#locate trackers on map endpoint
@app.get("/trackers/map")
def get_trackers_for_map(db: Session = Depends(get_db)):
    trackers = db.query(TrackerData.device_id, TrackerData.latitude, TrackerData.longitude).all()
    return [
        {"device_id": t.device_id, "latitude": t.latitude, "longitude": t.longitude}
        for t in trackers
    ]
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

    return {
    "device_id": record.device_id,
    "latitude": record.latitude,
    "longitude": record.longitude,
    "speed": getattr(record, "speed", None),
    "behavior": getattr(record, "behavior", None),
    "created_at": record.timestamp.isoformat() if record.timestamp else None
}


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
            "device_id": r.device_id,
            "timestamp": r.timestamp.isoformat(),
            "latitude": r.latitude,
            "longitude": r.longitude,
            "speed": r.speed,
            "distance": r.distance,
            "behavior": r.behavior,
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
#-----------------------------
# Polyline endpoint
#-----------------------------
@app.get("/tracker_data/{device_id}/path")
def get_daily_path(device_id: str, date: str, db: Session = Depends(get_db)):
    start = datetime.strptime(date, "%Y-%m-%d")
    end = start + timedelta(days=1)

    points = (
        db.query(TrackerData)
        .filter(
            TrackerData.device_id == device_id,
            TrackerData.timestamp >= start,
            TrackerData.timestamp < end
        )
        .order_by(TrackerData.timestamp.asc())
        .all()
    )

    return [
        {"latitude": p.latitude, "longitude": p.longitude, "timestamp": p.timestamp}
        for p in points
    ]

#----------------------------
#Chart data endpoint
#----------------------------
@app.get("/tracker_data/{device_id}/chart")
def get_tracker_chart(device_id: str, date: str, db: Session = Depends(get_db)):
    start = datetime.strptime(date, "%Y-%m-%d")
    end = start + timedelta(days=1)

    points = db.query(TrackerData)\
               .filter(TrackerData.device_id == device_id,
                       TrackerData.timestamp >= start,
                       TrackerData.timestamp < end)\
               .order_by(TrackerData.timestamp.asc()).all()

    timeLabels = [p.timestamp.strftime("%H:%M") for p in points]
    behaviorValues = [p.behavior for p in points]  # make sure it's integer
    pieValues = [
        len([v for v in behaviorValues if v == 0]),
        len([v for v in behaviorValues if v == 1]),
        len([v for v in behaviorValues if v == 2]),
        len([v for v in behaviorValues if v == 3])
    ] if behaviorValues else [0, 0, 0, 0]  # fallback in case of empty

    return {"timeLabels": timeLabels, "behaviorValues": behaviorValues, "pieValues": pieValues}
