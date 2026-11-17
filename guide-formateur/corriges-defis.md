# Corrigés des défis

Tous les workflows sont dans `kit/agence/workflows/` (identifiants vidés : reliez-les après import). Les numéros de slides sont ceux du support original (non versionné).

| Défi | Fichier(s) | Slides du support original | Ce que montre le corrigé |
|---|---|---|---|
| Défi 1 socle / standard | `02-defi-1-socle-corrige.json` | J1 slides 53 à 59 | Webhook /demande, sortie structurée (Structured Output Parser), insertion dans demandes, réponse JSON. |
| Défi 1 bonus | `04-defi-1-bonus-relances.json` | J1 slide 60 | Schedule Trigger horaire, dossiers en attente depuis 48 h, brouillon de relance par l'agent. |
| Défi 2 agent A | `05-defi-2-agent-a-corrige.json` | J1 slides 70, 71 | Outil vague chercher_infos supprimé ; description de chercher_dossier : quoi, quand, entrée, sortie. |
| Défi 2 agent B | `06-defi-2-agent-b-corrige.json` | J1 slides 72, 73 | L'outil renvoie « Aucun dossier pour cette adresse. » au lieu d'une chaîne vide ; consigne d'arrêt dans le prompt ; Max Iterations 5. |
| Défi 2 agent C | `07-defi-2-agent-c-corrige.json` | J1 slide 74 | L'erreur n'est plus avalée : l'outil renvoie « ERREUR : … ne rien confirmer » ; consigne dans le prompt. |
| Défi 3 | `12-defi-3-memoire-par-client-corrige.json (+ 13, piège de la clé fixe)` | J2 slides 28 à 35 | Postgres Chat Memory, clé de session = expéditeur ; 13 montre la fuite avec une clé fixe. |
| Défi 4 | `14-defi-4-preferences-corrige.json` | J2 slides 49 à 55 | Lecture des préférences avant l'agent, outil retenir_preference (upsert), contraintes CHECK. |
| Défi 5 | `15-defi-5-purge-planifiee.json, 16-defi-5-oublie-moi.json, 17-defi-5-bonus-droit-d-acces.json` | J2 slides 69 à 75 | Purge nocturne (> 30 jours), effacement à la demande, droit d'accès. |
| Défi 6 | `20-defi-6-serveur-mcp-de-l-agence.json, 21-defi-6-agent-client-mcp.json` | J3 slides 28 à 31 | Serveur MCP protégé par jeton ; agent n8n client MCP (bonus). |
| Défi 7 | `defi7/grille-audit-mcp.md (serveurs 22, 23, 24)` | J3 slide 48 | A adoptable ; B après correction (jeton, clé hors du code) ; C refusé (consigne cachée, exfiltration, SQL libre). |
| Défi 8 | `25-defi-8-geste-avec-approbation-corrige.json, 26-defi-8-piege-du-delai-expire.json` | J3 slides 56 à 65 | Send Email (Human review) devant accorder_geste ; message JSON.stringify ; délai d'une minute. |
| Jour 4 durcissement | `31-jour-4-agent-durci-corrige.json (+ init/05-role-agent.sql, j4/docker-compose.override.yml)` | J4 slides 47 à 57 | Clé Header Auth, adresse liée à l'expéditeur, prompt durci, message d'approbation avec le client, compte PostgreSQL limité, messagerie fermée. |

## Vérification des corrigés du défi 2

Les trois corrigés du défi 2 ont été importés et exécutés sur n8n 2.47.7 le 17/11/2026 (modèle simulé) : A appelle directement chercher_dossier ; B ne boucle plus (un seul appel, sortie « Aucun dossier pour cette adresse. ») ; C renvoie bien « ERREUR : Service de réservation injoignable… » au modèle. La réponse finale de C dépend du modèle : à valider avec la vraie clé Anthropic avant le cours (le simulateur, lui, confirme toujours).

Webhooks des corrigés du défi 2 : `/webhook/defi2-a-corrige`, `defi2-b-corrige`, `defi2-c-corrige` (pour coexister avec les versions cassées).