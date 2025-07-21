#!/usr/bin/env python3
"""
Test script for Authentication & Authorization System
Tests login, signup, role-based access, and client-based data filtering
"""

import requests
import json
from typing import Dict, Optional

# API base URL
BASE_URL = "http://localhost:8000"

class AuthTester:
    def __init__(self):
        self.session = requests.Session()
        self.tokens = {}
        self.users = {}
    
    def print_separator(self, title: str):
        """Print a formatted separator"""
        print(f"\n{'='*60}")
        print(f"🧪 {title}")
        print(f"{'='*60}")
    
    def print_success(self, message: str):
        """Print success message"""
        print(f"✅ {message}")
    
    def print_error(self, message: str):
        """Print error message"""
        print(f"❌ {message}")
    
    def print_info(self, message: str):
        """Print info message"""
        print(f"ℹ️  {message}")
    
    def make_request(self, method: str, endpoint: str, data: Optional[Dict] = None, token: Optional[str] = None) -> Dict:
        """Make HTTP request with optional authentication"""
        url = f"{BASE_URL}{endpoint}"
        headers = {}
        
        if token:
            headers["Authorization"] = f"Bearer {token}"
        
        try:
            if method.upper() == "GET":
                response = self.session.get(url, headers=headers)
            elif method.upper() == "POST":
                response = self.session.post(url, json=data, headers=headers)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            return {
                "status_code": response.status_code,
                "data": response.json() if response.content else None,
                "success": 200 <= response.status_code < 300
            }
        except Exception as e:
            return {
                "status_code": 0,
                "data": {"error": str(e)},
                "success": False
            }
    
    def test_server_connection(self):
        """Test if the server is running"""
        self.print_separator("Testing Server Connection")
        
        result = self.make_request("GET", "/health")
        if result["success"]:
            self.print_success("Server is running and healthy")
            return True
        else:
            self.print_error(f"Server connection failed: {result['data']}")
            return False
    
    def test_seeded_admin_login(self):
        """Test login with seeded Dew Admin"""
        self.print_separator("Testing Seeded Dew Admin Login")
        
        login_data = {
            "email": "admin@dew.com",
            "password": "changeme"
        }
        
        result = self.make_request("POST", "/api/v1/auth/login", login_data)
        
        if result["success"]:
            token = result["data"]["access_token"]
            self.tokens["admin"] = token
            self.users["admin"] = result["data"]
            self.print_success(f"Dew Admin login successful: {result['data']['email']}")
            self.print_info(f"Role: {result['data']['role']}")
            self.print_info(f"Client ID: {result['data']['client_id']}")
            return True
        else:
            self.print_error(f"Admin login failed: {result['data']}")
            return False
    
    def test_user_signup(self, email: str, password: str, full_name: str, role: str, client_id: Optional[int] = None):
        """Test user signup"""
        signup_data = {
            "email": email,
            "password": password,
            "full_name": full_name,
            "role": role
        }
        
        if client_id is not None:
            signup_data["client_id"] = client_id
        
        result = self.make_request("POST", "/api/v1/auth/signup", signup_data)
        
        if result["success"]:
            token = result["data"]["access_token"]
            user_key = email.split("@")[0]  # Use email prefix as key
            self.tokens[user_key] = token
            self.users[user_key] = result["data"]
            self.print_success(f"User signup successful: {email}")
            self.print_info(f"Role: {result['data']['role']}")
            self.print_info(f"Client ID: {result['data']['client_id']}")
            return True
        else:
            self.print_error(f"User signup failed: {result['data']}")
            return False
    
    def test_protected_routes(self):
        """Test protected routes with different user roles"""
        self.print_separator("Testing Protected Routes")
        
        # Test routes that require different roles
        test_routes = [
            ("/api/v1/test/protected", "Any authenticated user"),
            ("/api/v1/test/admin-only", "Dew Admin only"),
            ("/api/v1/test/manager-or-admin", "Client Manager or Dew Admin"),
            ("/api/v1/test/consultant-only", "Consultant only"),
            ("/api/v1/test/my-data", "User's accessible data")
        ]
        
        for route, description in test_routes:
            self.print_info(f"\nTesting: {description}")
            
            # Test with admin token
            if "admin" in self.tokens:
                result = self.make_request("GET", route, token=self.tokens["admin"])
                if result["success"]:
                    self.print_success(f"Admin can access {route}")
                else:
                    self.print_error(f"Admin cannot access {route}: {result['data']}")
            
            # Test with consultant token (if exists)
            if "john" in self.tokens:
                result = self.make_request("GET", route, token=self.tokens["john"])
                if result["success"]:
                    self.print_success(f"Consultant can access {route}")
                else:
                    self.print_error(f"Consultant cannot access {route}: {result['data']}")
    
    def test_role_validation(self):
        """Test role-based validation during signup"""
        self.print_separator("Testing Role-Based Validation")
        
        # Test 1: Consultant without client_id (should fail)
        self.print_info("Testing Consultant signup without client_id (should fail)")
        result = self.make_request("POST", "/auth/signup", {
            "email": "test@example.com",
            "password": "password123",
            "full_name": "Test User",
            "role": "consultant"
            # No client_id - should fail
        })
        
        if not result["success"]:
            self.print_success("Correctly rejected consultant without client_id")
        else:
            self.print_error("Incorrectly allowed consultant without client_id")
        
        # Test 2: Dew Admin with client_id (should fail)
        self.print_info("Testing Dew Admin signup with client_id (should fail)")
        result = self.make_request("POST", "/auth/signup", {
            "email": "admin2@example.com",
            "password": "password123",
            "full_name": "Admin 2",
            "role": "dew_admin",
            "client_id": 1  # Should fail
        })
        
        if not result["success"]:
            self.print_success("Correctly rejected Dew Admin with client_id")
        else:
            self.print_error("Incorrectly allowed Dew Admin with client_id")
    
    def test_duplicate_email(self):
        """Test duplicate email validation"""
        self.print_separator("Testing Duplicate Email Validation")
        
        # Try to signup with admin email (should fail)
        result = self.make_request("POST", "/api/v1/auth/signup", {
            "email": "admin@dew.com",  # Already exists
            "password": "password123",
            "full_name": "Duplicate Admin",
            "role": "dew_admin"
        })
        
        if not result["success"]:
            self.print_success("Correctly rejected duplicate email")
        else:
            self.print_error("Incorrectly allowed duplicate email")
    
    def test_invalid_login(self):
        """Test invalid login attempts"""
        self.print_separator("Testing Invalid Login")
        
        # Test wrong password
        result = self.make_request("POST", "/api/v1/auth/login", {
            "email": "admin@dew.com",
            "password": "wrongpassword"
        })
        
        if not result["success"]:
            self.print_success("Correctly rejected wrong password")
        else:
            self.print_error("Incorrectly allowed wrong password")
        
        # Test non-existent email
        result = self.make_request("POST", "/api/v1/auth/login", {
            "email": "nonexistent@example.com",
            "password": "password123"
        })
        
        if not result["success"]:
            self.print_success("Correctly rejected non-existent email")
        else:
            self.print_error("Incorrectly allowed non-existent email")
    
    def run_all_tests(self):
        """Run all authentication tests"""
        self.print_separator("Starting Authentication System Tests")
        
        # Test server connection
        if not self.test_server_connection():
            self.print_error("Cannot proceed - server not available")
            return
        
        # Test seeded admin
        if not self.test_seeded_admin_login():
            self.print_error("Cannot proceed - seeded admin not working")
            return
        
        # Test role validation
        self.test_role_validation()
        
        # Test duplicate email
        self.test_duplicate_email()
        
        # Test invalid login
        self.test_invalid_login()
        
        # Test protected routes
        self.test_protected_routes()
        
        self.print_separator("Authentication System Tests Complete")
        self.print_info("Note: Some tests may fail if clients don't exist in database")
        self.print_info("This is expected behavior for the MVP")


def main():
    """Main test function"""
    print("🚀 Dew TimeTracker - Authentication System Test")
    print("Make sure the server is running on http://localhost:8000")
    
    tester = AuthTester()
    tester.run_all_tests()


if __name__ == "__main__":
    main() 