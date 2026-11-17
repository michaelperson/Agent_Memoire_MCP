# Jour 2 : envoie un message JSON à un webhook n8n publié.
# Chargement :  . .\scripts\envoyer.ps1
# Exemple    :  Envoyer defi3 @{ expediteur = 'a.dupont@agence.test'; texte = 'Bonjour' }
function Envoyer($chemin, $corps) {
  $json = $corps | ConvertTo-Json
  Invoke-RestMethod -Method Post -Uri "http://localhost:5678/webhook/$chemin" `
    -ContentType 'application/json; charset=utf-8' `
    -Body ([Text.Encoding]::UTF8.GetBytes($json))
}
