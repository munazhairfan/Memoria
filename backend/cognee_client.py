import os
import pathlib
from dotenv import load_dotenv
import asyncio
import cognee
from backend.config import init_config

init_config()


def _dataset_for(user_id: str) -> str:
    safe_id = "".join(c for c in user_id if c.isalnum() or c in "-_")
    return f"user_{safe_id}"


async def remember(text: str, user_id: str) -> None:
    await cognee.remember(text, dataset_name=_dataset_for(user_id))


async def recall(query: str, user_id: str) -> list[str]:
    # FIX: this previously forced query_type=SearchType.CHUNKS, which does
    # plain vector-similarity search over raw text chunks ONLY — it
    # explicitly bypasses Cognee's own knowledge graph and relationship
    # reasoning. That's exactly why a fact like a specific date could be
    # visible in the extracted graph but still get missed here: chunk
    # similarity search is weak at surfacing short factual details when the
    # query is phrased differently than the original text. Omitting
    # query_type lets recall() auto-route to whatever retrieval strategy
    # (including graph-aware search) actually fits the query — this is
    # Cognee's own recommended default usage, not a special mode.
    results = await cognee.recall(query_text=query, datasets=[_dataset_for(user_id)])

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