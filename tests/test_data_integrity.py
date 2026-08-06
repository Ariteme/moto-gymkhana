"""
Data integrity tests — hit Supabase REST API directly.

These tests validate that the data in production is sane.
Think of it like your NetBox/SMO API validation scripts,
but for your own database.
"""


def test_approved_results_exist(approved_results):
    """Sanity check: there must be at least one approved result."""
    assert len(approved_results) > 0, "No approved results in database — something is very wrong"


def test_all_lap_times_are_positive(approved_results):
    """Every lap time must be a positive number. Negative or zero is data corruption."""
    bad = [r for r in approved_results if float(r['lap_time']) <= 0]
    assert bad == [], f"Results with invalid lap times: {[r['id'] for r in bad]}"


def test_lap_times_are_plausible(approved_results):
    """Lap times must be between 10s and 600s. Outside this range = input error."""
    bad = [r for r in approved_results if not (10 < float(r['lap_time']) < 600)]
    assert bad == [], (
        f"Results with implausible lap times (<10s or >600s): "
        f"{[(r['id'], r['lap_time']) for r in bad]}"
    )


def test_all_results_have_map_name(approved_results):
    """Every result must have a map name — it's the primary grouping key."""
    missing = [r for r in approved_results if not r.get('map_name')]
    assert missing == [], f"Results missing map_name: {[r['id'] for r in missing]}"


def test_all_results_have_rider(approved_results):
    """Every result must link to a rider. Orphaned results break the leaderboard."""
    missing = [r for r in approved_results if not r.get('riders') or not r['riders'].get('name')]
    assert missing == [], f"Results with no rider: {[r['id'] for r in missing]}"


def test_no_duplicate_results(approved_results):
    """
    No two approved results should have the exact same (rider, map, lap_time).
    Exact duplicates = accidental double-submit.
    """
    seen = {}
    duplicates = []
    for r in approved_results:
        key = (r['riders']['name'], r['map_name'], r['lap_time'])
        if key in seen:
            duplicates.append(key)
        seen[key] = r['id']
    assert duplicates == [], f"Duplicate (rider, map, lap_time) entries: {duplicates}"


def test_map_names_in_results_match_maps_table(approved_results, all_maps):
    """
    Map names used in results must exist in the maps table.
    Mismatch means a run was submitted with a typo'd map name.
    """
    known_maps = {m['name'] for m in all_maps}
    result_maps = {r['map_name'] for r in approved_results if r.get('map_name')}
    unknown = result_maps - known_maps
    assert unknown == set(), (
        f"Map names in results not found in maps table: {unknown}\n"
        f"Known maps: {known_maps}"
    )


def test_maps_table_not_empty(all_maps):
    """Maps table must have at least one entry."""
    assert len(all_maps) > 0, "Maps table is empty"


def test_maps_have_names(all_maps):
    """Every map must have a non-empty name."""
    bad = [m for m in all_maps if not m.get('name')]
    assert bad == [], f"Maps with missing name: {bad}"
