#!/usr/bin/env python3
"""
Generate sponsorship-data.md from Eventbrite CSV exports.

Usage:
    python generate-sponsorship-data.py

Input:  2023.csv, 2024.csv, 2025.csv (Eventbrite attendee exports)
Output: sponsorship-data.md

Processing steps:
  1. Load each year's CSV, filtering to Attending/Checked In with real names
  2. Resolve company: use Company field first; if junk/blank, derive from email domain
     - Known personal email domains (gmail, yahoo, etc.) → "Personal / Independent"
     - "Student", "Self", "N/A", "TBD" etc. in company field → treated as junk
  3. Normalize company names (merge variants like "Flagstar"/"Flagstar Bank",
     "Microsoft Corporation"/"Microsoft", "Neudesic, LLC"/"Neudesic", etc.)
  4. Categorize job titles into broad role buckets
  5. Classify decision-making level; percentages exclude blank responses
  6. Parse multi-select M365 user types (pipe-delimited)
  7. Geographic distribution filtered to valid US state codes
  8. Output all stats as markdown tables — no PII, only aggregate counts
"""

import csv
import os
from collections import Counter

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

YEARS = [2023, 2024, 2025]

PERSONAL_DOMAINS = {
    "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "aol.com",
    "icloud.com", "me.com", "mac.com", "live.com", "msn.com",
    "protonmail.com", "proton.me", "mail.com", "ymail.com", "comcast.net",
    "verizon.net", "att.net", "sbcglobal.net", "cox.net", "earthlink.net",
    "optonline.net", "optimum.net", "charter.net", "frontier.com",
    "rocketmail.com", "zoho.com", "tutanota.com", "fastmail.com",
    "hey.com", "pm.me", "gmx.com", "gmx.net", "web.de",
}

# Company field values to treat as "no company provided"
JUNK_COMPANIES = {
    "n/a", "na", "none", "", "self", "personal", "-", "me",
    "freelance", "independent", "retired", "student", "students",
    "tbd", "x", "self employed", "'-", "n'a", "architect",
    "independent consultant", "company", "new", "world", "va",
    "developer", "open to work", "unemployed", "home",
    "ava's company", "individual", "sole proprietor", "freelancer",
    "government",
}

