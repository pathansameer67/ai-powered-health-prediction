import asyncio
import sys
from pathlib import Path

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

backend_path = Path(__file__).resolve().parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from app.ingestion.bootstrap import seed_trusted_knowledge


async def main():
    print("[+] Starting knowledge base initialization and seeding...")
    indexed = await seed_trusted_knowledge(force=True)
    print(f"[DONE] Indexed {indexed} verified healthcare documents.")


if __name__ == "__main__":
    asyncio.run(main())
