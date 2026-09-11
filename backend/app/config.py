import os

DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./amenityos.db")

# Dev-only default. Set ACCESS_TOKEN_SECRET in the environment for anything
# beyond local development — access tokens are HMAC-signed with this key.
ACCESS_TOKEN_SECRET = os.environ.get("ACCESS_TOKEN_SECRET", "dev-secret-change-me")
