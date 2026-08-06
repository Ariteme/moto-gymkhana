#!/usr/bin/env python3
"""
Health check script for moto-gymkhana.

Checks:
  - Live app pages (HTTP smoke tests)
  - Supabase database connectivity
  - Data sanity (approved results exist, no corrupt data)

Run manually:    python scripts/healthcheck.py
Run on schedule: add to cron or systemd timer

This is the same pattern as your lab monitoring platform:
parallel checks → collect results → report → exit code reflects health.
"""

import os
import sys
import time
import json
import concurrent.futures
from datetime import datetime
import requests
from dotenv import load_dotenv

load_dotenv('.env.test')

APP_URL = os.getenv('APP_URL', 'https://moto-gymkhana.vercel.app')
SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

# ANSI colours
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
RESET = '\033[0m'
BOLD = '\033[1m'


class CheckResult:
    def __init__(self, name, ok, message, latency_ms=None):
        self.name = name
        self.ok = ok
        self.message = message
        self.latency_ms = latency_ms

    def __str__(self):
        status = f"{GREEN}PASS{RESET}" if self.ok else f"{RED}FAIL{RESET}"
        lat = f"  [{self.latency_ms:.0f}ms]" if self.latency_ms is not None else ""
        return f"  {status}  {self.name}{lat}\n        {self.message}"


# ── Individual checks ──────────────────────────────────────────────────────────

def check_page(path, expected_text=None):
    url = f"{APP_URL.rstrip('/')}{path}"
    try:
        t0 = time.time()
        r = requests.get(url, timeout=10, allow_redirects=True)
        ms = (time.time() - t0) * 1000
        if r.status_code != 200:
            return CheckResult(f"HTTP {path}", False, f"Status {r.status_code}", ms)
        if expected_text and expected_text not in r.text:
            return CheckResult(f"HTTP {path}", False, f"'{expected_text}' not found in response", ms)
        return CheckResult(f"HTTP {path}", True, f"OK ({r.status_code})", ms)
    except requests.exceptions.Timeout:
        return CheckResult(f"HTTP {path}", False, "Timeout after 10s")
    except Exception as e:
        return CheckResult(f"HTTP {path}", False, str(e))


def check_supabase_connectivity():
    if not SUPABASE_URL or not SUPABASE_KEY:
        return CheckResult("Supabase connectivity", False, "SUPABASE env vars not set")
    try:
        t0 = time.time()
        r = requests.get(
            f"{SUPABASE_URL}/rest/v1/maps",
            headers={'apikey': SUPABASE_KEY, 'Authorization': f'Bearer {SUPABASE_KEY}'},
            params={'select': 'name', 'limit': '1'},
            timeout=8,
        )
        ms = (time.time() - t0) * 1000
        r.raise_for_status()
        return CheckResult("Supabase connectivity", True, f"OK ({len(r.json())} row)", ms)
    except Exception as e:
        return CheckResult("Supabase connectivity", False, str(e))


def check_approved_results_exist():
    if not SUPABASE_URL or not SUPABASE_KEY:
        return CheckResult("Approved results exist", False, "SUPABASE env vars not set")
    try:
        r = requests.get(
            f"{SUPABASE_URL}/rest/v1/results",
            headers={
                'apikey': SUPABASE_KEY,
                'Authorization': f'Bearer {SUPABASE_KEY}',
                'Prefer': 'count=exact',
            },
            params={'approved': 'eq.true', 'select': 'id', 'limit': '1'},
            timeout=8,
        )
        r.raise_for_status()
        count_header = r.headers.get('Content-Range', '')
        count = count_header.split('/')[-1] if '/' in count_header else len(r.json())
        if int(count) == 0:
            return CheckResult("Approved results exist", False, "0 approved results — database may be reset")
        return CheckResult("Approved results exist", True, f"{count} approved result(s) found")
    except Exception as e:
        return CheckResult("Approved results exist", False, str(e))


def check_no_corrupt_lap_times():
    if not SUPABASE_URL or not SUPABASE_KEY:
        return CheckResult("Lap time sanity", False, "SUPABASE env vars not set")
    try:
        r = requests.get(
            f"{SUPABASE_URL}/rest/v1/results",
            headers={'apikey': SUPABASE_KEY, 'Authorization': f'Bearer {SUPABASE_KEY}'},
            params={'approved': 'eq.true', 'select': 'id,lap_time'},
            timeout=8,
        )
        r.raise_for_status()
        results = r.json()
        bad = [row for row in results if not (10 < float(row['lap_time']) < 600)]
        if bad:
            return CheckResult("Lap time sanity", False, f"{len(bad)} result(s) with implausible lap times: {[b['id'] for b in bad]}")
        return CheckResult("Lap time sanity", True, f"All {len(results)} lap times in valid range (10s–600s)")
    except Exception as e:
        return CheckResult("Lap time sanity", False, str(e))


# ── Orchestration ──────────────────────────────────────────────────────────────

def run_all_checks():
    """Run all checks in parallel — same pattern as your lab SSH parallel validator."""
    checks = [
        lambda: check_page('/', 'Gymkhana'),
        lambda: check_page('/maps'),
        lambda: check_page('/submit'),
        lambda: check_supabase_connectivity(),
        lambda: check_approved_results_exist(),
        lambda: check_no_corrupt_lap_times(),
    ]

    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as executor:
        futures = [executor.submit(c) for c in checks]
        results = [f.result() for f in concurrent.futures.as_completed(futures)]

    return results


def main():
    ts = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    print(f"\n{BOLD}🏁 moto-gymkhana health check — {ts}{RESET}")
    print(f"   App: {APP_URL}\n")

    results = run_all_checks()

    passed = sum(1 for r in results if r.ok)
    failed = sum(1 for r in results if not r.ok)

    for r in sorted(results, key=lambda x: (not x.ok, x.name)):
        print(r)

    print()
    if failed == 0:
        print(f"{GREEN}{BOLD}All {passed} checks passed ✓{RESET}")
        sys.exit(0)
    else:
        print(f"{RED}{BOLD}{failed} check(s) FAILED — {passed} passed{RESET}")
        sys.exit(1)  # Non-zero exit = CI/cron knows something broke


if __name__ == '__main__':
    main()
