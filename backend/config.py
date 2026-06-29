# backend/config.py
import os
import pathlib
import cognee
from dotenv import load_dotenv

# 1. Force environment variables to load first
load_dotenv()

# 2. Force strict absolute path resolution for Windows
PROJECT_ROOT = pathlib.Path(__file__).parent.resolve()
SYSTEM_ROOT = PROJECT_ROOT / "cognee_system"
DATA_ROOT = PROJECT_ROOT / ".cognee_data"

# 3. Create the directories if they don't exist yet to prevent initialization crashes
SYSTEM_ROOT.mkdir(parents=True, exist_ok=True)
DATA_ROOT.mkdir(parents=True, exist_ok=True)

# 4. Explicitly tell Cognee where to look
cognee.config.system_root_directory(str(SYSTEM_ROOT))
cognee.config.data_root_directory(str(DATA_ROOT))

# 5. Set fallback environment variables for internal engine threads
os.environ["SYSTEM_ROOT_DIRECTORY"] = str(SYSTEM_ROOT)
os.environ["DATA_ROOT_DIRECTORY"] = str(DATA_ROOT)

cognee.config.set_embedding_config({
        "embedding_provider": "fastembed",
        "embedding_model": "BAAI/bge-small-en-v1.5",
        "embedding_dimensions": 384  # Explicitly tell LanceDB to look for 384 dimensions
    })

def init_config():
    """A simple hook function to force-load this module across your app entrypoints."""
    pass