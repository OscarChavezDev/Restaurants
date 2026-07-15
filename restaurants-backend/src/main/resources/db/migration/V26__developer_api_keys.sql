-- Portal de desarrollador: API keys autoservicio para el catálogo de restaurantes (rol DEVELOPER)

CREATE TABLE IF NOT EXISTS api_keys (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id       UUID NOT NULL REFERENCES users(id),
    name          VARCHAR(150) NOT NULL,
    key_prefix    VARCHAR(20) NOT NULL,
    key_hash      VARCHAR(128) NOT NULL UNIQUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at  TIMESTAMPTZ,
    revoked_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
