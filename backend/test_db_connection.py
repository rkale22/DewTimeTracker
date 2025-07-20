#!/usr/bin/env python3
"""
Simple script to test database connection
Run this to verify your database setup is working
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add the app directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.core.database import engine, create_db_and_tables
from sqlmodel import SQLModel

def test_connection():
    """Test database connection"""
    try:
        # Test connection
        with engine.connect() as connection:
            print("✅ Database connection successful!")
            
        # Test table creation
        create_db_and_tables()
        print("✅ Database tables created successfully!")
        
        return True
        
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        print("\nTroubleshooting tips:")
        print("1. Make sure PostgreSQL is running")
        print("2. Check your DATABASE_URL in .env file")
        print("3. Ensure the database 'dew_timetracker' exists")
        print("4. Verify username/password are correct")
        return False

if __name__ == "__main__":
    print("Testing database connection...")
    test_connection() 