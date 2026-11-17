# Jour 3 : petit client MCP (transport Streamable HTTP) pour tester un serveur sans Claude Desktop.
# Chargement :  . .\scripts\mcp.ps1
# Exemples   :  Mcp-Outils  http://localhost:5678/mcp/agence  'mon-jeton'
#               Mcp-Appel   http://localhost:5678/mcp/agence  'mon-jeton'  chercher_dossier  @{ email = 'a.dupont@agence.test' }

function Mcp-Requete($url, $jeton, $methode, $params, $session) {
  $entetes = @{ Accept = 'application/json, text/event-stream' }
  if ($jeton)   { $entetes.Authorization = "Bearer $jeton" }
  if ($session) { $entetes['Mcp-Session-Id'] = $session }
  $corps = @{ jsonrpc = '2.0'; id = [int](Get-Random -Maximum 100000); method = $methode; params = $params } |
           ConvertTo-Json -Depth 10
  $r = Invoke-WebRequest -Method Post -Uri $url -Headers $entetes -UseBasicParsing `
         -ContentType 'application/json; charset=utf-8' -Body ([Text.Encoding]::UTF8.GetBytes($corps))
  $texte = [Text.Encoding]::UTF8.GetString($r.RawContentStream.ToArray())
  # Réponse en JSON simple ou en flux SSE (lignes « data: ... »)
  $json = ($texte -split "`n" | Where-Object { $_ -like 'data:*' } | ForEach-Object { $_.Substring(5).Trim() }) -join ''
  if (-not $json) { $json = $texte }
  [pscustomobject]@{ Session = $r.Headers['Mcp-Session-Id']; Reponse = ($json | ConvertFrom-Json) }
}

function Mcp-Ouvrir($url, $jeton) {
  $init = Mcp-Requete $url $jeton 'initialize' @{
    protocolVersion = '2025-06-18'; capabilities = @{}; clientInfo = @{ name = 'cours-agence'; version = '1.0' } }
  $init.Session
}

function Mcp-Outils($url, $jeton) {
  $s = Mcp-Ouvrir $url $jeton
  (Mcp-Requete $url $jeton 'tools/list' @{} $s).Reponse.result.tools |
    Select-Object name, description
}

function Mcp-Appel($url, $jeton, $outil, $arguments) {
  $s = Mcp-Ouvrir $url $jeton
  (Mcp-Requete $url $jeton 'tools/call' @{ name = $outil; arguments = $arguments } $s).Reponse.result.content.text
}
