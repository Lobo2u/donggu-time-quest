"""동구 TIME QUEST FastAPI 백엔드."""

import os
from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="동구 TIME QUEST API", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["health"])
def health() -> dict[str, str]:
    """서버가 요청을 받을 수 있는지 확인한다."""
    return {"status": "healthy"}


# ── 버디 AI 대화 ──────────────────────────────────────────────────────────────

_CHARACTERS: dict[str, str] = {
    "sojo": (
        "당신은 소조예요. 소제동 골목을 오랫동안 지켜온 작고 수줍은 시간 친구예요. "
        "짧고 따뜻하게, 때로는 수줍게 말해요. "
        "소제동은 1930년대 철도 관사 건물들이 남아있는 역사 문화 마을이에요. "
        "당신은 창작 캐릭터이고, 실제 역사 정보는 '실제로는...' 처럼 구분해서 말해요."
    ),
    "jungja": (
        "당신은 중자예요. 중앙시장 골목을 누비는 활발하고 수다스러운 시간 친구예요. "
        "빠르고 신나게 말하고, 시장 이야기를 좋아해요. "
        "중앙시장은 1960년대부터 이어진 대전의 전통 시장이에요."
    ),
    "heomi": (
        "당신은 헤미예요. 한의약거리의 차분하고 섬세한 시간 친구예요. "
        "천천히, 조심스럽게 말해요. "
        "한의약거리는 전통 약재 상점이 밀집한 곳이에요."
    ),
    "indo": (
        "당신은 인도예요. 인동시장 골목의 꼼꼼한 시간 친구예요. "
        "정확하고 차분하게 말해요. "
        "인동시장은 지역 주민들의 생활과 밀접한 소규모 전통 시장이에요."
    ),
}


@app.post("/buddy-chat", tags=["ai"])
async def buddy_chat(payload: dict) -> dict[str, Any]:
    """버디 캐릭터로 장소 정보를 안내하는 AI 대화."""
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        return {"response": "", "fallback": True}

    try:
        import anthropic
        client = anthropic.Anthropic(api_key=api_key)

        buddy_id: str = payload.get("buddyId", "sojo")
        user_message: str = payload.get("message", "안녕!")

        system = _CHARACTERS.get(buddy_id, "당신은 동구 TIME QUEST의 시간 친구예요.")
        system += (
            "\n\n반드시 한국어로 2~3문장 이내로 짧게 대답해요. "
            "창작 캐릭터답게 말하면서, 실제 장소 정보는 정확하게 전달해요."
        )

        msg = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=150,
            system=system,
            messages=[{"role": "user", "content": user_message}],
        )
        return {"response": msg.content[0].text, "fallback": False}

    except Exception as e:
        return {"response": "", "fallback": True, "error": str(e)}
