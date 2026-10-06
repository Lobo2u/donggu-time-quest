"""개발환경 확인용 FastAPI 애플리케이션."""

from fastapi import FastAPI

app = FastAPI(title="동구 TIME QUEST API", version="0.1.0")


@app.get("/health", tags=["health"])
def health() -> dict[str, str]:
    """서버가 요청을 받을 수 있는지 확인한다."""
    return {"status": "healthy"}
