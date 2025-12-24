"""
validate_geometries.py

Basic geometry validation checks for processed spatial outputs.
"""

from pathlib import Path
import geopandas as gpd

def main() -> None:
    processed_dir = Path(__file__).resolve().parents[2] / "data" / "processed"
    candidate = processed_dir / "boundaries.geojson"

    if not candidate.exists():
        print(f"{candidate} not found. Export a small sample vector file to validate.")
        return

    gdf = gpd.read_file(candidate)

    print(f"Feature count: {len(gdf)}")
    print(f"Invalid geometries: {(~gdf.is_valid).sum()}")
    print(f"Empty geometries: {gdf.geometry.is_empty.sum()}")

if __name__ == "__main__":
    main()
