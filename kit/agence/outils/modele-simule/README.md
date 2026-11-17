# Modèle simulé (outil formateur)

Petit serveur Node.js qui imite l'API Messages d'Anthropic (`/v1/messages`, `/v1/models`). Il a servi à produire toutes les captures des supports. Il permet de répéter les démos **sans clé API, sans coût et avec des réponses reproductibles**.

## Lancer

Depuis `kit/agence` :

```powershell
docker compose -f docker-compose.yml -f outils/docker-compose.modele-simule.yml up -d
```

Dans n8n, ouvrez l'identifiant Anthropic et mettez **Base URL** = `http://modele-simule:8080` (la clé peut être n'importe quelle valeur). Pour revenir au vrai modèle, remettez `https://api.anthropic.com` et la vraie clé.

## Ce qu'il sait faire

Il reconnaît les scénarios du cours à partir des outils et du prompt système :

- tri des demandes et sortie structurée (jour 1) ;
- outil vague appelé en premier (agent A) et boucle sur réponse vide (agent B) ;
- mémoire, rappel d'un échange, préférences, pollution refusée (jour 2) ;
- outils MCP préfixés (jour 3) ;
- geste commercial et validation humaine, y compris les paramètres `toolParameters` / `hitlParameters` (jour 3) ;
- agent publié du jour 4 : dossier d'un autre client, usurpation, fausse note interne, remise.

Chaque requête reçue et chaque réponse sont écrites dans `log/` (fichiers `req-NNNN.json`), utile pour montrer ce que n8n envoie réellement au modèle.

## Limites

- Ce n'est pas un modèle : ses réponses sont scénarisées. Il **obéit toujours** aux consignes cachées et **ignore les erreurs** renvoyées par les outils (agent C corrigé, prompt durci du jour 4). Ces comportements sont à montrer avec le vrai modèle.
- À n'utiliser que pour répéter ou en secours (panne réseau, clé épuisée) ; dites aux apprenants quand vous l'utilisez.
