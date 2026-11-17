-- Jour 4 (durcissement) : un compte PostgreSQL à droits limités pour les outils de l'agent.
-- Jusqu'ici, l'agent utilisait le compte « agence », superutilisateur : un outil détourné pouvait tout lire, tout effacer.
-- À lancer une fois, base existante :
--   docker compose exec -T postgres psql -U agence -d agence -f /docker-entrypoint-initdb.d/05-role-agent.sql
\connect agence

DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'agent_agence') THEN
    CREATE ROLE agent_agence LOGIN PASSWORD 'agent-a-changer';
  END IF;
END $$;

GRANT CONNECT ON DATABASE agence TO agent_agence;
GRANT USAGE ON SCHEMA public TO agent_agence;

-- Lecture seule sur les données de référence
GRANT SELECT ON clients, dossiers TO agent_agence;
-- Ce que l'agent a le droit d'écrire, et rien d'autre
GRANT SELECT, INSERT, UPDATE ON preferences TO agent_agence;
GRANT INSERT ON gestes, demandes, brouillons, journal TO agent_agence;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO agent_agence;
-- Aucun DELETE, aucun DROP : la purge et l'oubli (jour 2) gardent le compte « agence ».
-- Ce compte sert aux NŒUDS OUTILS de l'agent (chercher_dossier, retenir_preference, accorder_geste).
-- Le nœud Postgres Chat Memory, lui, garde le compte « agence » : il exécute CREATE TABLE IF NOT EXISTS
-- à chaque appel, refusé à agent_agence (« permission denied for schema public », vérifié sur n8n 2.47.7).
