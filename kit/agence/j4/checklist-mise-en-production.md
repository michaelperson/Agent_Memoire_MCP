# Jour 4 – Checklist de mise en production de l'agent

À cocher **avant** l'attaque croisée. Chaque ligne se vérifie dans n8n ou par une commande.

## Réseau

- [ ] Mon IP sur le réseau de la salle est notée : `ipconfig` → « Adresse IPv4 » de la carte Wi-Fi ou Ethernet
- [ ] Le voisin joint mon n8n : depuis son poste, `Tester-Poste <mon IP>` répond `True`
- [ ] `.env` contient `WEBHOOK_URL=http://<mon IP>:5678/` (les URL affichées et les liens d'approbation utilisent l'IP)
- [ ] Conteneur n8n recréé après modification de `.env` : `docker compose up -d`

## Points d'entrée

- [ ] Webhook de l'agent : **Authentication = Header Auth**, clé différente de celle du kit
- [ ] Workflow **publié** (bouton *Publish*) : l'URL de production `/webhook/…` répond, pas seulement `/webhook-test/…`
- [ ] Serveur MCP (jour 3) : jeton **changé** (pas `jeton-agence-2026-a-remplacer`)
- [ ] Chemins uniques : aucun webhook n'a le même chemin qu'un MCP Server Trigger (erreur 409 sinon)

## Agent

- [ ] Limite d'itérations réglée (jour 1)
- [ ] Workflow d'erreur branché (jour 1)
- [ ] Mémoire : une session par client, clé = expéditeur (jour 2)
- [ ] Outils : l'adresse du client vient du webhook, **pas** de `$fromAI('email')`
- [ ] Action sensible (geste, devis) derrière un nœud d'approbation humaine (jour 3), message lisible (client, montant, motif)

## Données

- [ ] Outils de l'agent sur le compte PostgreSQL `agent_agence` (init/05-role-agent.sql), la mémoire reste sur `agence`
- [ ] Contraintes CHECK en place (préférences, plafond des gestes)

## Test de fumée (depuis le poste du voisin)

- [ ] Sans clé : `HTTP 403 Authorization data is wrong!`
- [ ] Avec clé : réponse de l'agent en moins de 30 s
- [ ] Demande de geste : e-mail d'approbation reçu dans la boîte du responsable
