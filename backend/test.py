import asyncio, cognee
from config import init_config
init_config()

async def main():
    result = await cognee.remember('test memory for inspecting result shape')
    print('to_dict:', result.to_dict())
    print('has raw_result:', hasattr(result, 'raw_result'))
    if hasattr(result, 'raw_result'):
        print('raw_result:', result.raw_result)

asyncio.run(main())