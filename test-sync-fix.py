#!/usr/bin/env python3
"""
Quick test script to verify the sync fix
"""

import sys
import os
sys.path.append('/app')

from django import setup
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'api.settings')
setup()

from woocommerce.tasks_fix import run_comprehensive_sync_fix

if __name__ == "__main__":
    run_comprehensive_sync_fix()
