"""
clean_acs.py

Example transformation script for cleaning ACS tabular data.
"""

from pathlib import Path
import pandas as pd

def main() -> None:
    base = Path(__file__).resolve().parents[2]
    raw_dir = base / "data" / "raw"
    processed_dir = base / "data" / "processed"
    processed_dir.mkdir(parents=True, exist_ok=True)

    input_csv = raw_dir / "acs_example.csv"
    output_csv = processed_dir / "acs_example_clean.csv"

    if not input_csv.exists():
        print(f"{input_csv} not found. Add a small sample CSV to run this step.")
        return

    df = pd.read_csv(input_csv)
    df.columns = [c.lower().replace(" ", "_") for c in df.columns]
    df = df.drop_duplicates()

    df.to_csv(output_csv, index=False)
    print(f"Wrote cleaned dataset to {output_csv}")

if __name__ == "__main__":
    main()
