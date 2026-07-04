from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")

if not MONGO_URI:
    raise ValueError("MONGO_URI is not set in .env file!")

# Force the database name
client = AsyncIOMotorClient(MONGO_URI)
db = client["memoria"]   # ← This is the important line

conversations = db.conversations
messages = db.messages
users = db.users

print("✅ Successfully connected to MongoDB Atlas")
print(f"Using database: memoria")