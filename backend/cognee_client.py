import os
import pathlib
from dotenv import load_dotenv
import asyncio
import cognee
from cognee.modules.search.types import SearchType
from config import init_config

init_config()


async def remember(text: str) -> None:
    await cognee.remember(text)


async def recall(query: str) -> list[str]:
    results = await cognee.recall(query_text=query, query_type=SearchType.CHUNKS)

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