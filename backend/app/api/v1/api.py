from fastapi import APIRouter

from app.api.v1.endpoints import auth, test_auth

api_router = APIRouter()

# Include auth endpoints
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])

# Include test endpoints (for development/testing)
api_router.include_router(test_auth.router, prefix="/test", tags=["testing"]) 