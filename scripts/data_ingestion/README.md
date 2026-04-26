# GolfIQ Benchmark — Data Ingestion

This directory contains scripts for creating seed data, processing raw golf datasets,
and templates for adding approved external data sources.

---

## Directory Structure

```
scripts/data_ingestion/
├── create_seed_data.py          # Generates MVP seed CSVs (no external data needed)
├── process_pga_dataset.py       # Cleans and normalizes raw CSV files
├── importers/
│   └── approved_sources_template.py  # Template for licensed API importers
└── README.md                    # This file

data/
├── seed/        # Output of create_seed_data.py (committed to git)
├── raw/         # Place downloaded datasets here (not committed)
└── processed/   # Output of process_pga_dataset.py (not committed)
```

---

## Supported Input Formats

| Format   | Notes                                             |
|----------|---------------------------------------------------|
| CSV      | Primary format. UTF-8 or UTF-8-BOM encoding.      |
| Parquet  | Planned future support via pandas/pyarrow.        |

Column names are normalized automatically (case-insensitive, snake_case).
See `process_pga_dataset.py` for the full column mapping table.

---

## How to Run the Scripts

### 1. Create Seed Data (no external files required)

Generates benchmark CSVs and a demo player profile into `data/seed/`.

```bash
# From the project root (golfiq-benchmark/)
python scripts/data_ingestion/create_seed_data.py
```

Output files:
- `data/seed/benchmarks.csv` — Aggregate stats for 11 player segments
- `data/seed/demo_profile.csv` — Single demo player
- `data/seed/demo_rounds.csv` — 10 practice/tournament rounds
- `data/seed/demo_holes.csv` — Hole-by-hole data for round 1

> All values are MVP seed estimates, not official statistics.

---

### 2. Process a Raw PGA/Golf Dataset

Place one or more CSV files in `data/raw/`, then run:

```bash
python scripts/data_ingestion/process_pga_dataset.py
```

The script will:
1. Scan `data/raw/` for CSV files
2. Map recognized column names to the standard schema
3. Drop rows missing key fields (`player_name`, `score`)
4. Write cleaned files to `data/processed/`
5. Print a summary of rows processed

If `data/raw/` is empty, the script prints instructions and exits gracefully.

---

### 3. Train the Benchmark Model

After seed data (and optionally processed data) is in place:

```bash
cd models/
python train.py
```

Artifacts (`.pkl`, `.pt`) are saved to `models/artifacts/` and are excluded from git.

---

## Adding External Data Sources

See `importers/approved_sources_template.py` for commented-out templates for:
- **DataGolf API** — requires a paid API key
- **Kaggle datasets** — requires a Kaggle account and valid license review
- **PGA Tour ShotLink** — requires a formal research/media license

To activate an importer:
1. Review the data source's terms of service.
2. Obtain appropriate credentials.
3. Uncomment and configure the relevant class.
4. Run the importer to download data into `data/raw/`.
5. Run `process_pga_dataset.py` to clean the output.

---

## Legal and Licensing Notes

> **Important:** Only use data you are legally permitted to use.

- **Seed data** in `data/seed/` is original MVP estimates — freely usable within this project.
- **Raw datasets** in `data/raw/` must comply with their respective source licenses.
  - Kaggle datasets may be CC0, CC-BY, or have custom terms — check each one individually.
  - DataGolf data is licensed per their API subscription agreement.
  - PGA Tour data requires an explicit research/media license.
- **Do not commit** raw or processed external data to this repository unless the license
  explicitly permits redistribution.

---

## Legitimate Golf Data Sources

| Source | URL | Notes |
|--------|-----|-------|
| DataGolf.com API | https://datagolf.com/api-access | Paid subscription; SG, shot-level data |
| Kaggle — PGA Tour Stats | https://www.kaggle.com/search?q=pga+tour+statistics | Several CC0/CC-BY datasets |
| Kaggle — Golf SG | https://www.kaggle.com/search?q=golf+strokes+gained | SG-focused datasets |
| PGA Tour ShotLink | https://www.pgatour.com/stats/shotlinkintelligence | Media/research license required |
| USGA Course Database | https://www.usga.org | Course/slope ratings (public) |

---

## Warning About Scraping

**Do not implement live web scraping** against golf statistics websites (pgatour.com,
espn.com, golfchannel.com, etc.) without:
1. Reading and understanding the site's Terms of Service.
2. Obtaining explicit written permission where required.
3. Reviewing applicable copyright and database protection laws.

The `PGATourStatsScraper` placeholder in `importers/approved_sources_template.py`
is intentionally not implemented for this reason.
