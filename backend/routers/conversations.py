from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from backend.database import conversations, messages
from backend.models import Conversation
from datetime import datetime, timezone
from backend.auth import get_current_user_id  # real JWT-backed auth, replaces the old hardcoded stub

router = APIRouter(prefix="/conversations", tags=["conversations"])


@router.get("/")
async def get_conversations(user_id: str = Depends(get_current_user_id)):
    # Pulls both user-bound sessions and fallback sessions so they don't vanish
    convs = await conversations.find({
        "$or": [
            {"user_id": user_id},
            {"user_id": {"$exists": False}}
        ]
    }).sort("updated_at", -1).to_list(50)

    for conv in convs:
        conv["_id"] = str(conv["_id"])
        # Format updated_at to ISO string so frontend Date parsers don't break
        if isinstance(conv.get("updated_at"), datetime):
            conv["updated_at"] = conv["updated_at"].isoformat()
    return convs


@router.post("/")
async def create_conversation(user_id: str = Depends(get_current_user_id)):
    conv = {
        "user_id": user_id,
        "title": "New Conversation",
        "title_set": False,  # explicit flag — avoids brittle magic-string title matching
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }
    result = await conversations.insert_one(conv)
    return {
        "_id": str(result.inserted_id),
        "title": conv["title"],
        "updated_at": conv["updated_at"].isoformat(),
    }


@router.get("/{conv_id}")
async def get_conversation(conv_id: str, user_id: str = Depends(get_current_user_id)):
    # user can't fetch another user's conversation by guessing/incrementing an ObjectId.
    conv = await conversations.find_one({
        "_id": ObjectId(conv_id),
        "$or": [
            {"user_id": user_id},
            {"user_id": {"$exists": False}}
        ]
    })
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Query matches both ObjectId and legacy string conversation_id values
    msgs = await messages.find({
        "conversation_id": {"$in": [ObjectId(conv_id), conv_id]}
    }).sort("timestamp", 1).to_list(100)

    for m in msgs:
        m["_id"] = str(m["_id"])
        if "conversation_id" in m:
            m["conversation_id"] = str(m["conversation_id"])

    return {"messages": msgs}


@router.delete("/{conv_id}")
async def delete_conversation(conv_id: str, user_id: str = Depends(get_current_user_id)):
    # 1. Verify the conversation exists and belongs to the user
    conv = await conversations.find_one({"_id": ObjectId(conv_id), "user_id": user_id})
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # 2. Delete all messages tied to this conversation
    await messages.delete_many({"conversation_id": ObjectId(conv_id)})

    # 3. Delete the conversation record itself
    await conversations.delete_one({"_id": ObjectId(conv_id)})

    return {"success": True, "message": "Conversation deleted successfully"}