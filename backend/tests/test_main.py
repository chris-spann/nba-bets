from fastapi import FastAPI
from httpx import AsyncClient

from app.main import app


class TestMainApplication:
    """Test main FastAPI application"""

    def test_app_creation(self):
        """Test that app is created correctly"""
        assert isinstance(app, FastAPI)
        assert app.title == "NBA Bets API"
        assert app.version == "0.1.0"

    async def test_cors_middleware(self, client: AsyncClient):
        """Test CORS middleware is configured"""
        response = await client.options("/", headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET"
        })

        # CORS should allow the request
        assert response.status_code in [200, 204]

    async def test_api_prefix_routing(self, client: AsyncClient):
        """Test that API routes are properly prefixed"""
        response = await client.get("/api/v1/bets")
        assert response.status_code == 200

        # Test that routes without prefix don't work for API endpoints
        response = await client.get("/bets")
        assert response.status_code == 404
