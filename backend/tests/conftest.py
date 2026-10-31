import sys
from pathlib import Path

# Add project root and backend to sys.path so both 'app' and 'db' can be imported everywhere
project_root = Path(__file__).resolve().parent.parent.parent
backend_dir = Path(__file__).resolve().parent.parent

for p in (str(project_root), str(backend_dir)):
    if p not in sys.path:
        sys.path.insert(0, p)
