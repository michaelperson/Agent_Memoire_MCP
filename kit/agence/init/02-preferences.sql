-- Jour 2, défi 4 : fiche de préférences du client (mémoire longue).
-- À lancer une fois :
--   docker compose exec postgres psql -U agence -d agence -f /docker-entrypoint-initdb.d/02-preferences.sql
\connect agence

CREATE TABLE IF NOT EXISTS preferences (
  client_email TEXT NOT NULL REFERENCES clients(email) ON DELETE CASCADE,
  cle          TEXT NOT NULL
               CHECK (cle IN ('aeroport_depart', 'hebergement', 'budget_max', 'siege', 'rythme')),
  valeur       TEXT NOT NULL CHECK (length(valeur) <= 60),
  maj_le       TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (client_email, cle)
);

-- Liste blanche : seules ces 5 clés sont acceptées. Aucune donnée de santé,
-- de religion ou de régime alimentaire (catégories particulières, RGPD art. 9).
COMMENT ON TABLE preferences IS 'Préférences de voyage durables, une ligne par client et par clé.';
