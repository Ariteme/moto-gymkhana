"""Shared fixtures and Supabase client for all tests."""
import os
import pytest
import requests
from dotenv import load_dotenv

load_dotenv('.env.test')

SUPABASE_URL = os.environ['NEXT_PUBLIC_SUPABASE_URL']
SUPABASE_KEY = os.environ['NEXT_PUBLIC_SUPABASE_ANON_KEY']
APP_URL = os.getenv('APP_URL', 'https://moto-gymkhana.vercel.app')

HEADERS = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
}


def supabase_get(table, params=None):
    """Make a GET request to the Supabase REST API."""
    url = f'{SUPABASE_URL}/rest/v1/{table}'
    resp = requests.get(url, headers=HEADERS, params=params, timeout=10)
    resp.raise_for_status()
    return resp.json()


@pytest.fixture(scope='session')
def approved_results():
    """Fetch all approved results once per test session (cached)."""
    return supabase_get('results', {
        'approved': 'eq.true',
        'select': 'id,map_name,lap_time,bike,approved,rider_id,riders(name)',
        'order': 'lap_time.asc',
    })


@pytest.fixture(scope='session')
def all_maps():
    """Fetch all maps from the maps table."""
    return supabase_get('maps', {'select': 'name,image_url'})
