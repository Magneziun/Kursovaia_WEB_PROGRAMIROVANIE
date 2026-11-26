import json
import httpx
import logging
from .config import settings

logger = logging.getLogger("deepseek")
# ... (остальной код логгера)

class DeepSeekError(Exception):
    pass

# Добавляем параметр api_key
async def call_deepseek(messages: list[dict], temperature: float = 0.9, max_tokens: int = 800, api_key: str = None) -> dict:
    # Если ключ передан с фронта - используем его, иначе - из .env
    final_key = api_key or settings.deepseek_api_key
    
    if not final_key:
        raise DeepSeekError("DEEPSEEK_API_KEY не указан ни на клиенте, ни на сервере")

    payload = {
        "model": settings.deepseek_model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
        "response_format": {"type": "json_object"},
        "thinking": {"type": "disabled"},
    }
    headers = {
        "Authorization": f"Bearer {final_key}", # Используем финальный ключ
        "Content-Type": "application/json",
    }
    async with httpx.AsyncClient(timeout=90) as client:
        r = await client.post(
            f"{settings.deepseek_base_url}/chat/completions",
            json=payload, headers=headers,
        )
    
    body = r.json()
    
    # Логируем сырой ответ от API
    logging.debug(f"RAW RESPONSE: {json.dumps(body, ensure_ascii=False)}")

    if r.status_code != 200:
        raise DeepSeekError(f"DeepSeek HTTP {r.status_code}: {r.text[:500]}")

    try:
        choice = body["choices"][0]
    except (KeyError, IndexError):
        raise DeepSeekError(f"Unexpected DeepSeek response: {str(body)[:500]}")

    message = choice.get("message", {})
    content = (message.get("content") or "").strip()
    finish_reason = choice.get("finish_reason")
    usage = body.get("usage", {})

    if not content:
        raise DeepSeekError(
            "Empty content from DeepSeek. "
            f"finish_reason={finish_reason}, usage={usage}. "
            f"Проверьте файл deepseek_debug.log в папке backend!"
        )

    text = content
    if text.startswith("```"):
        lines = text.split("\n")
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        text = "\n".join(lines).strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError as e:
        raise DeepSeekError(
            f"Invalid JSON from DeepSeek (finish_reason={finish_reason}): {text[:500]}"
        ) from e