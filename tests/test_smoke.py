"""
Smoke tests — check that the live deployed app responds correctly.

'Smoke test' = power it on, does it smoke? Basic health check.
Same concept as pinging your lab nodes before running deeper validation.
"""
import pytest
import requests
from conftest import APP_URL


def get_page(path, timeout=15):
    url = f'{APP_URL.rstrip("/")}{path}'
    return requests.get(url, timeout=timeout, allow_redirects=True)


def test_homepage_returns_200():
    """Main leaderboard page must load."""
    r = get_page('/')
    assert r.status_code == 200, f"Homepage returned {r.status_code}"


def test_maps_page_returns_200():
    """Dedicated maps page must load."""
    r = get_page('/maps')
    assert r.status_code == 200, f"/maps returned {r.status_code}"


def test_submit_page_returns_200():
    """Submit form must be accessible."""
    r = get_page('/submit')
    assert r.status_code == 200, f"/submit returned {r.status_code}"


def test_training_page_returns_200():
    """Training page must load."""
    r = get_page('/training')
    assert r.status_code == 200, f"/training returned {r.status_code}"


def test_homepage_contains_brand_name():
    """Page content must include the app name — catches blank/error pages that return 200."""
    r = get_page('/')
    assert 'Gymkhana' in r.text, "Homepage doesn't contain 'Gymkhana' — page may be broken"


def test_nonexistent_page_returns_404():
    """Next.js must return 404 for unknown routes, not 500."""
    r = get_page('/this-page-does-not-exist-at-all')
    assert r.status_code == 404, f"Expected 404, got {r.status_code}"


def test_homepage_response_time():
    """Homepage must respond within 5 seconds. Slow = deployment issue."""
    import time
    start = time.time()
    get_page('/')
    elapsed = time.time() - start
    assert elapsed < 5.0, f"Homepage took {elapsed:.1f}s — too slow (>5s)"
