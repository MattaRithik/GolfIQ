"""
process_pga_dataset.py
----------------------
Scans data/raw/ for CSV files, maps common golf column names to a standard
schema, cleans the data, and writes processed files to data/processed/.

Does NOT scrape any websites or fetch remote data.

Run:
    python scripts/data_ingestion/process_pga_dataset.py
"""

import csv
import os
import sys
from pathlib import Path

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = (SCRIPT_DIR / ".." / "..").resolve()
RAW_DIR = PROJECT_ROOT / "data" / "raw"
PROCESSED_DIR = PROJECT_ROOT / "data" / "processed"

# ---------------------------------------------------------------------------
# Column name mappings
# Keys are standard internal names; values are candidate raw column names
# (case-insensitive matching is applied below).
# ---------------------------------------------------------------------------
COLUMN_MAP = {
    "player_name":       ["player_name", "name", "player", "golfer", "athlete"],
    "season":            ["season", "year", "tour_year"],
    "tournament":        ["tournament", "event", "tournament_name", "event_name", "tour_event"],
    "round":             ["round", "round_number", "round_num"],
    "score":             ["score", "total_score", "final_score", "adjusted_score"],
    "sg_total":          ["strokes_gained", "sg_total", "strokes_gained_total", "sg"],
    "driving_distance":  ["driving_distance", "drive_dist", "avg_drive", "avg_driving_distance"],
    "fairway_pct":       ["fairway_pct", "fairways_hit", "fairway_percentage", "fairway_hit_pct"],
    "gir_pct":           ["gir_pct", "greens_in_regulation", "gir", "green_pct"],
    "putts_per_round":   ["putting", "putts_per_round", "avg_putts", "putts", "putts_per_hole"],
}

# Columns that must be non-null for a row to be kept
KEY_COLUMNS = ["player_name", "score"]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def normalize_header(name: str) -> str:
    """Lowercase, strip whitespace, replace spaces/dashes with underscore."""
    return name.strip().lower().replace(" ", "_").replace("-", "_")


def map_columns(raw_headers: list[str]) -> dict[str, str]:
    """
    Returns a mapping of {raw_header: standard_name} for columns we recognize.
    Raw headers not in the map are kept as-is under their original name.
    """
    normalized = {normalize_header(h): h for h in raw_headers}
    mapping = {}  # raw_header -> standard_name

    for standard_name, candidates in COLUMN_MAP.items():
        for candidate in candidates:
            norm_candidate = normalize_header(candidate)
            if norm_candidate in normalized:
                raw_header = normalized[norm_candidate]
                mapping[raw_header] = standard_name
                break  # first match wins

    return mapping


def clean_value(value: str) -> str:
    """Strip whitespace; return empty string for common null sentinels."""
    v = value.strip()
    if v in ("", "N/A", "n/a", "NA", "None", "null", "NULL", "-", "--"):
        return ""
    return v


def process_file(csv_path: Path) -> dict:
    """
    Reads one CSV, maps columns, cleans data, and returns a result dict:
      {
        "source_file": str,
        "rows_read": int,
        "rows_kept": int,
        "rows_dropped": int,
        "columns_mapped": list[str],
        "output_file": str | None,
      }
    Returns None if the file cannot be parsed.
    """
    print(f"\n  Processing: {csv_path.name}")

    with open(csv_path, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        if reader.fieldnames is None:
            print(f"    WARNING: Could not read headers — skipping.")
            return None

        raw_headers = list(reader.fieldnames)
        col_mapping = map_columns(raw_headers)

        # Build the output fieldnames: mapped standard names + unmapped originals
        standard_names_used = list(col_mapping.values())
        unmapped = [h for h in raw_headers if h not in col_mapping]
        output_fields = standard_names_used + unmapped

        # Determine which standard names are present (for drop logic)
        present_standard = set(standard_names_used)

        rows_read = 0
        rows_kept = 0
        rows_dropped = 0
        output_rows = []

        for raw_row in reader:
            rows_read += 1

            # Remap columns
            new_row: dict[str, str] = {}
            for raw_h, standard_name in col_mapping.items():
                new_row[standard_name] = clean_value(raw_row.get(raw_h, ""))
            for raw_h in unmapped:
                new_row[raw_h] = clean_value(raw_row.get(raw_h, ""))

            # Drop row if any KEY_COLUMN that is present in this file is empty
            drop = False
            for key_col in KEY_COLUMNS:
                if key_col in present_standard and new_row.get(key_col, "") == "":
                    drop = True
                    break

            if drop:
                rows_dropped += 1
            else:
                rows_kept += 1
                output_rows.append(new_row)

        # Write processed file
        out_stem = csv_path.stem + "_processed"
        out_path = PROCESSED_DIR / (out_stem + ".csv")
        PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

        with open(out_path, "w", newline="", encoding="utf-8") as out_f:
            writer = csv.DictWriter(out_f, fieldnames=output_fields, extrasaction="ignore")
            writer.writeheader()
            writer.writerows(output_rows)

        print(f"    Rows read   : {rows_read}")
        print(f"    Rows kept   : {rows_kept}")
        print(f"    Rows dropped: {rows_dropped}")
        print(f"    Columns mapped to standard schema: {standard_names_used}")
        print(f"    Output      : {out_path}")

        return {
            "source_file": str(csv_path),
            "rows_read": rows_read,
            "rows_kept": rows_kept,
            "rows_dropped": rows_dropped,
            "columns_mapped": standard_names_used,
            "output_file": str(out_path),
        }


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    print("\nGolfIQ Benchmark — PGA Dataset Processor")
    print(f"Scanning: {RAW_DIR}")
    print("-" * 60)

    if not RAW_DIR.exists():
        print(f"ERROR: Raw data directory does not exist: {RAW_DIR}")
        sys.exit(1)

    csv_files = sorted(RAW_DIR.glob("*.csv"))

    if not csv_files:
        print("\nNo CSV files found in data/raw/.")
        print("\nTo use this script:")
        print("  1. Place golf CSV files in:  data/raw/")
        print("  2. Supported sources include public Kaggle golf datasets")
        print("     and licensed DataGolf.com exports.")
        print("  3. Re-run this script.")
        print("\nFor seed data (no external files needed), run instead:")
        print("  python scripts/data_ingestion/create_seed_data.py")
        return

    results = []
    for csv_path in csv_files:
        result = process_file(csv_path)
        if result:
            results.append(result)

    # Summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    total_read = sum(r["rows_read"] for r in results)
    total_kept = sum(r["rows_kept"] for r in results)
    total_dropped = sum(r["rows_dropped"] for r in results)
    print(f"Files processed : {len(results)}")
    print(f"Total rows read : {total_read}")
    print(f"Total rows kept : {total_kept}")
    print(f"Total rows dropped (null key columns): {total_dropped}")
    print(f"\nProcessed files written to: {PROCESSED_DIR}")
    print("=" * 60)


if __name__ == "__main__":
    main()
