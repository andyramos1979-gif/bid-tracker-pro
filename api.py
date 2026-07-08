"""
Local API server — reads ARE_BID_TRACKER_2026.xlsx and serves JSON to the React app.
Run: source venv/bin/activate && python api.py
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
from pathlib import Path
import hashlib
import sys
import uuid
import openpyxl

app = Flask(__name__)
CORS(app)

AGENT_DIR = Path(
    "/Users/andyramos/Developer"
    "/06_Pyhton_Scripts/02_Bid_Pyhton_Scripts/ARE_BID_TRACKER_AGENT"
)
EXCEL_FILE  = AGENT_DIR / "ARE_BID_TRACKER_2026.xlsx"
SAM_RAW_DIR = AGENT_DIR / "sam_raw"

# Same cross-process lock + atomic save Financial Hub's backend/utils/file_locking.py
# and ARE_BID_TRACKER_AGENT's other writers use against this same workbook — without
# it, this process's writes race unlocked against theirs (reproducible zipfile.BadZipFile
# corruption). Reused, not reimplemented, so the lock path derivation can't drift.
sys.path.insert(0, str(AGENT_DIR))
from excel_lock_utils import workbook_lock, atomic_save  # noqa: E402


def _build_sam_lookup():
    """Build {notice_id: {due_date, agency}, title_lower: {due_date, agency}} from raw SAM JSON."""
    lookup_id    = {}
    lookup_title = {}
    if not SAM_RAW_DIR.exists():
        return lookup_id, lookup_title
    import json
    for f in sorted(SAM_RAW_DIR.glob("*.json")):
        try:
            data = json.loads(f.read_text())
        except Exception:
            continue
        for op in data.get("opportunitiesData", []):
            due = (op.get("responseDeadLine") or op.get("archiveDate") or "")[:10]
            full_path = op.get("fullParentPathName") or ""
            agency = full_path.split(".")[-1].strip() if full_path else ""
            notice_id = (op.get("noticeId") or "").lower()
            title_key = (op.get("title") or "").strip().lower()
            entry = {"due_date": due, "agency": agency}
            if notice_id:
                lookup_id[notice_id] = entry
            if title_key:
                lookup_title[title_key] = entry
    return lookup_id, lookup_title


def _fmt_date(val):
    """Convert Excel datetime objects or strings to YYYY-MM-DD."""
    if not val:
        return ""
    from datetime import datetime as dt
    if isinstance(val, dt):
        return val.strftime("%Y-%m-%d")
    s = str(val).strip()
    # Handle "4/13/26 0:00" style
    for fmt in ("%m/%d/%y %H:%M", "%m/%d/%Y %H:%M", "%Y-%m-%d %H:%M:%S", "%Y-%m-%d"):
        try:
            return dt.strptime(s, fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue
    return s[:10]  # fallback: first 10 chars


def _score_to_priority(score):
    try:
        s = int(score or 0)
    except (TypeError, ValueError):
        s = 0
    if s >= 100: return "Critical"
    if s >= 10:  return "High"
    if s >= 5:   return "Medium"
    return "Low"


def _load_sheet(tab_name):
    if not EXCEL_FILE.exists():
        return None, []
    wb = openpyxl.load_workbook(EXCEL_FILE, read_only=True, data_only=True)
    if tab_name not in wb.sheetnames:
        return None, []
    ws = wb[tab_name]
    rows = list(ws.iter_rows(values_only=True))
    if not rows:
        return None, []
    headers = [str(h).strip().replace('\xa0', '').strip() if h else "" for h in rows[0]]
    return headers, rows[1:]


def _latest_hits_tab():
    if not EXCEL_FILE.exists():
        return None
    wb = openpyxl.load_workbook(EXCEL_FILE, read_only=True, data_only=True)
    for sheet in sorted(wb.sheetnames, reverse=True):
        if sheet.startswith("Hits "):
            return sheet
    return None


@app.route("/api/bids")
def get_bids():
    # Serve from the Bid Tracker tab — these are the filtered strong leads
    headers, data_rows = _load_sheet("Bid Tracker")
    if not headers:
        return jsonify([])

    import re
    sam_by_id, sam_by_title = _build_sam_lookup()

    bids = []
    for i, row in enumerate(data_rows):
        d = dict(zip(headers, row))
        if not d.get("Bid / Opportunity Name"):
            continue

        score = d.get("AI Score") or 0
        try:
            score = int(score)
        except (TypeError, ValueError):
            score = 0

        status_raw = str(d.get("Status") or "Identified")
        status_map = {"Identified": "Open", "Submitted": "Open", "Won": "Awarded", "Lost": "Closed", "Archived": "Closed"}
        status = status_map.get(status_raw, "Open")

        notes = str(d.get("Notes / Rationale") or "")
        # SAM Link: dedicated column first, fall back to regex from Notes
        link = str(d.get("SAM Link") or "").strip()
        if not link:
            m = re.search(r"https?://\S+", notes)
            link = m.group(0) if m else ""

        # Due date and agency: use Excel value, fall back to SAM raw lookup
        notice_id = str(d.get("Solicitation / Notice ID") or "").lower()
        title_key = str(d.get("Bid / Opportunity Name") or "").strip().lower()
        sam_info  = sam_by_id.get(notice_id) or sam_by_title.get(title_key) or {}

        due    = _fmt_date(d.get("Due Date")) or sam_info.get("due_date", "")
        agency = str(d.get("Agency / Department") or "") or sam_info.get("agency", "")
        # Ignore placeholder values left from old data
        if agency in ("Prompt", "VA Medical Center") and sam_info.get("agency"):
            agency = sam_info["agency"]

        prefix = _parse_prefix(str(d.get("Tags Prefix") or ""))

        bids.append({
            "id":            str(d.get("Solicitation / Notice ID") or f"bt-{i}"),
            "status":        status,
            "dueDate":       due,
            "title":         str(d.get("Bid / Opportunity Name") or ""),
            "state":         str(d.get("State") or ""),
            "city":          str(d.get("City")  or ""),
            "facility":      agency or "VA Medical Center",
            "bidAmount":     str(d.get("Bid Amount") or ""),
            "awardedAmount": str(d.get("Award Amount") or ""),
            "contractor":    "",
            "priority":      _score_to_priority(score),
            "category":      prefix["category"] or "Electrical",
            "starred":       prefix["starred"],
            "link":          link,
            "score":         score,
            "whyItScored":   notes,
            "setAside":      "",
            "triennial":     "triennial" in notes.lower(),
            "maintenance":   "maintenance" in notes.lower(),
            "postedDate":    str(d.get("Date Added") or ""),
            "naics":         str(d.get("NAICS") or ""),
            "folderPath":    str(d.get("Folder Path") or ""),
            "notes":         [],
            "chk_sf1449":     bool(d.get("SF1449")),
            "chk_sow_pws":    bool(d.get("SOW/PWS")),
            "chk_pricing":    bool(d.get("Pricing")),
            "chk_past_perf":  bool(d.get("Past Perf")),
            "chk_osha_safety": bool(d.get("OSHA")),
            "chk_licenses":   bool(d.get("Licenses")),
            "chk_site_visit": bool(d.get("Site Visit")),
            "chk_sub_loi":    bool(d.get("Sub LOI")),
            "chk_compliance": bool(d.get("Compliance")),
        })

    return jsonify(bids)


@app.route("/api/recompete")
def get_recompete():
    headers, data_rows = _load_sheet("Recompete Watch")
    if not headers:
        return jsonify([])

    rows = []
    for row in data_rows:
        d = dict(zip(headers, row))
        rows.append({
            "status":        str(d.get("Status") or ""),
            "daysUntil":     d.get("Days Until") or 0,
            "city":          str(d.get("City")   or ""),
            "state":         str(d.get("State")  or ""),
            "recompeteDate": str(d.get("Recompete Date") or ""),
            "awardDate":     str(d.get("Award Date") or ""),
            "cycle":         str(d.get("Cycle")  or ""),
            "contractor":    str(d.get("Contractor") or ""),
            "areWin":        str(d.get("ARE Win?") or "NO"),
            "amount":        str(d.get("Est. Amount") or ""),
            "contractId":    str(d.get("Contract ID") or ""),
            "title":         str(d.get("Title") or ""),
        })

    return jsonify(rows)


PROJECTS_JSON = AGENT_DIR / "exports" / "projects.json"


def _read_manual_projects():
    """Read from the hand-edited 'Project' tab in Excel (handles trailing spaces)."""
    # Find the tab — user may have named it 'Project' or 'Project '
    tab_name = None
    if EXCEL_FILE.exists():
        import openpyxl as _ox
        wb = _ox.load_workbook(EXCEL_FILE, read_only=True, data_only=True)
        skip = {"Projects", "Project_Milestones", "Project_Invoices", "Project_Issues", "Project_Notes"}
        for s in wb.sheetnames:
            if s.strip() == "Project" and s not in skip:
                tab_name = s
                break
        wb.close()
    if not tab_name:
        return []
    headers, rows = _load_sheet(tab_name)
    if not headers:
        return []

    projects = []
    project_by_id = {}
    for i, row in enumerate(rows):
        d = dict(zip(headers, row))
        # Normalize keys (strip non-breaking spaces from dict keys too)
        d = {k.replace('\xa0', '').strip(): v for k, v in d.items()}
        title = str(d.get("PROJECT TITLE") or "").strip().replace('\xa0', '')
        if not title:
            continue

        # Stable ID lives in the "Project ID" column — read it back rather than
        # recomputing from the title, so renaming a project can't fork it into a
        # new row (the id the UI is holding onto must keep resolving after an edit).
        # Hash-of-title is only a fallback for rows saved before this column existed.
        pid = str(d.get("Project ID") or "").strip() or \
            "proj-" + hashlib.md5(title.encode()).hexdigest()[:8]

        def _d(col):
            v = d.get(col)
            if v is None:
                return ""
            if hasattr(v, "strftime"):
                return v.strftime("%Y-%m-%d")
            return str(v).strip()

        def _f(col):
            try:
                return float(str(d.get(col) or "0").replace("$", "").replace(",", "") or 0)
            except (ValueError, TypeError):
                return 0.0

        status = _d("STATUS") or "In Progress"
        milestones_raw = _d("Milestones")
        milestones = [{"id": f"m-{j}", "title": m.strip(), "completed": False}
                      for j, m in enumerate(milestones_raw.split(",")) if m.strip()] if milestones_raw else []

        inv_amt  = _f("Invoices Amount ($)")
        inv2_amt = _f("2nd nvoices Amount ($)")
        pending  = _f("Pending_Paid")
        invoices = []
        if inv_amt:  invoices.append({"id": "inv-1", "amount": inv_amt,  "status": "Paid"})
        if inv2_amt: invoices.append({"id": "inv-2", "amount": inv2_amt, "status": "Paid"})
        if pending:  invoices.append({"id": "inv-p", "amount": pending,  "status": "Pending"})

        collected      = _f("COLLECTED VALUE (%$)") or (inv_amt + inv2_amt)
        contract       = _f("CONTRACT VALUE ($)")
        sub            = _f("SUB CONTRACTOR VALUE ($)")
        material       = _f("MATERIAL")
        profit         = _f("PROFIT")
        onedrive_folder = _d("Onedrive location")

        # derive progress from collected / contract
        progress = int(min(100, (collected / contract * 100))) if contract else 0

        proj = {
            "id":             pid,
            "title":          title,
            "category":       _d("Category"),
            "facility":       _d("FACILITY"),
            "status":         status,
            "phase":          _d("PHASE") or "Execution",
            "progress":       progress,
            "startDate":      _d("START DATE"),
            "endDate":        _d("END DATE"),
            "contractValue":  contract,
            "collectedValue": collected,
            "subContractor":  sub,
            "material":       material,
            "profit":         profit,
            "milestones":      milestones,
            "invoices":        invoices,
            "issues":          [],
            "notes":           [],
            "onedriveFolder":  onedrive_folder,
        }
        projects.append(proj)
        project_by_id[pid] = proj

    # Attach notes from Project_Notes sheet
    if EXCEL_FILE.exists() and project_by_id:
        try:
            import openpyxl as _ox2
            wb2 = _ox2.load_workbook(EXCEL_FILE, read_only=True, data_only=True)
            if "Project_Notes" in wb2.sheetnames:
                note_rows = list(wb2["Project_Notes"].iter_rows(values_only=True))
                if len(note_rows) > 1:
                    hdr = {str(c or "").strip(): i for i, c in enumerate(note_rows[0])}
                    pid_col = hdr.get("Project ID")
                    txt_col = hdr.get("Text")
                    if pid_col is not None and txt_col is not None:
                        for nr in note_rows[1:]:
                            npid = str(nr[pid_col] or "").strip()
                            ntxt = str(nr[txt_col] or "").strip()
                            if npid in project_by_id and ntxt:
                                project_by_id[npid]["notes"].append(ntxt)
            wb2.close()
        except Exception:
            pass

    return projects


@app.route("/api/projects", methods=["GET"])
def get_projects():
    # Primary: manual "Project" tab the user edits directly
    projects = _read_manual_projects()
    return jsonify(projects)


def _upsert_normalized_tab(wb, tab_name, proj_id, items, col_map):
    """Delete all rows for proj_id in a normalized tab, then re-insert items."""
    import datetime as _dt
    if tab_name not in wb.sheetnames:
        return
    ws = wb[tab_name]
    raw_hdrs = [str(c.value).replace('\xa0','').strip() if c.value else "" for c in ws[1]]

    # Delete existing rows for this project (bottom-up to preserve row indices)
    pid_col = next((i for i, h in enumerate(raw_hdrs) if h.lower() == "project id"), None)
    if pid_col is not None:
        rows_to_delete = [
            row[0].row for row in ws.iter_rows(min_row=2)
            if str(row[pid_col].value or "").strip() == str(proj_id)
        ]
        for r in sorted(rows_to_delete, reverse=True):
            ws.delete_rows(r)

    # Re-insert
    now = _dt.datetime.now().strftime("%Y-%m-%d")
    for item in items:
        new_row = [""] * len(raw_hdrs)
        for col_name, value in col_map(proj_id, item, now).items():
            for i, h in enumerate(raw_hdrs):
                if h.lower() == col_name.lower():
                    new_row[i] = value
                    break
        ws.append(new_row)


@app.route("/api/projects", methods=["POST"])
def save_project():
    """Upsert a project and its milestones/invoices/issues/notes into Excel."""
    import datetime as _dt
    proj = request.get_json(force=True)
    if not EXCEL_FILE.exists():
        return jsonify({"error": "Excel file not found"}), 500

    # Stable ID: reuse the one the client sent back (from a prior GET) if present,
    # otherwise this is a brand-new project — mint one now, once, and never derive
    # it from mutable fields like title again.
    proj_id = str(proj.get("id") or "").strip() or f"proj-{uuid.uuid4().hex[:8]}"

    with workbook_lock(EXCEL_FILE):
        wb = openpyxl.load_workbook(EXCEL_FILE, data_only=False)
        tab = next((s for s in wb.sheetnames if s.strip() == "Project"), None)
        if not tab:
            return jsonify({"error": "Project sheet not found"}), 500

        ws = wb[tab]
        raw_headers = [str(c.value).replace('\xa0', '').strip() if c.value else "" for c in ws[1]]

        def col_idx(name):
            for i, h in enumerate(raw_headers):
                if h.lower() == name.lower():
                    return i + 1
            return None

        milestones = proj.get("milestones") or []
        invoices   = proj.get("invoices")   or []
        issues     = proj.get("issues")     or []
        notes      = proj.get("notes")      or []

        paid_total    = sum(i.get("amount", 0) for i in invoices if i.get("status") == "Paid")
        pending_total = sum(i.get("amount", 0) for i in invoices if i.get("status") == "Pending")
        milestone_str = ", ".join(m.get("title", "") for m in milestones if m.get("title"))

        FIELD_MAP = {
            "Project ID":           proj_id,
            "PROJECT TITLE":        proj.get("title", ""),
            "FACILITY":             proj.get("facility", ""),
            "STATUS":               proj.get("status", "In Progress"),
            "PHASE":                proj.get("phase", "Planning"),
            "START DATE":           proj.get("startDate", ""),
            "END DATE":             proj.get("endDate", ""),
            "CONTRACT VALUE ($)":   proj.get("contractValue", ""),
            "COLLECTED VALUE (%$)": paid_total or proj.get("collectedValue", ""),
            "Onedrive location":    proj.get("onedriveFolder", ""),
            "Milestones":           milestone_str,
            "Invoices Amount ($)":  paid_total or "",
            "Pending_Paid":         pending_total or "",
        }

        # Match by stable Project ID — never by title, which is user-editable and
        # would otherwise fork a renamed project into a new row (the bug this fixes).
        id_col = col_idx("Project ID")
        target_row = None
        if id_col:
            for row in ws.iter_rows(min_row=2):
                if str(row[id_col - 1].value or "").strip() == proj_id:
                    target_row = row[0].row
                    break

        if target_row is None:
            new_row = [""] * len(raw_headers)
            for col_name, value in FIELD_MAP.items():
                idx = col_idx(col_name)
                if idx:
                    new_row[idx - 1] = value
            ws.append(new_row)
        else:
            for col_name, value in FIELD_MAP.items():
                idx = col_idx(col_name)
                if idx:
                    ws.cell(row=target_row, column=idx, value=value)

        _upsert_normalized_tab(wb, "Project_Milestones", proj_id, milestones,
            lambda pid, m, now: {
                "Project ID":   pid,
                "Milestone ID": str(m.get("id", "")),
                "Title":        m.get("title", ""),
                "Completed":    "Yes" if m.get("completed") else "No",
                "Last Updated": now,
            })

        _upsert_normalized_tab(wb, "Project_Invoices", proj_id, invoices,
            lambda pid, inv, now: {
                "Project ID":   pid,
                "Invoice ID":   str(inv.get("id", "")),
                "Amount":       inv.get("amount", ""),
                "Status":       inv.get("status", "Pending"),
                "Last Updated": now,
            })

        _upsert_normalized_tab(wb, "Project_Issues", proj_id, issues,
            lambda pid, iss, now: {
                "Project ID":   pid,
                "Issue ID":     str(iss.get("id", "")),
                "Title":        iss.get("title", ""),
                "Status":       iss.get("status", "Open"),
                "Last Updated": now,
            })

        _upsert_normalized_tab(wb, "Project_Notes", proj_id, [{"text": n} for n in notes],
            lambda pid, note, now: {
                "Project ID":   pid,
                "Note ID":      str(hash(note.get("text","")) % 10**6),
                "Text":         note.get("text", ""),
                "Created":      now,
                "Last Updated": now,
            })

        atomic_save(wb, EXCEL_FILE)

    return jsonify({"ok": True, "id": proj_id})


@app.route("/api/open-folder")
def open_folder():
    import subprocess
    path = request.args.get("path", "").strip()
    if not path:
        return jsonify({"error": "No path provided"}), 400
    # Security: only allow paths inside OneDrive project folder
    allowed = (
        "/Users/andyramos/Developer/03_Project",
        "/Users/andyramos/Developer/02_Bid_Estimating",
    )
    if not any(path.startswith(p) for p in allowed):
        return jsonify({"error": "Path not allowed"}), 403
    subprocess.Popen(["open", path])
    return jsonify({"ok": True})


# Map app chk_* keys → spreadsheet column headers (U:AC)
_CHK_COLS = {
    "chk_sf1449":     "SF1449",
    "chk_sow_pws":    "SOW/PWS",
    "chk_pricing":    "Pricing",
    "chk_past_perf":  "Past Perf",
    "chk_osha_safety": "OSHA",
    "chk_licenses":   "Licenses",
    "chk_site_visit": "Site Visit",
    "chk_sub_loi":    "Sub LOI",
    "chk_compliance": "Bid Submitted",
}

def _parse_prefix(s: str) -> dict:
    """Parse 'category:X;priority:Y;starred:false' from the Tags Prefix column (AD)."""
    out = {"category": "Electrical", "priority": "", "starred": False}
    for chunk in (s or "").split(";"):
        if ":" not in chunk:
            continue
        k, v = chunk.split(":", 1)
        k, v = k.strip(), v.strip()
        if k == "starred":
            out["starred"] = v.lower() == "true"
        elif k in ("category", "priority"):
            out[k] = v
    return out

def _build_prefix_string(bid: dict) -> str:
    """Build the Tags Prefix string for column AD (category/priority/starred only)."""
    return (
        f"category:{bid.get('category', 'Electrical')};"
        f"priority:{bid.get('priority', 'Medium')};"
        f"starred:{'true' if bid.get('starred') else 'false'}"
    )


@app.route("/api/bids", methods=["POST"])
def save_bid():
    """Upsert a bid into the 'Bid Tracker' sheet by Solicitation / Notice ID."""
    import datetime as _dt
    bid = request.get_json(force=True)
    if not EXCEL_FILE.exists():
        return jsonify({"error": "Excel file not found"}), 500

    with workbook_lock(EXCEL_FILE):
        wb = openpyxl.load_workbook(EXCEL_FILE, data_only=False)
        if "Bid Tracker" not in wb.sheetnames:
            return jsonify({"error": "Sheet 'Bid Tracker' not found"}), 500

        ws = wb["Bid Tracker"]
        raw_headers = [str(c.value).strip() if c.value is not None else "" for c in ws[1]]

        # Map normalised key → actual column index (1-based)
        def col_idx(name):
            for i, h in enumerate(raw_headers):
                if h.replace('\xa0', '').strip().lower() == name.lower():
                    return i + 1
            return None

        # Field → Excel column lookup (use actual Excel header text)
        # NOTE: do NOT write to "AI Tags" (M) — it is a formula built from U:AC + AD
        FIELD_MAP = {
            "Solicitation / Notice ID": bid.get("id", ""),
            "Status":                   bid.get("status", "Open"),
            "Due Date":                 bid.get("dueDate", ""),
            "Bid / Opportunity Name":   bid.get("title", ""),
            "State":                    bid.get("state", ""),
            "City":                     bid.get("city", ""),
            "Agency / Department":      bid.get("facility", ""),
            "Bid Amount":               bid.get("bidAmount", ""),
            "Award Amount":             bid.get("awardedAmount", ""),
            "SAM Link":                 bid.get("link", ""),
            "Folder Path":              bid.get("folderPath", ""),
            "Notes / Rationale":        "; ".join(bid.get("notes") or []),
            "Tags Prefix":              _build_prefix_string(bid),
            "Last Updated":             _dt.datetime.now().strftime("%Y-%m-%d"),
        }

        # Checklist values written to individual boolean columns U:AC
        checklist_values = {hdr: bool(bid.get(key)) for key, hdr in _CHK_COLS.items()}

        # Find existing row: by Notice ID first, fall back to title for auto-generated bt-N ids
        notice_id = str(bid.get("id", "")).strip()
        is_auto_id = notice_id.startswith("bt-")
        target_row = None

        id_col    = col_idx("Solicitation / Notice ID")
        title_col = col_idx("Bid / Opportunity Name")

        if not is_auto_id and notice_id and id_col:
            for row in ws.iter_rows(min_row=2):
                if str(row[id_col - 1].value or "").strip() == notice_id:
                    target_row = row[0].row
                    break

        if target_row is None and title_col:
            bid_title = str(bid.get("title", "")).strip().lower()
            for row in ws.iter_rows(min_row=2):
                if str(row[title_col - 1].value or "").strip().lower() == bid_title:
                    target_row = row[0].row
                    break

        if target_row is None:
            # Append new row
            new_row = [""] * len(raw_headers)
            for col_name, value in FIELD_MAP.items():
                idx = col_idx(col_name)
                if idx:
                    new_row[idx - 1] = value
            for col_name, value in checklist_values.items():
                idx = col_idx(col_name)
                if idx:
                    new_row[idx - 1] = value
            ws.append(new_row)
        else:
            # Update existing row
            for col_name, value in FIELD_MAP.items():
                idx = col_idx(col_name)
                if idx:
                    ws.cell(row=target_row, column=idx, value=value)
            for col_name, value in checklist_values.items():
                idx = col_idx(col_name)
                if idx:
                    ws.cell(row=target_row, column=idx, value=value)

        atomic_save(wb, EXCEL_FILE)

    return jsonify({"ok": True})


@app.route("/api/health")
def health():
    return jsonify({
        "status": "ok",
        "excel":  str(EXCEL_FILE),
        "exists": EXCEL_FILE.exists(),
        "hits_tab": _latest_hits_tab(),
    })


# ── System health + job ledger — restored from the legacy backend, which had
# these but never made it into this file when it forked. The live UI (System
# Health widget, Job Ledger tab) has been calling these and getting 404s. ──────
try:
    from system_health import build_system_health as _build_system_health
    _SYS_HEALTH_OK = True
except ImportError:
    _SYS_HEALTH_OK = False

@app.route("/api/system/health")
def system_health():
    if not _SYS_HEALTH_OK:
        return jsonify({"error": "system_health module unavailable"}), 503
    return jsonify(_build_system_health())


try:
    from job_manager import get_jobs as _get_jobs, get_job as _get_job, \
                           get_summary as _get_summary, reset_job as _reset_job
    _JOBS_OK = True
except ImportError:
    _JOBS_OK = False

def _jobs_unavailable():
    return jsonify({"error": "job_manager unavailable"}), 503

@app.route("/ops/jobs/summary")
def ops_summary():
    if not _JOBS_OK:
        return jsonify({"failed_today": 0, "queued": 0, "running": 0, "success_24h": 0, "by_flow": {}})
    return jsonify(_get_summary())

@app.route("/ops/jobs")
def ops_jobs():
    if not _JOBS_OK:
        return jsonify([])
    return jsonify(_get_jobs(
        flow=request.args.get("flow"),
        status=request.args.get("status"),
        limit=int(request.args.get("limit", 50)),
    ))

@app.route("/ops/jobs/<job_id>")
def ops_job(job_id):
    if not _JOBS_OK:
        return _jobs_unavailable()
    job = _get_job(job_id)
    return jsonify(job) if job else (jsonify({"error": "not found"}), 404)

@app.route("/ops/jobs/<job_id>/retry", methods=["POST"])
def ops_retry(job_id):
    if not _JOBS_OK:
        return _jobs_unavailable()
    _reset_job(job_id)
    return jsonify({"ok": True})


if __name__ == "__main__":
    print(f"  API server → http://localhost:5050")
    print(f"  Excel file → {EXCEL_FILE}")
    print(f"  File exists: {EXCEL_FILE.exists()}")
    app.run(host="0.0.0.0", port=5050, debug=False)
