from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")

if not MONGO_URI:
    raise ValueError("MONGO_URI is not set in .env file!")

client = AsyncIOMotorClient(MONGO_URI)
db = client["memoria"] 

conversations = db.conversations
messages = db.messages
users = db.users

print("✅ Successfully connected to MongoDB Atlas")
print(f"Using database: memoria")