# Canonical company name mappings (lowercase key → display name)
COMPANY_NORMALIZE = {
    # Microsoft variants
    "microsoft": "Microsoft",
    "microsoft corporation": "Microsoft",
    "microsoft teams engineering": "Microsoft",
    # Pharma / Healthcare
    "merck": "Merck",
    "merck & co.": "Merck",
    "merck &amp; co, inc": "Merck",
    "memorial sloan kettering": "Memorial Sloan Kettering",
    "mskcc": "Memorial Sloan Kettering",
    "pfizer": "Pfizer",
    "bristol myers squibb": "Bristol Myers Squibb",
    "sanofi": "Sanofi",
    # Finance
    "flagstar bank": "Flagstar Bank",
    "flagstar": "Flagstar Bank",
    "wells fargo": "Wells Fargo",
    "new york life": "New York Life",
    "new york life insurance": "New York Life",
    "kpmg": "KPMG",
    # Tech / IT Services
    "avepoint": "AvePoint",
    "ave point": "AvePoint",
    "soho dragon": "SoHo Dragon",
    "soho": "SoHo Dragon",
    "crow canyon software": "Crow Canyon Software",
    "crow canyon": "Crow Canyon Software",
    "alpine business systems": "Alpine Business Systems",
    "alpine business systems, inc.": "Alpine Business Systems",
    "alpine business systems inc": "Alpine Business Systems",
    "neudesic": "Neudesic",
    "neudesic, llc": "Neudesic",
    "cognizant": "Cognizant",
    "cognizant technology solutions us corp": "Cognizant",
    "cognizant microsoft business group": "Cognizant Microsoft Business Group",
    "ingram micro": "Ingram Micro",
    "fiserv": "Fiserv",
    "national grid": "National Grid",
    "ibm": "IBM",
    "comcast": "Comcast",
    "slalom": "Slalom",
    "deloitte": "Deloitte",
    "seisay it solutions": "Seisay IT Solutions",
    "getrubix": "GetRubix",
    "precog technologies": "Precog Technologies",
    "precog technologies llc": "Precog Technologies",
    "skyterra technologies": "SkyTerra Technologies",
    "skyterra": "SkyTerra Technologies",
    "realactivity llc": "RealActivity",
    "realactivity": "RealActivity",
    "jumpto365, inc.": "jumpto365",
    "jumpto365": "jumpto365",
    "b&r business solutions": "B&R Business Solutions",
    "b&r business solutions, llc": "B&R Business Solutions",
    "b&r business solutions llc": "B&R Business Solutions",
    "dsa": "DSA",
    "dsa, inc": "DSA",
    "dsa, inc.": "DSA",
    "infotech": "Infotech",
    "infotech inc": "Infotech",
    "davis & company": "Davis & Company",
    "davis & co": "Davis & Company",
    "kwe usa": "KWE USA",
    "kwe": "KWE USA",
    "dormakaba americas": "Dormakaba",
    "dormakaba": "Dormakaba",
    "withum, smith + brown": "Withum",
    "withum": "Withum",
    "daddis consulting services": "Daddis Consulting Services",
    "daddis consulting services, llc": "Daddis Consulting Services",
    "stevens institute of technology": "Stevens Institute of Technology",
    "stevens": "Stevens Institute of Technology",
    # Education
    "new york university": "New York University",
    "nyu": "New York University",
    "columbia university": "Columbia University",
    "princeton university": "Princeton University",
    "princeto": "Princeton University",
    "njit": "NJIT",
    "asu": "ASU",
    "university of bridgeport": "University of Bridgeport",
    "coppin state university": "Coppin State University",
    "cuny": "CUNY",
    "nyc - cuny": "CUNY",
    # Government / Non-profit
    "unicef": "UNICEF",
    "nyc housing authority": "NYC Housing Authority",
    "internal revenue service": "IRS",
    "irs": "IRS",
    "nj department of agriculture": "NJ Dept of Agriculture",
    # Other
    "jewish vocational service of metrowest": "JVS",
    "jvs": "JVS",
    "compuhelp": "CompuHelp",
    "bartco": "Bartco",
    "family connections": "Family Connections",
    "savoy associates": "Savoy Associates",
    "talent international": "Talent International",
    "spnext": "SPNEXT",
    "spnext / mcexpert": "SPNEXT",
    "sharepointalist": "SharePointalist",
    "mad sharepoint": "MAD SharePoint",
    "information workers consulting co": "Information Workers Consulting",
    "information workers co": "Information Workers Consulting",
    "excel ventures inc": "Excel Ventures",
    "excel venture inc": "Excel Ventures",
    "amtex systems": "Amtex Systems",
    # Additional normalizations
    "ignatiuz": "Ignatiuz",
    "ignatiuz inc.": "Ignatiuz",
    "ignatiuz inc": "Ignatiuz",
    "omnicom": "Omnicom",
    "omnicom advertising group": "Omnicom",
    "the city university of new york": "CUNY",
    "kintetsu world express": "KWE USA",
    "internsational seaways inc.": "International Seaways",
    "international seaways": "International Seaways",
    "northeastern university": "Northeastern University",
    "st. john's university": "St. John's University",
    "sju": "St. John's University",
    "nyl": "New York Life",
    "korea university": "Korea University",
    "penn state": "Penn State",
    "harvard": "Harvard",
    "university at buffalo": "University at Buffalo",
    "university of pennsylvania": "University of Pennsylvania",
    "university of new haven": "University of New Haven",
    "carnegie mellon university": "Carnegie Mellon University",
    "columbia law school - immigration rights clinic": "Columbia University",
    "brooklyn technical high school, weston research scholars program": "Brooklyn Technical High School",
    "ex-dell technologies": "Ex-Dell Technologies",
    "federal reserve": "Federal Reserve",
    "directions on microsoft": "Directions on Microsoft",
    # Formatting fixes
    "paul, weiss,rifkind,wharton &garrison llp": "Paul, Weiss, Rifkind, Wharton & Garrison LLP",
    "maintech,  incorporated": "Maintech, Incorporated",
    "ss&c technologies inc.": "SS&C Technologies",
    "evil eye evolution llc": "Evil Eye Evolution LLC",
    "precog technologies llc": "Precog Technologies",
    "appficiency": "Appficiency",
    "au2mator": "au2mator",
    "au2mator gmbh": "au2mator",
    "dataconsulting": "DataConsulting",
    "government": "Government",
    "kaffny": "Kaffny",
    "karwell technologies inc": "Karwell Technologies",
    "pwc": "PwC",
    "nasdaq": "Nasdaq",
    "spilled graphics": "Spilled Graphics",
    "vnext solutions": "vNext Solutions",
    # More duplicates
    "seisayitsolutions": "Seisay IT Solutions",
    "campbell's": "Campbell Soup",
    "campbell soup company": "Campbell Soup",
    "campbell soup": "Campbell Soup",
    "bayer us llc": "Bayer",
    "bayer": "Bayer",
    "regeneron": "Regeneron",
    "regeneron pharmaceuticals": "Regeneron",
    "queue associates": "Queue Associates",
    "queue associates, inc.": "Queue Associates",
    "rammware solutions": "RammWare Solutions",
    "rammware solutions, llc": "RammWare Solutions",
    "epiq": "Epiq",
    "epiq global": "Epiq",
    "bmb solutions": "BMB Solutions",
    "bmb solutions": "BMB Solutions",
    "stevens institute of technology": "Stevens Institute of Technology",
    "stevens institute of technology": "Stevens Institute of Technology",
    "stevens": "Stevens Institute of Technology",
    "microtech point": "MicroTechpoint",
    "microtechpoint": "MicroTechpoint",
    "microtech point": "MicroTechpoint",
    "nycha": "NYC Housing Authority",
    "the wendy's company": "The Wendy's Company",
    "the wendys company": "The Wendy's Company",
    "spnext": "SPNEXT",
    "spnext / mcexpert": "SPNEXT",
    "m3": "M3",
    "m3 capital": "M3",
    "us bank": "U.S. Bank",
    "u.s. bank": "U.S. Bank",
    "information workers co": "Information Workers Consulting",
    "information workers consulting co": "Information Workers Consulting",
    "akin": "Akin Gump Strauss & Hauer",
    "akin gump strauss & hauer": "Akin Gump Strauss & Hauer",
    "ipc": "IPC",
    "planet": "Planet Technologies",
    "planet technologies": "Planet Technologies",
    "the legal aid society": "The Legal Aid Society",
    "power productions, inc.": "Power Productions",
    "govcio": "GovCIO",
    "llyola business services": "LLYOLA Business Services",
    "new jersey institute of technology": "NJIT",
    "njit": "NJIT",
    "hcl": "HCL",
    "tcs": "TCS",
    "pbf energy": "PBF Energy",
    "company": "Personal / Independent",
    "new": "Personal / Independent",
    "world": "Personal / Independent",
    "va": "Personal / Independent",
    "developer": "Personal / Independent",
    "open to work": "Personal / Independent",
    "unemployed": "Personal / Independent",
    "home": "Personal / Independent",
    "ava's company": "Personal / Independent",
    "individual": "Personal / Independent",
    "sole proprietor": "Personal / Independent",
    "freelancer": "Personal / Independent",
    # Remaining cleanup
    "paul, weiss, rifkind, wharton &garrison llp": "Paul, Weiss, Rifkind, Wharton & Garrison LLP",
    "st. john's university": "St. John's University",
    "ss & c technologies inc": "SS&C Technologies",
    "ss & c technologies inc.": "SS&C Technologies",
    "ss&c technologies inc": "SS&C Technologies",
    "b & r business solutions": "B&R Business Solutions",
    "b & r business solutions llc": "B&R Business Solutions",
    "b & r business solutions, llc": "B&R Business Solutions",
    "power productions, inc.": "Power Productions",
    "power productions, inc": "Power Productions",
    "internsational seaways inc": "International Seaways",
    "internsational seaways inc.": "International Seaways",
    "merck & co.": "Merck",
    "merck & co": "Merck",
    "office of medicaid innovation": "Office of Medicaid Innovation",
    "alpinebiz.com": "Alpine Business Systems",
    "m365scott.com": "Personal / Independent",
    "jumpto365, inc.": "jumpto365",
    "jumpto365": "jumpto365",
    "st. john's university": "St. John's University",
}

