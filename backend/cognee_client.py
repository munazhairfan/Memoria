import os
import pathlib
from dotenv import load_dotenv
import asyncio
import secrets
import uuid
import cognee
from cognee.modules.users.methods import create_user, get_user, get_user_by_email
from backend.config import init_config
from backend.database import users as mongo_users
from bson import ObjectId

init_config()

DEFAULT_DATASET_NAME = "diary"
# NOTE: no longer need to bake user_id into the dataset name — isolation is
# now physical (separate storage per Cognee `user`), not a naming
# convention we have to trust. Every user can safely use the same simple
# dataset name; Cognee keeps them in genuinely separate storage per user.


async def _get_or_create_cognee_user(user_id: str):
    """
    Bridges OUR Mongo user (_id) to a real Cognee user object.

    Cognee's real multi-tenant isolation (ENABLE_BACKEND_ACCESS_CONTROL,
    on by default in this installed version) is enforced per authenticated
    `user`, not per dataset-name string — the previous version of this file
    only ever passed a dataset_name convention (`user_<id>`), which Cognee
    never actually used as an isolation boundary. That's why cross-user
    leakage was possible under graph-aware search despite looking isolated
    under simple chunk search.

    This looks up (or lazily creates, for accounts that existed before this
    change) a matching Cognee user, and persists the mapping back onto the
    Mongo user document so it's only ever created once.
    """
    mongo_doc = await mongo_users.find_one({"_id": ObjectId(user_id)})
    if not mongo_doc:
        raise ValueError(f"No such user: {user_id}")

    cognee_user_id = mongo_doc.get("cognee_user_id")
    if cognee_user_id:
        return await get_user(uuid.UUID(cognee_user_id))

    # Lazy fallback for accounts created before this change — no real
    # password needed here, we never authenticate through Cognee's own
    # auth system, we only need a stable `user` identity object to pass
    # into remember()/recall() for storage isolation.
    email = mongo_doc["email"]
    try:
        cognee_user = await get_user_by_email(email)
    except Exception:
        cognee_user = None

    if not cognee_user:
        cognee_user = await create_user(email, secrets.token_urlsafe(24))

    await mongo_users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"cognee_user_id": str(cognee_user.id)}},
    )
    return cognee_user


async def remember(text: str, user_id: str) -> None:
    cognee_user = await _get_or_create_cognee_user(user_id)
    await cognee.remember(text, dataset_name=DEFAULT_DATASET_NAME, user=cognee_user)


async def recall(query: str, user_id: str) -> list[str]:
    from cognee.modules.search.types import SearchType

    cognee_user = await _get_or_create_cognee_user(user_id)
    try:
        results = await cognee.recall(
            query_text=query,
            query_type=SearchType.CHUNKS,
            datasets=[DEFAULT_DATASET_NAME],
            user=cognee_user,
        )
    except Exception as e:
        # A brand-new user who has never called remember() yet has no
        # dataset in Cognee at all — that's not a real error, it just means
        # no memories exist yet. Treat it the same as an empty result
        # instead of letting it crash /chat, /history, /query.
        if "DatasetNotFoundError" in str(type(e)) or "No datasets found" in str(e):
            return []
        raise

    memory_strings: list[str] = []
    for item in results:
        text = getattr(item, "text", None)
        if text:
            memory_strings.append(text)
        elif isinstance(item, str):
            memory_strings.append(item)
        elif isinstance(item, dict):
            memory_strings.append(item.get("text") or item.get("content") or str(item))
        else:
            memory_strings.append(str(item))

    return memory_strings