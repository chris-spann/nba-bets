from pydantic import ConfigDict, Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings"""

    # App settings
    app_name: str = "NBA Bets API"
    version: str = "0.1.0"
    debug: bool = False

    # Database settings
    postgres_server: str = Field(default="localhost")
    postgres_user: str = Field(default="postgres")
    postgres_password: str = Field(default="postgres")
    postgres_db: str = Field(default="nba_bets")
    postgres_port: int = Field(default=5432)

    # API settings
    api_prefix: str = "/api/v1"
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:5173"]

    @property
    def database_url(self) -> str:
        """Construct database URL for async connection"""
        return (
            f"postgresql+asyncpg://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_server}:{self.postgres_port}/{self.postgres_db}"
        )

    model_config = ConfigDict(env_file=".env")


settings = Settings()
