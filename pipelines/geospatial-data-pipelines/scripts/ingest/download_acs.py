"""
download_acs.py

Stub ingestion script demonstrating how ACS data would be acquired
and placed into the raw data directory.
"""

from pathlib import Path

def main() -> None:
    raw_dir = Path(__file__).resolve().parents[2] / "data" / "raw"
    raw_dir.mkdir(parents=True, exist_ok=True)

    marker = raw_dir / "README.txt"
    marker.write_text(
        "Raw ACS data stored locally and not committed to version control.\n",
        encoding="utf-8",
    )
    print(f"Initialized raw data directory at {raw_dir}")

if __name__ == "__main__":
    main()
