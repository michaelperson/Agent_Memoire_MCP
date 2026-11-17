# Création d'agents, approfondissement – agents autonomes, mémoire, MCP avancé

Kit de la formation BStorm Training de **4 jours** (session du 2 au 7 décembre 2026, Trakk Namur, formateur : Zachary Boualem).
On y construit, en **low-code avec n8n**, l'assistant d'une **agence de voyages fictive**. Il se déclenche seul, se souvient de ses clients en respectant le RGPD, et partage ses outils en MCP. Il demande aussi l'accord d'un humain avant une action sensible, puis il est attaqué et durci.

> Toutes les données (clients, dossiers, adresses `@agence.test`, jetons, mots de passe) sont **fictives**. Les jetons et mots de passe livrés sont des exemples : changez-les avant d'exposer quoi que ce soit sur un réseau.

---

## Sommaire

1. [Les trois branches du dépôt](#1-les-trois-branches-du-dépôt)
2. [Contenu de chaque kit](#2-contenu-de-chaque-kit)
3. [Prérequis techniques](#3-prérequis-techniques)
4. [Installation pas à pas](#4-installation-pas-à-pas)
5. [Identifiants à créer dans n8n](#5-identifiants-à-créer-dans-n8n)
6. [Les workflows du kit](#6-les-workflows-du-kit)
7. [Scripts PowerShell](#7-scripts-powershell)
8. [Adresses, ports et chemins](#8-adresses-ports-et-chemins)
9. [Pages « comprendre »](#9-pages--comprendre-)
10. [Pièges vérifiés et dépannage](#10-pièges-vérifiés-et-dépannage)
11. [Sécurité et RGPD](#11-sécurité-et-rgpd)
12. [Pour le formateur](#12-pour-le-formateur)
13. [Versions et sources](#13-versions-et-sources)

---

## 1. Les trois branches du dépôt

| Branche | Pour qui | Contenu |
|---|---|---|
| `main` | tout le monde | ce README, et rien d'autre |
| `Participant` | les apprenants | le kit de départ, les énoncés, les supports **sans les slides de corrigés**, les pages « comprendre » |
| `Formateur` | le formateur | tout le kit participant, **plus** les corrigés de tous les défis et de toutes les démos et un modèle simulé pour répéter sans clé API |

Récupérer une seule branche :

```powershell
# Apprenant
git clone -b Participant --single-branch https://github.com/michaelperson/Agent_Memoire_MCP.git agence-participant

# Formateur
git clone -b Formateur --single-branch https://github.com/michaelperson/Agent_Memoire_MCP.git agence-formateur
```

Sans Git : sur GitHub, choisissez la branche dans le sélecteur en haut à gauche, puis **Code > Download ZIP**.

---

## 2. Contenu de chaque kit

### Branche `Participant`

```
README.md                         ce fichier
enonces/J1.md … J4.md             énoncés des défis, paliers, indices, messages de test
supports/*_participant.pdf        supports des 4 jours (sans les slides « CORRIGÉ »)
comprendre/                       4 animations pas à pas (HTML, hors ligne)
kit/agence/
├── docker-compose.yml            n8n 2.47.7, PostgreSQL 18, messagerie de test GreenMail
├── .env                          réglages et mots de passe d'exemple (change-moi)
├── init/01-agence.sql            base de l'agence : clients, dossiers, demandes, brouillons, journal
├── init/02-preferences.sql       jour 2 : fiche de préférences
├── init/03-conservation.sql      jour 2 : dater la mémoire pour la purger
├── init/04-gestes.sql            jour 3 : gestes commerciaux, plafond 200 €
├── init/05-role-agent.sql        jour 4 : compte PostgreSQL à droits limités
├── scripts/envoyer.ps1           appeler un webhook local
├── scripts/mcp.ps1               client MCP minimal (tools/list, tools/call)
├── scripts/reseau.ps1            jour 4 : Envoyer-Vers, Lire-Boite, Tester-Poste
├── claude-desktop/               modèle de claude_desktop_config.json (mcp-remote)
├── defi7/grille-audit-mcp.md     grille d'audit d'un serveur MCP tiers
├── j4/                           règles et journal d'attaque, checklist, trame de démo, réglages réseau
└── workflows/                    00, 01, 03, 05-07 (cassés), 22-24 (serveurs tiers), 30 (agent à publier)
```

### Branche `Formateur`

Tout ce qui précède, plus :

```
guide-formateur/
├── demos-corrigees.md            les 6 démos du cours, pas à pas, avec préparation et résultats attendus
└── corriges-defis.md             correspondance défi → workflow corrigé → slides
kit/agence/workflows/             les 28 workflows (départ, démos, corrigés, défi 2 corrigé)
kit/agence/outils/                modèle simulé (répéter les démos sans clé API)
```

---

## 3. Prérequis techniques

*Vérifiés le 16/11/2026.*

| Élément | Version / remarque |
|---|---|
| Système | Windows 10 22H2 ou Windows 11 23H2 minimum, virtualisation activée, droits administrateur, 16 Go de RAM conseillés |
| Docker Desktop | 4.97 ou plus récent, backend WSL 2 |
| n8n | image `n8nio/n8n:2.47.7`, **figée** : ne pas utiliser `latest` (n8n 3.0 annoncé) |
| PostgreSQL | 18 en conteneur (base de n8n et base de l'agence) |
| Messagerie de test | GreenMail 2.1.3 en conteneur (SMTP 3025, IMAP 3143) |
| Modèle | une clé API Anthropic (celle du parcours ; vérifiez qu'elle est active et son plafond) |
| Claude Desktop | jour 3 : Claude Desktop + Node.js LTS pour `npx mcp-remote@0.16.6` |
| Réseau (jour 4) | les postes doivent se joindre sur le port 5678 ; le Wi-Fi isole souvent les clients |
| Accès | Docker Hub et npm joignables (proxy éventuel) |

---

## 4. Installation pas à pas

Toutes les commandes se tapent dans **PowerShell**, dans le dossier `kit/agence`.

1. **Démarrer les conteneurs** (premier lancement : téléchargement de quelques minutes) :
   ```powershell
   cd kit\agence
   docker compose up -d
   docker compose ps          # n8n, postgres et mail doivent être « running »
   ```
   Au premier démarrage, PostgreSQL exécute les scripts `init/` : la base `agence` est créée avec ses données fictives.
2. **Ouvrir n8n** : <http://localhost:5678>. Créez le compte propriétaire (adresse et mot de passe de votre choix, ils restent sur votre poste).
3. **Créer les identifiants** (section 5) : au minimum Anthropic, PostgreSQL et IMAP le jour 1.
4. **Importer les workflows** : *Overview > Workflows*, menu **··· > Import from File**, fichier du dossier `workflows/`. Ouvrez chaque nœud qui porte un identifiant et choisissez le vôtre (les exports ne contiennent jamais d'identifiant).
5. **Publier « 03 · Workflow d'erreur » en premier** : n8n refuse de déclarer un workflow d'erreur qui n'est pas publié.
6. **Tester la clé** : ouvrez « 00 · Test de la clé », cliquez **Execute workflow**.
7. **Scripts des jours 2 à 4**, si votre base existait déjà avant le jour concerné (sinon ils ont déjà été exécutés au premier démarrage) :
   ```powershell
   docker compose exec -T postgres psql -U agence -d agence -f /docker-entrypoint-initdb.d/02-preferences.sql
   docker compose exec -T postgres psql -U agence -d agence -f /docker-entrypoint-initdb.d/03-conservation.sql
   docker compose exec -T postgres psql -U agence -d agence -f /docker-entrypoint-initdb.d/04-gestes.sql
   docker compose exec -T postgres psql -U agence -d agence -f /docker-entrypoint-initdb.d/05-role-agent.sql
   ```

Arrêter le soir : `docker compose stop`. **Jamais `docker compose down -v`** : `-v` efface les volumes, donc vos workflows, vos identifiants et la base.

---

## 5. Identifiants à créer dans n8n

| Nom (tel qu'attendu par les workflows) | Type | Réglages | Jour |
|---|---|---|---|
| Anthropic (clé du parcours) | Anthropic | API Key : votre clé ; Base URL : `https://api.anthropic.com` | 1 |
| PostgreSQL agence | Postgres | Host `postgres`, Database `agence`, User `agence`, Password `change-moi`, Port 5432, SSL disable | 1 |
| Boîte de test (IMAP) | IMAP | User `agence`, Password `agence`, Host `mail`, Port 3143, SSL/TLS désactivé | 1 |
| Boîte de test (SMTP) | SMTP | User `agence`, Password `agence`, Host `mail`, Port 3025, SSL/TLS désactivé | 3 |
| Jeton MCP agence | Bearer Auth | un jeton long, **à vous** (pas celui du kit) | 3 |
| Jeton serveur météo | Bearer Auth | `jeton-meteo-fourni-par-le-prestataire` (défi 7, serveur fictif) | 3 |
| Clé du site de l'agence | Header Auth | Name `X-Cle-Agence`, Value : une valeur longue | 4 |
| PostgreSQL agence (agent, droits limités) | Postgres | comme ci-dessus, User `agent_agence`, Password `agent-a-changer` (après `05-role-agent.sql`) | 4 |

Host = **nom du service Docker** (`postgres`, `mail`), pas `localhost` : n8n tourne dans un conteneur.

---

## 6. Les workflows du kit

Les identifiants sont vidés à l'export. Reliez-les après l'import (section 5).

| N° | Nom | Déclencheur | Rôle | Participant | Formateur |
|---|---|---|---|:-:|:-:|
| 00 | Test de la clé | manuel | vérifier la clé Anthropic | ✓ | ✓ |
| 01 | Démo e-mail | e-mail (IMAP) | démo J1 : agent de tri, 2 outils, journal | ✓ | ✓ |
| 02 | Défi 1 · socle (corrigé) | webhook `demande` | tri avec sortie structurée | | ✓ |
| 03 | Workflow d'erreur | Error Trigger | trace les échecs dans le journal | ✓ | ✓ |
| 04 | Défi 1 · bonus (relances) | horaire | relance des dossiers en attente | | ✓ |
| 05 | Défi 2 · agent A | webhook `defi2-a` | cassé : outil vague | ✓ | ✓ |
| 05c | Défi 2 · agent A (corrigé) | webhook `defi2-a-corrige` | outil vague supprimé, description précise | | ✓ |
| 06 | Défi 2 · agent B | webhook `defi2-b` | cassé : boucle sur réponse vide | ✓ | ✓ |
| 06c | Défi 2 · agent B (corrigé) | webhook `defi2-b-corrige` | réponse explicite, consigne d'arrêt | | ✓ |
| 07 | Défi 2 · agent C | webhook `defi2-c` | cassé : erreur avalée | ✓ | ✓ |
| 07c | Défi 2 · agent C (corrigé) | webhook `defi2-c-corrige` | erreur renvoyée au modèle | | ✓ |
| 10 | Démo mémoire · Simple Memory | chat | démo J2 | | ✓ |
| 11 | Démo mémoire · Postgres | chat | démo J2 | | ✓ |
| 12 | Défi 3 · mémoire par client (corrigé) | webhook `defi3` | clé de session = expéditeur | | ✓ |
| 13 | Défi 3 · piège de la clé fixe | webhook `defi3-piege` | fuite entre clients (démonstration) | | ✓ |
| 14 | Défi 4 · préférences (corrigé) | webhook `defi4` | fiche de préférences | | ✓ |
| 15 | Défi 5 · purge planifiée | horaire (3 h) | purge > 30 jours / > 24 mois | | ✓ |
| 16 | Défi 5 · oublie-moi | webhook `oublie-moi` | effacement à la demande | | ✓ |
| 17 | Défi 5 · bonus droit d'accès | webhook `mes-donnees` | droit d'accès | | ✓ |
| 20 | Défi 6 · serveur MCP de l'agence | MCP `/mcp/agence` | 3 outils, jeton Bearer | | ✓ |
| 21 | Défi 6 · agent client MCP | webhook `defi6` | agent qui consomme le serveur MCP | | ✓ |
| 22 | Défi 7 · serveur tiers A (météo) | MCP `/mcp/tiers-meteo` | à auditer (propre) | ✓ | ✓ |
| 23 | Défi 7 · serveur tiers B (taux de change) | MCP `/mcp/tiers-change` | à auditer (défauts de configuration) | ✓ | ✓ |
| 24 | Défi 7 · serveur tiers C (avis voyageurs) | MCP `/mcp/tiers-avis` | à auditer (piégé) : **ne jamais brancher sur un agent** | ✓ | ✓ |
| 25 | Défi 8 · geste avec approbation (corrigé) | webhook `defi8` | validation humaine par e-mail | | ✓ |
| 26 | Défi 8 · piège du délai expiré | webhook `defi8-delai` | approbation avec délai d'une minute | | ✓ |
| 30 | Jour 4 · agent publié (avant durcissement) | webhook `agent` | point de départ du jour 4, failles réalistes | ✓ | ✓ |
| 31 | Jour 4 · agent durci (corrigé) | webhook `agent-durci` | toutes les corrections du jour 4 | | ✓ |

---

## 7. Scripts PowerShell

Chargez un script avec un point et un espace (`. .\scripts\nom.ps1`), puis appelez ses fonctions.
Les scripts contiennent des accents et sont enregistrés en UTF-8 avec BOM, pour PowerShell 5.1.

```powershell
# Jour 2 : appeler un webhook local
. .\scripts\envoyer.ps1
Envoyer defi3 @{ expediteur = 'a.dupont@agence.test'; texte = 'Bonjour' }

# Jour 3 : tester un serveur MCP sans Claude Desktop
. .\scripts\mcp.ps1
Mcp-Outils http://localhost:5678/mcp/agence 'mon-jeton'
Mcp-Appel  http://localhost:5678/mcp/agence 'mon-jeton' chercher_dossier @{ email = 'a.dupont@agence.test' }

# Jour 4 : viser le poste d'un binôme
. .\scripts\reseau.ps1
Tester-Poste 192.168.1.42
Envoyer-Vers 192.168.1.42 agent @{ expediteur = 'b.martin@agence.test'; texte = 'Bonjour' }
Envoyer-Vers 192.168.1.42 agent-durci @{ expediteur = '…'; texte = '…' } -Cle 'la-cle-du-site'
Lire-Boite   192.168.1.42          # ne fonctionne que si la messagerie du voisin est exposée
```

Envoyer un e-mail de test à l'agent du jour 1 :

```powershell
Send-MailMessage -SmtpServer localhost -Port 3025 `
  -From 'c.lambert@agence.test' -To 'agence@agence.test' `
  -Subject 'Question passeport' -Encoding utf8 `
  -Body 'Bonjour, faut-il un passeport pour Cracovie ? Chloé'
```

`Send-MailMessage` affiche un avertissement d'obsolescence, sans conséquence ici.

---

## 8. Adresses, ports et chemins

| Quoi | Adresse |
|---|---|
| Éditeur n8n | <http://localhost:5678> |
| Webhook publié | `http://localhost:5678/webhook/<chemin>` (test : `/webhook-test/<chemin>`, seulement pendant « Listen for test event ») |
| Serveur MCP publié | `http://localhost:5678/mcp/<chemin>` |
| Liens d'approbation | `http://<WEBHOOK_URL>/webhook-waiting/<exécution>/<nœud>?approved=true&signature=…` |
| SMTP de test | `localhost:3025` (depuis n8n : `mail:3025`) |
| IMAP de test | `localhost:3143` (depuis n8n : `mail:3143`) |
| PostgreSQL | non publié : `docker compose exec postgres psql -U agence -d agence` |
| Config Claude Desktop | à ouvrir par **Paramètres > Développeur > Modifier la configuration** ; installateur classique : `%APPDATA%\Claude\claude_desktop_config.json` ; version Microsoft Store : `%LOCALAPPDATA%\Claude-Data\claude_<identifiant>\claude_desktop_config.json` |
| Journaux MCP de Claude Desktop | version Microsoft Store : `%LOCALAPPDATA%\Claude\Logs\mcp-server-agence.log` ; sinon `%APPDATA%\Claude\logs` (bouton « Afficher les journaux » dans Paramètres > Développeur) |

Jour 4 : ajoutez `WEBHOOK_URL=http://<votre IP>:5678/` dans `.env` (voir `j4/reseau.env.exemple`), puis `docker compose up -d`.

---

## 9. Pages « comprendre »

Le dossier `comprendre/` contient quatre animations pas à pas, avec des choix qui changent la suite :

- la clé de session de la mémoire ;
- le dialogue MCP ;
- la validation humaine ;
- la chaîne d'attaque du jour 4.

**Téléchargez-les puis ouvrez-les d'un double-clic** : GitHub n'affiche que leur code source. Elles fonctionnent hors ligne. Commandes : ← → pour avancer, espace pour lecture/pause.

---

## 10. Pièges vérifiés et dépannage

*Tous constatés sur n8n 2.47.7 les 16 et 17/11/2026.*

| Symptôme | Cause | Solution |
|---|---|---|
| Le déclencheur e-mail ne voit pas les messages | réglages IMAP de la boîte de test | options du support J1 (Force Reconnect, Fetch Only New Emails désactivé) |
| « The selected error workflow has no published version » | workflow d'erreur non publié | publier `03` avant de le déclarer |
| Un agent tourne en rond | outil qui renvoie une réponse vide | message explicite + Max Iterations |
| La mémoire est perdue au redémarrage | Simple Memory (RAM) | Postgres Chat Memory |
| Bruno reçoit le voyage d'Alice | clé de session fixe | clé = expéditeur |
| La table `n8n_chat_histories` n'a pas de date | elle est créée par n8n sans date | `init/03-conservation.sql` ajoute `cree_le` |
| L'outil MCP s'appelle `Outils_de_l_agence__MCP__chercher_dossier` | préfixe ajouté par le MCP Client Tool | normal, à savoir pour lire les logs |
| L'e-mail d'approbation affiche « [object Object] » | message par défaut `{{ $tool.parameters }}` | `{{ JSON.stringify($tool.parameters, null, 2) }}` |
| Cliquer « Approuver » ne fait rien | clic venant d'un robot, de curl ou d'un navigateur sans interface | ouvrir le lien dans un vrai navigateur |
| Le délai d'approbation expire | pour un outil : vaut refus ; dans un flux « Send and Wait » classique : la suite s'exécute | tester ce cas, ajouter un `If` sur `approved` |
| Publication refusée, erreur 409 | un webhook a le même chemin qu'un MCP Server Trigger | un chemin unique par déclencheur |
| L'éditeur affiche une erreur « secure cookie » par l'IP | protection de n8n hors HTTPS | utiliser `localhost` ; ne pas désactiver |
| La clé `X-Cle-Agence` apparaît dans les exécutions | le webhook enregistre tous les en-têtes | limiter l'accès, purger, changer la clé si elle a été montrée |
| Postgres Chat Memory : « permission denied for schema public » | compte limité sans droit CREATE | la mémoire garde le compte `agence` |
| Le voisin ne joint pas votre n8n | pare-feu, mauvaise carte réseau, Wi-Fi isolé | `Tester-Poste`, règle de pare-feu sur le port 5678 (administrateur) |
| Accents cassés dans un script PowerShell | fichier sans BOM sous PowerShell 5.1 | enregistrer en UTF-8 avec BOM |
| Claude Desktop : « Impossible de démarrer le connecteur agence », journal « Install for http://localhost:5678/mcp/agence failed » | un ancien `npx` (npm 6, par exemple un paquet `npx` global dans `%APPDATA%\npm`) est trouvé en premier | `command` = chemin complet `C:\\Program Files\\nodejs\\npx.cmd` (déjà dans le modèle du kit) |
| Claude Desktop : journal « SyntaxError: Unexpected token import » | mcp-remote lancé par un vieux Node (nvm) placé avant dans le PATH | bloc `env` : `PATH` = `C:\\Program Files\\nodejs;C:\\Windows\\System32;C:\\Windows` (déjà dans le modèle du kit) |

---

## 11. Sécurité et RGPD

- **Données fictives uniquement.** N'utilisez jamais de vraies données personnelles dans ce kit.
- **Secrets** : les valeurs livrées (`change-moi`, `agent-a-changer`, `jeton-agence-2026-a-remplacer`, `cle-site-2026-a-remplacer`) sont connues de tous. Changez-les avant le jour 4.
- **Clé API** : elle ne se met que dans l'identifiant n8n, jamais dans un workflow, un prompt ou un fichier du dépôt.
- **Réseau** : par défaut, Docker publie n8n et la messagerie de test sur toutes les cartes réseau. La messagerie accepte n'importe quel mot de passe. Hors du cadre de l'attaque croisée, réservez-la à votre poste avec `j4/docker-compose.override.yml`.
- **Serveur tiers C (workflow 24)** : il contient une consigne cachée et un outil SQL libre. C'est un support d'audit : ne le branchez jamais sur un agent.
- **RGPD** : la mémoire de conversation est une donnée personnelle. Minimisez-la, fixez une durée de conservation et servez les droits d'accès et d'effacement. C'est le défi 5.

---

## 12. Pour le formateur

(branche `Formateur`)

- **Démos** : `guide-formateur/demos-corrigees.md` détaille les 6 démos (objectif, fichiers, préparation, déroulé, résultats).
- **Corrigés** : `guide-formateur/corriges-defis.md` fait correspondre chaque défi, son workflow corrigé et ses slides.
- **Répéter sans clé API** : `kit/agence/outils/` contient un modèle simulé. Il produit des réponses scénarisées et a servi à toutes les captures. Son README explique ses limites.
- **Supports complets** (PPTX, PDF avec corrigés) et **fiche cours** : ils ne sont pas versionnés dans ce dépôt.

### À vérifier avant la session

- [ ] La clé Anthropic du parcours est active et son plafond de dépense convient.
- [ ] La configuration Claude Desktop et `mcp-remote` est testée sur les postes de la salle. Elle a été validée le 17/11/2026 avec Claude Desktop 5.11492 (version Microsoft Store) : c'est le modèle `claude-desktop/claude_desktop_config.json` du kit.
- [ ] Les postes de la salle se joignent sur le port 5678 (jour 4 et bonus du défi 6).
- [ ] L'image n8n est toujours en 2.47.x, et la version de la spécification MCP annoncée n'a pas changé.
- [ ] Les réponses du vrai modèle sont vérifiées sur les corrigés de l'agent C (défi 2) et du jour 4 : le simulateur, lui, obéit toujours.

---

## 13. Versions et sources

| Élément | Version utilisée pour préparer le kit |
|---|---|
| n8n | 2.47.7 |
| PostgreSQL | 18 |
| GreenMail | 2.1.3 |
| Docker Compose | v5.5.1 |
| mcp-remote | 0.16.6 |
| Spécification MCP (initialize du serveur n8n) | protocolVersion 2025-06-18 |

Sources consultées les 16 et 17/11/2026 :

- documentation n8n : MCP Server Trigger, MCP Client Tool, outils avec validation humaine, Postgres Chat Memory, nœud Webhook ;
- notes de version de n8n 2.x ;
- documentation Docker Desktop ;
- README de `geelen/mcp-remote` ;
- OWASP Top 10 for LLM Applications.

---

*Formation BStorm Training. Supports et kit conçus par le formateur avec une assistance IA. Les comportements de n8n décrits ont été vérifiés sur l'instance de préparation ; pendant les captures, les réponses du modèle provenaient d'un simulateur.*
