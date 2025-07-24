from fastapi import APIRouter

from app.api.v1.endpoints import auth, test_auth, employee, timesheet, time_off, client, dashboard

api_router = APIRouter()

# Include auth endpoints
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])

# Include test endpoints (for development/testing)
api_router.include_router(test_auth.router, prefix="/test", tags=["testing"])

# Include employee endpoints
api_router.include_router(employee.router, prefix="/employees", tags=["employees"])
# Include timesheet endpoints
api_router.include_router(timesheet.router, prefix="/timesheets", tags=["timesheets"])
# Include time off endpoints
api_router.include_router(time_off.router, prefix="/time_off", tags=["time_off"])
# Include client endpoints
api_router.include_router(client.router, prefix="/clients", tags=["clients"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"]) 