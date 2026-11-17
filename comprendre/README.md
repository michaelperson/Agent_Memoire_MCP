# Comprendre : les mécanismes du cours, pas à pas

Pages à télécharger puis ouvrir d'un double-clic dans un navigateur (aucune installation, fonctionne hors connexion ; GitHub n'affiche que leur code source).
Chaque page montre un mécanisme du cours sur la configuration réelle du kit `kit/agence`.

| Ordre | Animation | Ce qu'elle montre | Où on le voit dans le dépôt |
|-------|-----------|-------------------|-----------------------------|
| 1 | [memoire_cle_de_session.html](memoire_cle_de_session.html) | Ce que le nœud Postgres Chat Memory écrit et relit selon sa clé de session ; avec une clé fixe, Bruno reçoit le voyage d'Alice (jour 2) | `kit/agence/workflows/12-…`, `13-…`, `kit/agence/init/03-conservation.sql` |
| 2 | [dialogue_mcp.html](dialogue_mcp.html) | `initialize`, `Mcp-Session-Id`, `tools/list`, `tools/call` ; refus 403 sans jeton, 400 sans session (jour 3) | `kit/agence/scripts/mcp.ps1`, `workflows/20-…` |
| 3 | [validation_humaine.html](validation_humaine.html) | Un appel d'outil intercepté, l'e-mail, l'attente ; approuvé, refusé, délai expiré, clic d'un robot (jour 3) | `kit/agence/workflows/25-…`, `26-…`, `kit/agence/init/04-gestes.sql` |
| 4 | [chaine_attaque_j4.html](chaine_attaque_j4.html) | Fausse note interne, boîte du responsable lue depuis le réseau, auto-approbation ; et l'effet des correctifs (jour 4) | `kit/agence/workflows/30-…`, `kit/agence/scripts/reseau.ps1`, `kit/agence/j4/docker-compose.override.yml` |

Certains fichiers cités (workflows 12, 13, 20, 25, 26) ne sont fournis que dans le kit formateur.

## Commandes

- **← →** : étape précédente / suivante
- **Espace** : lecture / pause
- **⟲** : recommencer (remet aussi les choix par défaut)
- Les boutons roses en haut de la scène changent la suite : essayez chaque branche.

Les réponses des modèles affichées sont des exemples ; les comportements de n8n ont été vérifiés sur les versions installées par le cours (n8n 2.47.7, PostgreSQL 18, Docker Compose v5.5.1, le 17/11/2026). Les durées d'attente sont illustratives.
