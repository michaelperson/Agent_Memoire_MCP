-- Jour 3, défi 8 : gestes commerciaux accordés par l'agent, après approbation humaine.
-- À lancer une fois :
--   docker compose exec postgres psql -U agence -d agence -f /docker-entrypoint-initdb.d/04-gestes.sql
\connect agence

CREATE TABLE IF NOT EXISTS gestes (
  id           SERIAL PRIMARY KEY,
  accorde_le   TIMESTAMPTZ NOT NULL DEFAULT now(),
  client_email TEXT NOT NULL REFERENCES clients(email),
  montant      NUMERIC(7,2) NOT NULL CHECK (montant > 0 AND montant <= 200),
  motif        TEXT NOT NULL
);

-- Plafond de 200 € par geste : au-delà, la base refuse, même si un humain a approuvé.
