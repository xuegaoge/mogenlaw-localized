# Normalize index-raw.html -> index.html with absolute resource URLs
$src = Join-Path (Split-Path -Parent $PSScriptRoot) 'index-raw.html'
$dst = Join-Path (Split-Path -Parent $PSScriptRoot) 'index.html'
if (-not (Test-Path $src)) { throw "Source file not found: $src" }
$html = Get-Content -Raw -LiteralPath $src
# Convert protocol-relative to absolute https
$html = $html -replace 'href="//','href="https://'
$html = $html -replace 'src="//','src="https://'
$html = $html -replace "href='//","href='https://"
$html = $html -replace "src='//","src='https://"
# Convert root-relative to absolute
$html = $html -replace 'href="/','href="https://aekhw.com/'
$html = $html -replace 'src="/','src="https://aekhw.com/'
$html = $html -replace "href='/","href='https://aekhw.com/"
$html = $html -replace "src='/","src='https://aekhw.com/"
# Write output (UTF8)
[System.IO.File]::WriteAllText($dst, $html, [System.Text.Encoding]::UTF8)
Write-Output "Wrote: $dst"