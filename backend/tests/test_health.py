import asyncio

import httpx

from app.main import app


async def get_response(path: str) -> httpx.Response:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        return await client.get(path)


def test_health_returns_healthy() -> None:
    response = asyncio.run(get_response("/health"))

    assert response.status_code == 200
    assert response.headers["content-type"] == "application/json"
    assert response.json() == {"status": "healthy"}


def test_health_is_documented_in_openapi() -> None:
    response = asyncio.run(get_response("/openapi.json"))

    assert response.status_code == 200
    assert "/health" in response.json()["paths"]
