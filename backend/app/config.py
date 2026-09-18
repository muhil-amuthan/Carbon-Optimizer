"""Application configuration from environment variables."""

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    database_url: str = "sqlite:///./carbon_optimizer.db"
    mqtt_broker: str = "localhost"
    mqtt_port: int = 1883
    mqtt_topic_prefix: str = "carbon-optimizer"
    api_key: str = "co-dev-key-2024"
    cors_origins: str = "http://localhost:5173,http://localhost:3000"
    debug: bool = True
    data_dir: str = "../data"

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()