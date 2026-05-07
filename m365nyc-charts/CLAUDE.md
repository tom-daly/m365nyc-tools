# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Project Does

Generates anonymized, sponsor-friendly attendee statistics from M365 NYC Community Day Eventbrite CSV exports. Produces a markdown report (`sponsorship-data.md`) with aggregate data — no personally identifiable information.

## How to Generate the Report

```bash
python3 generate-sponsorship-data.py
```

Input: `2023.csv`, `2024.csv`, `2025.csv` (Eventbrite attendee exports, git-ignored)
Output: `sponsorship-data.md`

## Architecture

Single Python script (`generate-sponsorship-data.py`) with this processing pipeline:

1. **Load & filter** — reads each year's CSV, keeps only `Attending`/`Checked In` status, excludes `Info Requested` placeholder rows
2. **Company resolution** — uses `Company` field first; if junk/blank (Student, Self, N/A, TBD, etc.), falls back to email domain; personal email domains (gmail, yahoo, etc.) → "Personal / Independent"
3. **Company normalization** — `COMPANY_NORMALIZE` dict merges variants (e.g., "Microsoft Corporation" → "Microsoft", "Flagstar"/"Flagstar Bank" → "Flagstar Bank"). Also applies regex cleanup for missing spaces after commas and around `&`
4. **Job role categorization** — keyword-based classification into ~12 buckets (C-Suite, Manager/Lead, Developer/Engineer, etc.)
5. **Decision-making classification** — maps Eventbrite survey responses to 5 tiers; blank responses excluded from percentage calculations
6. **User type parsing** — pipe-delimited multi-select field split into individual types
7. **Report generation** — all numbers are approximate (attendance rounded up to nearest 10) and shown as percentages only, no raw counts exposed for decision-making, job roles, or user types

## Key Privacy Rules

- Never expose raw attendee counts in decision-making, job roles, or user type sections — percentages only
- Attendance numbers are approximate (rounded up to nearest 10)
- Company list requires 2+ attendees across all years combined to be included
- No individual names, emails, phone numbers, or person-to-company mappings

## Adding a New Year

1. Export the Eventbrite attendee report as CSV
2. Save as `{year}.csv` in this directory
3. Add the year to the `YEARS` list in `generate-sponsorship-data.py`
4. Run `python3 generate-sponsorship-data.py`
5. Review output for new company name variants that need normalization entries
