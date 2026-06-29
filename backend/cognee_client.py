import os
import pathlib
import re
from dotenv import load_dotenv
import asyncio
import cognee
from config import init_config
# Force strict absolute path configuration first

init_config()

async def remember(text: str) -> None:
    await cognee.remember(text)

async def recall(query: str) -> list[str]:
    results = await cognee.recall(query_text=query)
    
    memory_strings: list[str] = []
    for item in results:
        item_str = str(item)
        if "text='" in item_str:
            # Cleanly extract the string contents between text='...' using a quick regex match
            match = re.search(r"text='([^']*)'", item_str)
            if match:
                memory_strings.append(match.group(1))
                continue
        if isinstance(item, str):
            memory_strings.append(item)
        elif isinstance(item, dict):
            text_content = item.get("text") or item.get("content") or item.get("description") or str(item)
            memory_strings.append(text_content)
        else:
            memory_strings.append(item_str)

    return memory_strings