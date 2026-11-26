from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    deepseek_api_key: str = "sk-a158ace949e64bcaa3a3e7b27a86ca22"
    deepseek_base_url: str = "https://api.deepseek.com"
    deepseek_model: str = "deepseek-chat"
    database_url: str = "sqlite+aiosqlite:///./game.db"

    class Config:
        env_file = ".env"

settings = Settings()