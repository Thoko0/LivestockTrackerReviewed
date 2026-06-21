from database import Base, engine

#creates new tables if some did not exist. 
import models  

Base.metadata.create_all(bind=engine)
print("Tables created successfully.")