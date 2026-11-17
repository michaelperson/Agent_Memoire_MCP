-- Base du fil rouge : agence de voyages fictive. Toutes les données sont inventées.
CREATE DATABASE agence;
\connect agence

CREATE TABLE clients (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  nom TEXT NOT NULL,
  ville TEXT
);
CREATE TABLE dossiers (
  id SERIAL PRIMARY KEY,
  client_email TEXT NOT NULL REFERENCES clients(email),
  destination TEXT NOT NULL,
  date_depart DATE,
  nb_personnes INT,
  statut TEXT NOT NULL DEFAULT 'en_attente',   -- en_attente, confirme, annule
  maj_le TIMESTAMP NOT NULL DEFAULT now()
);
CREATE TABLE demandes (
  id SERIAL PRIMARY KEY,
  recu_le TIMESTAMP NOT NULL DEFAULT now(),
  expediteur TEXT NOT NULL,
  objet TEXT,
  texte TEXT,
  categorie TEXT,          -- devis, reclamation, info, autre
  urgence INT,             -- 1 (faible) à 3 (forte)
  resume TEXT
);
CREATE TABLE brouillons (
  id SERIAL PRIMARY KEY,
  cree_le TIMESTAMP NOT NULL DEFAULT now(),
  destinataire TEXT NOT NULL,
  objet TEXT,
  texte TEXT
);
CREATE TABLE journal (
  id SERIAL PRIMARY KEY,
  horodatage TIMESTAMP NOT NULL DEFAULT now(),
  workflow TEXT,
  action TEXT,
  detail TEXT
);

INSERT INTO clients (email, nom, ville) VALUES
 ('a.dupont@agence.test',   'Alice Dupont',   'Namur'),
 ('b.martin@agence.test',   'Bruno Martin',   'Liège'),
 ('c.lambert@agence.test',  'Chloé Lambert',  'Charleroi'),
 ('d.peeters@agence.test',  'David Peeters',  'Bruxelles');

INSERT INTO dossiers (client_email, destination, date_depart, nb_personnes, statut, maj_le) VALUES
 ('a.dupont@agence.test',  'Lisbonne',   '2027-05-12', 12, 'en_attente', now() - interval '3 days'),
 ('b.martin@agence.test',  'Séville',    '2027-04-02',  2, 'confirme',   now() - interval '10 days'),
 ('c.lambert@agence.test', 'Cracovie',   '2027-03-20',  4, 'en_attente', now() - interval '1 day'),
 ('d.peeters@agence.test', 'Edimbourg',  '2027-06-08',  6, 'en_attente', now() - interval '5 days');