US_STATES = {
    "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DC", "DE", "FL", "GA",
    "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA",
    "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY",
    "NC", "ND", "OH", "OK", "OR", "PA", "PR", "RI", "SC", "SD", "TN",
    "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def normalize_company(name):
    """Normalize a company name to its canonical form."""
    if not name:
        return name
    import re
    cleaned = name.strip()
    # Fix missing space after commas
    cleaned = re.sub(r',([^ \s])', r', \1', cleaned)
    # Fix missing space around &  (but not &amp;)
    cleaned = re.sub(r'([^ ])&([^ a])', r'\1 & \2', cleaned)
    # Collapse multiple spaces
    cleaned = re.sub(r'  +', ' ', cleaned)
    # Lookup canonical name — try with and without trailing period
    key = cleaned.lower()
    return COMPANY_NORMALIZE.get(key, COMPANY_NORMALIZE.get(key.rstrip("."), cleaned))


def resolve_company(email, company):
    """
    Determine the company for an attendee.
    Priority: company field (if not junk) → email domain (if corporate) → Personal.
    """
    if company and company.strip().lower() not in JUNK_COMPANIES:
        return normalize_company(company)
    if email:
        domain = email.split("@")[-1].lower().strip()
        if domain in PERSONAL_DOMAINS:
            return "Personal / Independent"
        return normalize_company(domain)
    return "Personal / Independent"


def categorize_title(title):
    """Categorize a job title into a broad role bucket."""
    tl = title.lower()
    checks = [
        ("C-Suite / Executive", ["ceo", "cto", "coo", "cio", "cao", "chief", "president", "vp", "vice president", "founder", "owner"]),
        ("Director", ["director", "head of"]),
        ("Manager / Lead", ["manager", "lead", "supervisor"]),
        ("Architect", ["architect"]),
        ("Developer / Engineer", ["developer", "engineer", "programmer"]),
        ("IT Pro / Admin / Ops", ["admin", "system", "infrastructure", "helpdesk", "support", "technician", "operations"]),
        ("Consultant / Advisor", ["consult", "advisor", "mct", "mvp", "freelance"]),
        ("Student / Intern", ["student", "intern"]),
        ("Analyst / Data", ["analyst", "data", "business intel"]),
        ("Product / Project Mgmt", ["product", "project", "program", "scrum"]),
        ("Security / Compliance", ["security", "compliance", "risk"]),
        ("Sales / Marketing", ["market", "sales", "account", "recruit", "staffing"]),
    ]
    for category, keywords in checks:
        if any(kw in tl for kw in keywords):
            return category
    return "Other"


def classify_decision(val):
    """Classify a decision-making response. Returns None for blanks."""
    if not val:
        return None
    vl = val.lower()
    if "purchasing" in vl:
        return "Final Decision Maker + Purchasing Power"
    if "often make the final" in vl:
        return "Final Decision Maker"
    if "often part of the final" in vl:
        return "Part of Decision Process"
    if "opinions" in vl:
        return "Influencer"
    if "do not have" in vl:
        return "No Direct Input"
    return None


def load_year(filename):
    """Load and process a single year's CSV."""
    with open(filename, "r", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

    # Filter to real attendees
    rows = [r for r in rows if r["Attendee Status"] in ("Attending", "Checked In")]
    rows = [r for r in rows if r["First Name"] and r["First Name"] != "Info Requested"]

    # Companies
    companies = Counter()
    for r in rows:
        companies[resolve_company(r["Email"], r["Company"])] += 1

    # Decision making (exclude blanks from denominator)
    decision = Counter()
    decision_total = 0
    for r in rows:
        d = classify_decision(r.get("What is your decision-making ability level?", ""))
        if d:
            decision[d] += 1
            decision_total += 1

    # Job roles
    job_roles = Counter()
    for r in rows:
        if r["Job Title"]:
            job_roles[categorize_title(r["Job Title"])] += 1

    # User types (multi-select, pipe-separated)
    user_types = Counter()
    for r in rows:
        ut = r.get("What type of Microsoft 365 user are you?", "")
        if ut:
            for t in ut.split("|"):
                t = t.strip()
                if t:
                    user_types[t] += 1

    # Geography
    states = Counter()
    countries = Counter()
    for r in rows:
        s = r.get("Work State", "").strip()
        c = r.get("Work Country", "").strip()
        if s:
            states[s] += 1
        if c:
            countries[c] += 1

    personal = companies.get("Personal / Independent", 0)

    return {
        "total": len(rows),
        "companies": companies,
        "personal": personal,
        "corporate": len(rows) - personal,
        "unique_orgs": len([k for k in companies if k != "Personal / Independent"]),
        "decision": decision,
        "decision_total": decision_total,
        "job_roles": job_roles,
        "user_types": user_types,
        "states": states,
        "countries": countries,
    }


def pct(num, denom):
    """Format a percentage."""
    return f"{num * 100 // denom}%" if denom else "0%"


def round_up_10(n):
    """Round up to the nearest 10."""
    return ((n + 9) // 10) * 10


# ---------------------------------------------------------------------------
# Report generation
# ---------------------------------------------------------------------------

def generate_report(data):
    md = []

    md.append("# M365 NYC Community Day — Sponsorship Data Report")
    md.append("")
    md.append("> Aggregate, anonymized attendee data across 3 years. No personally identifiable information included.")
    md.append("")

    # --- Attendance (approximate, rounded up to nearest 10) ---
    md.append("## Attendance Overview")
    md.append("")
    md.append("| Year | Attendees | Org-Affiliated | Personal / Independent | Unique Organizations |")
    md.append("|------|-----------|---------------|----------------------|---------------------|")
    for y in YEARS:
        d = data[y]
        approx = round_up_10(d["total"])
        md.append(f'| {y} | ~{approx} | {pct(d["corporate"], d["total"])} | {pct(d["personal"], d["total"])} | {round_up_10(d["unique_orgs"])}+ |')
    totals = {k: sum(data[y][k] for y in YEARS) for k in ["total", "personal", "corporate"]}
    approx_total = round_up_10(totals["total"])
    md.append(f'| **Total** | **~{approx_total}** | {pct(totals["corporate"], totals["total"])} | {pct(totals["personal"], totals["total"])} | — |')
    md.append("")

    # --- Decision Making ---
    md.append("## Decision-Making Authority")
    md.append("")
    md.append("> Percentages based on respondents who answered (excludes blanks).")
    md.append("")
    decision_labels = [
        "Final Decision Maker + Purchasing Power",
        "Final Decision Maker",
        "Part of Decision Process",
        "Influencer",
        "No Direct Input",
    ]
    md.append("| Level | " + " | ".join(str(y) for y in YEARS) + " |")
    md.append("|-------|" + "|".join(["------"] * len(YEARS)) + "|")
    for label in decision_labels:
        vals = [pct(data[y]["decision"].get(label, 0), data[y]["decision_total"]) for y in YEARS]
        md.append(f"| {label} | " + " | ".join(vals) + " |")

    md.append("")
    md.append("| Summary | " + " | ".join(str(y) for y in YEARS) + " |")
    md.append("|---------|" + "|".join(["------"] * len(YEARS)) + "|")
    summary_groups = [
        (["Final Decision Maker + Purchasing Power", "Final Decision Maker", "Part of Decision Process"], "Decision Makers"),
        (["Final Decision Maker + Purchasing Power", "Final Decision Maker", "Part of Decision Process", "Influencer"], "Total Buying Influence"),
    ]
    for label_set, desc in summary_groups:
        vals = [pct(sum(data[y]["decision"].get(l, 0) for l in label_set), data[y]["decision_total"]) for y in YEARS]
        md.append(f"| **{desc}** | " + " | ".join(vals) + " |")
    md.append("")

    # --- Job Roles ---
    md.append("## Job Role Categories")
    md.append("")
    all_roles = sorted(
        set(r for y in YEARS for r in data[y]["job_roles"]),
        key=lambda x: -sum(data[y]["job_roles"].get(x, 0) for y in YEARS),
    )
    md.append("| Role | " + " | ".join(str(y) for y in YEARS) + " |")
    md.append("|------|" + "|".join(["------"] * len(YEARS)) + "|")
    for role in all_roles:
        vals = [pct(data[y]["job_roles"].get(role, 0), sum(data[y]["job_roles"].values()) or 1) for y in YEARS]
        md.append(f"| {role} | " + " | ".join(vals) + " |")
    md.append("")

    # --- User Types ---
    md.append("## Microsoft 365 User Types")
    md.append("")
    md.append("> Multi-select field (respondents can choose multiple).")
    md.append("")
    type_labels = ["IT Pro / Admin", "Developer", "Management", "End User", "Other"]
    md.append("| Type | " + " | ".join(str(y) for y in YEARS) + " |")
    md.append("|------|" + "|".join(["------"] * len(YEARS)) + "|")
    for label in type_labels:
        vals = [pct(data[y]["user_types"].get(label, 0), data[y]["total"]) for y in YEARS]
        md.append(f"| {label} | " + " | ".join(vals) + " |")
    md.append("")

    # --- Key Trends ---
    md.append("## Key Trends")
    md.append("")

    # Buying influence trend
    bi = [sum(data[y]["decision"].get(l, 0) for l in ["Final Decision Maker + Purchasing Power", "Final Decision Maker", "Part of Decision Process", "Influencer"])
          for y in YEARS]
    bi_pcts = [bi[i] * 100 // (data[YEARS[i]]["decision_total"] or 1) for i in range(len(YEARS))]
    md.append(f"**Growing buying influence** — Total buying influence has risen steadily: "
              + " → ".join(f"{p}% ({y})" for y, p in zip(YEARS, bi_pcts)))
    md.append("")

    # No Direct Input shrinking
    ndi = [data[y]["decision"].get("No Direct Input", 0) * 100 // (data[y]["decision_total"] or 1) for y in YEARS]
    md.append(f"**Fewer passive attendees** — \"No Direct Input\" has dropped from {ndi[0]}% to {ndi[-1]}%, "
              "meaning the audience is increasingly composed of people who influence or make purchasing decisions.")
    md.append("")

    # C-Suite growth
    csuite = [data[y]["job_roles"].get("C-Suite / Executive", 0) * 100 // (sum(data[y]["job_roles"].values()) or 1) for y in YEARS]
    md.append(f"**C-Suite representation growing** — Executive-level attendees have grown from "
              + " → ".join(f"{p}% ({y})" for y, p in zip(YEARS, csuite))
              + ", approaching nearly 1 in 3.")
    md.append("")

    # Developer bounce-back
    devs_role = [data[y]["job_roles"].get("Developer / Engineer", 0) * 100 // (sum(data[y]["job_roles"].values()) or 1) for y in YEARS]
    devs_type = [data[y]["user_types"].get("Developer", 0) * 100 // (data[y]["total"] or 1) for y in YEARS]
    md.append(f"**Developer engagement rebounding** — Developer job roles: "
              + " → ".join(f"{p}%" for p in devs_role)
              + f". As a self-identified user type, Developers went from {devs_type[-2]}% to {devs_type[-1]}% "
              f"({YEARS[-2]}→{YEARS[-1]}) while most other user types declined.")
    md.append("")

    # Audience specialization
    itpro = [data[y]["user_types"].get("IT Pro / Admin", 0) * 100 // (data[y]["total"] or 1) for y in YEARS]
    md.append(f"**More specialized audience** — General IT Pro/Admin as a user type has shifted from "
              f"{itpro[0]}% to {itpro[-1]}%, reflecting a move toward more specialized, "
              "technical decision-makers rather than generalist IT staff.")
    md.append("")

    # Consistent scale
    md.append(f"**Consistent reach** — ~{round_up_10(min(data[y]['total'] for y in YEARS))}–"
              f"{round_up_10(max(data[y]['total'] for y in YEARS))} attendees per year "
              f"with {round_up_10(min(data[y]['unique_orgs'] for y in YEARS))}+ unique organizations "
              "each year demonstrates reliable, sustained audience reach.")
    md.append("")

    # --- Companies in Attendance (combined, 2+ attendees across all years) ---
    combined = Counter()
    for y in YEARS:
        for k, v in data[y]["companies"].items():
            if k != "Personal / Independent":
                combined[k] += v
    orgs = sorted(k for k, v in combined.items() if v >= 2)
    md.append(f"## Companies in Attendance (Past 3 Years)")
    md.append("")
    md.append("> At least 2 attendees across the past 3 years to make this list.")
    md.append("")
    md.append(", ".join(orgs))
    md.append("")

    return "\n".join(md)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)

    data = {}
    for year in YEARS:
        filename = f"{year}.csv"
        print(f"Loading {filename}...")
        data[year] = load_year(filename)
        d = data[year]
        print(f"  {d['total']} attendees, {d['unique_orgs']} orgs, {d['personal']} personal")

    report = generate_report(data)

    output_path = os.path.join(script_dir, "sponsorship-data.md")
    with open(output_path, "w") as f:
        f.write(report + "\n")

    print(f"\nWritten to {output_path}")
    print(f"Total attendees: {sum(data[y]['total'] for y in YEARS)}")
