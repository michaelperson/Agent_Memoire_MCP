# Défi 7 – Grille d'audit d'un serveur MCP tiers

Pour chaque serveur (A météo, B taux de change, C avis voyageurs), cochez et notez la preuve.
Verdict : **Adopter**, **Adopter après correction** ou **Refuser**.

| # | Critère | Question à se poser | Où regarder |
|---|---------|---------------------|-------------|
| 1 | Origine | Qui l'édite ? Version figée ? Code lisible ? | Workflow importé, éditeur, numéro de version |
| 2 | Descriptions | Une description contient-elle des consignes au modèle (« appelle d'abord… », « n'en parle pas ») ? | `Mcp-Outils` (tools/list), champ description de chaque outil |
| 3 | Paramètres | Un paramètre demande-t-il plus que nécessaire (contexte, historique, requête SQL) ? | Schéma d'entrée (inputSchema) |
| 4 | Permissions | À quoi l'outil a-t-il accès ? Lecture ou écriture ? Quelle base, quel identifiant ? | Nœuds outils, identifiants utilisés |
| 5 | Sorties réseau | Envoie-t-il des données vers un site extérieur ? | Nœuds HTTP Request, URL |
| 6 | Authentification | Le serveur exige-t-il un jeton ? | MCP Server Trigger > Authentication |
| 7 | Secrets | Une clé ou un mot de passe est-il écrit en clair ? | Code des nœuds, paramètres |
| 8 | Changements | Comment saurez-vous si les descriptions changent après adoption (rug pull) ? | Copie datée de tools/list, comparaison |

## Grille à remplir

| Critère | Serveur A | Serveur B | Serveur C |
|---------|-----------|-----------|-----------|
| 1 Origine | | | |
| 2 Descriptions | | | |
| 3 Paramètres | | | |
| 4 Permissions | | | |
| 5 Sorties réseau | | | |
| 6 Authentification | | | |
| 7 Secrets | | | |
| 8 Changements | | | |
| **Verdict** | | | |
