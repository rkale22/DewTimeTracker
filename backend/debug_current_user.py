#!/usr/bin/env python3
"""
Debug script to decode JWT token and check current user
"""

import jwt
import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add the app directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.core.database import engine
from app.models import Employee
from sqlmodel import Session, select

def decode_token(token):
    """Decode JWT token to see user info"""
    try:
        # Get the secret key from environment
        secret_key = os.getenv("SECRET_KEY", "your-secret-key")
        
        # Decode the token
        payload = jwt.decode(token, secret_key, algorithms=["HS256"])
        return payload
    except Exception as e:
        print(f"❌ Error decoding token: {e}")
        return None

def debug_current_user(token):
    """Debug current user from token"""
    print("🔍 DEBUGGING CURRENT USER")
    print("=" * 50)
    
    # Decode token
    payload = decode_token(token)
    if payload:
        print(f"🔍 Token payload: {payload}")
        user_id = payload.get('sub')
        print(f"🔍 User ID from token: {user_id}")
        
        # Get user from database
        with Session(engine) as session:
            user = session.exec(select(Employee).where(Employee.id == user_id)).first()
            if user:
                print(f"🔍 Current user: {user.full_name} ({user.email})")
                print(f"🔍 User role: {user.role.value}")
                print(f"🔍 User client_id: {user.client_id}")
            else:
                print(f"❌ User with ID {user_id} not found in database")
    else:
        print("❌ Could not decode token")

if __name__ == "__main__":
    # You'll need to provide your JWT token here
    # You can get it from your browser's developer tools or from the API response
    token = input("Enter your JWT token: ")
    debug_current_user(token) 