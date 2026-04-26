"""
approved_sources_template.py
-----------------------------
Template for adding approved, licensed data source importers to GolfIQ Benchmark.

IMPORTANT:
  Do not implement live scraping without reviewing the terms of service
  of the target website or API. Unauthorized scraping may violate terms
  of use, copyright law, or data licensing agreements.

HOW TO USE THIS FILE:
  1. Pick the importer class that matches your approved data source.
  2. Uncomment the class and fill in the credentials / API key.
  3. Run the importer to download data into data/raw/.
  4. Run process_pga_dataset.py to clean and normalize the data.

WHERE TO FIND LEGITIMATE GOLF DATA:
  - DataGolf.com — https://datagolf.com/api-access
      Subscription API with strokes-gained, shot-level, and historical data.
      Requires a paid API key. See their terms: https://datagolf.com/terms
  - Kaggle — https://www.kaggle.com/search?q=pga+tour+golf+statistics
      Search terms: "PGA Tour statistics", "golf strokes gained", "OWGR".
      Most datasets are CC0 or CC-BY; verify each dataset's license before use.
  - ShotLink Intelligence — https://www.pgatour.com/stats/shotlinkintelligence
      Official PGA Tour data. Requires a research/media license agreement.
  - USGA Handicap System — https://www.usga.org/content/usga/home-page/handicapping.html
      Course/slope ratings are public; individual handicap data is private.
  - R&A — https://www.randa.org/en/rog/the-rules-of-golf
      Rules and equipment standards. Not a stats API.

"""

# =============================================================================
# DataGolf API Importer (COMMENTED OUT — requires API key)
# =============================================================================
# To activate:
#   1. Sign up at https://datagolf.com/api-access
#   2. Set environment variable: export DATAGOLF_API_KEY="your_key_here"
#   3. Uncomment the class and install dependencies: pip install requests

# import os
# import requests
# from pathlib import Path
#
# RAW_DIR = Path(__file__).resolve().parents[3] / "data" / "raw"
#
# class DataGolfAPIImporter:
#     """
#     Fetches data from the DataGolf.com API.
#     Requires a valid API key with appropriate subscription tier.
#     Review DataGolf's terms of service before use:
#       https://datagolf.com/terms
#     """
#
#     BASE_URL = "https://feeds.datagolf.com"
#
#     def __init__(self):
#         self.api_key = os.environ.get("DATAGOLF_API_KEY")
#         if not self.api_key:
#             raise EnvironmentError(
#                 "DATAGOLF_API_KEY environment variable is not set. "
#                 "Obtain a key at https://datagolf.com/api-access"
#             )
#
#     def fetch_tour_schedule(self, tour: str = "pga", season: int = 2024) -> dict:
#         """Fetch the tour schedule for a given season."""
#         url = f"{self.BASE_URL}/get-schedule"
#         params = {"tour": tour, "file_format": "json", "key": self.api_key}
#         response = requests.get(url, params=params, timeout=30)
#         response.raise_for_status()
#         return response.json()
#
#     def fetch_strokes_gained(self, event_id: str, tour: str = "pga") -> dict:
#         """Fetch strokes-gained breakdown for a specific event."""
#         url = f"{self.BASE_URL}/historical-raw-data/rounds"
#         params = {
#             "tour": tour,
#             "event_id": event_id,
#             "file_format": "json",
#             "key": self.api_key,
#         }
#         response = requests.get(url, params=params, timeout=30)
#         response.raise_for_status()
#         return response.json()
#
#     def save_to_raw(self, data: dict, filename: str):
#         """Save JSON response as a file in data/raw/."""
#         import json
#         RAW_DIR.mkdir(parents=True, exist_ok=True)
#         out = RAW_DIR / filename
#         with open(out, "w") as f:
#             json.dump(data, f, indent=2)
#         print(f"Saved: {out}")


# =============================================================================
# Kaggle Dataset Importer (COMMENTED OUT — requires kaggle credentials)
# =============================================================================
# To activate:
#   1. Install the Kaggle CLI: pip install kaggle
#   2. Place your kaggle.json API token at ~/.kaggle/kaggle.json
#      (Download from https://www.kaggle.com/account -> API -> Create New Token)
#   3. Verify dataset license before downloading.
#   4. Uncomment the class below.

# import subprocess
# from pathlib import Path
#
# RAW_DIR = Path(__file__).resolve().parents[3] / "data" / "raw"
#
# class KaggleDatasetImporter:
#     """
#     Downloads golf datasets from Kaggle using the Kaggle CLI.
#     Each dataset must be individually reviewed for its license terms.
#
#     Suggested search queries on Kaggle:
#       - "pga tour statistics"
#       - "golf strokes gained"
#       - "golf course ratings"
#       - "junior golf statistics"
#     """
#
#     def download(self, dataset_slug: str, destination: Path = RAW_DIR):
#         """
#         Downloads a Kaggle dataset by slug (e.g., 'bradklassen/pga-tour-20102018-data').
#         The slug is the part of the Kaggle URL after kaggle.com/datasets/.
#         """
#         destination.mkdir(parents=True, exist_ok=True)
#         cmd = [
#             "kaggle", "datasets", "download",
#             "--dataset", dataset_slug,
#             "--path", str(destination),
#             "--unzip",
#         ]
#         print(f"Running: {' '.join(cmd)}")
#         result = subprocess.run(cmd, capture_output=True, text=True)
#         if result.returncode != 0:
#             print(f"ERROR: {result.stderr}")
#         else:
#             print(f"Downloaded to: {destination}")
#             print(result.stdout)
#
#     # Example known public datasets (verify licenses before use):
#     KNOWN_DATASETS = {
#         "pga_tour_2010_2018": "bradklassen/pga-tour-20102018-data",
#         "pga_tour_stats":     "jmpark746/pga-tour-data-2010-2018",
#         "golf_courses_usa":   "ksjpsagwa/us-golf-courses",
#     }


# =============================================================================
# PGA Tour Stats Scraper (COMMENTED OUT — requires permission/license)
# =============================================================================
# The PGA Tour website (pgatour.com) has terms of service that restrict
# automated scraping. Do NOT implement a scraper for this site without:
#   1. Obtaining written permission from the PGA Tour.
#   2. Reviewing the ShotLink Intelligence research license program.
#   3. Consulting legal counsel if you plan commercial use.
#
# Reference: https://www.pgatour.com/legal/terms-of-use
# ShotLink: https://www.pgatour.com/stats/shotlinkintelligence
#
# Do not implement live scraping without reviewing terms of service.

# import requests
# from bs4 import BeautifulSoup
#
# class PGATourStatsScraper:
#     """
#     PLACEHOLDER ONLY — DO NOT USE without a valid license/permission.
#
#     The PGA Tour's terms of service prohibit unauthorized data scraping.
#     This class is intentionally left unimplemented as a reminder.
#     Use the DataGolf API or licensed Kaggle datasets instead.
#     """
#
#     def __init__(self):
#         raise NotImplementedError(
#             "PGATourStatsScraper is not implemented. "
#             "Use DataGolfAPIImporter or KaggleDatasetImporter instead. "
#             "See approved_sources_template.py for details."
#         )
