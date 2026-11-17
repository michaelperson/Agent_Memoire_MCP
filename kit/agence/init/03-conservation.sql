-- Jour 2, défi 5 : dater la mémoire de conversation pour pouvoir la purger.
-- La table créée par le nœud Postgres Chat Memory n'a pas de colonne de date.
-- À lancer une fois :
--   docker compose exec postgres psql -U agence -d agence -f /docker-entrypoint-initdb.d/03-conservation.sql
\connect agence

CREATE TABLE IF NOT EXISTS n8n_chat_histories (
  id         SERIAL PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
  message    JSONB NOT NULL
);

-- Les lignes existantes reçoivent la date du jour ; les nouvelles, leur date d'écriture.
ALTER TABLE n8n_chat_histories
  ADD COLUMN IF NOT EXISTS cree_le TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS n8n_chat_histories_session ON n8n_chat_histories (session_id);
