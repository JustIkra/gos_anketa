from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_path: str = "data/gos_anketa.db"
    secret_key: str = "change-me"
    default_admin_password: str = "admin123"
    default_editor_password: str = "editor123"
    access_token_expire_hours: int = 24

    class Config:
        env_file = ".env"


settings = Settings()
