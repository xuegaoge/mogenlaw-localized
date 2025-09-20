# Localize remote assets referenced by index.html to ./assets and rewrite links to relative paths
param(
    [string]$Root = (Split-Path -Parent $PSScriptRoot),
    [string]$HostFilter = 'aekhw.com',
    [int]$DelayMinMs = 250,
    [int]$DelayMaxMs = 700,
    [int]$MaxRetries = 3
)

$ErrorActionPreference = 'Stop'

function Ensure-Dir($path) {
    if (-not (Test-Path $path)) { New-Item -ItemType Directory -Force -Path $path | Out-Null }
}

function Get-FileNameFromUrl([string]$url) {
    $u = [Uri]$url
    $name = [System.IO.Path]::GetFileName($u.AbsolutePath)
    if (-not $name) { $name = 'index' }
    # strip query for local file name
    return ($name -replace '[\:\?\&\=\#]','_')
}

function Resolve-LocalPaths([string]$url) {
    $file = Get-FileNameFromUrl $url
    $ext = [System.IO.Path]::GetExtension($file).ToLowerInvariant()
    $sub = switch ($ext) {
        '.css' { 'assets/css' }
        '.js'  { 'assets/js' }
        '.woff' { 'assets/fonts' }
        '.woff2' { 'assets/fonts' }
        '.ttf' { 'assets/fonts' }
        '.otf' { 'assets/fonts' }
        '.eot' { 'assets/fonts' }
        '.svg' { 'assets/images' }
        '.png' { 'assets/images' }
        '.jpg' { 'assets/images' }
        '.jpeg' { 'assets/images' }
        '.gif' { 'assets/images' }
        '.webp' { 'assets/images' }
        '.ico' { 'assets/images' }
        '.mp4' { 'assets/media' }
        '.webm' { 'assets/media' }
        default { 'assets/misc' }
    }
    $absDir = Join-Path $Root $sub
    Ensure-Dir $absDir
    $abs = Join-Path $absDir $file
    $rel = (Join-Path $sub $file).Replace('\','/')
    return @{ abs = $abs; rel = $rel }
}

function Invoke-PoliteDownload([string]$url, [string]$dst) {
    if (Test-Path $dst) { return $true }
    $ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36'
    for ($i=1; $i -le $MaxRetries; $i++) {
        try {
            $resp = Invoke-WebRequest -Uri $url -Headers @{ 'User-Agent'=$ua } -UseBasicParsing -TimeoutSec 30 -ErrorAction Stop
            [System.IO.File]::WriteAllBytes($dst, $resp.Content)
            return $true
        } catch {
            if ($i -eq $MaxRetries) { Write-Warning "Download failed ($i/$MaxRetries): $url -> $dst ; $_"; return $false }
            Start-Sleep -Milliseconds (Get-Random -Minimum $DelayMinMs -Maximum $DelayMaxMs)
        }
    }
}

function Extract-Matches([string]$html, [string]$pattern, [string]$groupName) {
    $matches = [System.Text.RegularExpressions.Regex]::Matches($html, $pattern, 'IgnoreCase')
    $out = @()
    foreach ($m in $matches) {
        $url = $m.Groups[$groupName].Value
        if ($url -and $url -match '^https?://') { $out += @{ url = $url; full = $m.Value } }
    }
    return $out
}

function Process-CssFile([string]$cssPath) {
    if (-not (Test-Path $cssPath)) { return }
    $css = Get-Content -Raw -LiteralPath $cssPath
    $regex = 'url\((?<q>[\"\'\'']?)(?<u>[^\)\"\'\']+)\k<q>\)'
    $changed = $false
    $css = [System.Text.RegularExpressions.Regex]::Replace($css, $regex, {
        param($m)
        $u = $m.Groups['u'].Value
        if ($u -notmatch '^https?://') { return $m.Value }
        try {
            $uri = [Uri]$u
            if ($uri.Host -ne $HostFilter) { return $m.Value }
            $paths = Resolve-LocalPaths $u
            if (Invoke-PoliteDownload $u $paths.abs) {
                $GLOBALS:__downloads += $paths.rel
                $changed = $true
                return 'url(' + $paths.rel + ')'
            } else {
                return $m.Value
            }
        } catch { return $m.Value }
    }, 'IgnoreCase')
    if ($changed) { Set-Content -LiteralPath $cssPath -Value $css -Encoding UTF8 }
}

# Main
$indexPath = Join-Path $Root 'index.html'
if (-not (Test-Path $indexPath)) { throw "index.html not found at $indexPath" }
$html = Get-Content -Raw -LiteralPath $indexPath
$downloads = @()
$GLOBAL:__downloads = @()

# Patterns scoped to aekhw.com absolute urls only
$pat_link_css = '<link[^>]+?(?:rel\s*=\s*[\"\'\''](?:stylesheet|preload|icon|shortcut icon|apple-touch-icon)[\"\'\''][^>]*?)href\s*=\s*[\"\'\''](?<u>https?://'+[regex]::Escape($HostFilter)+'[^\"\'\''+])[\"\'\'']'
$pat_script = '<script[^>]+?src\s*=\s*[\"\'\''](?<u>https?://'+[regex]::Escape($HostFilter)+'[^\"\'\''+])[\"\'\'']'
$pat_img = '<img[^>]+?src\s*=\s*[\"\'\''](?<u>https?://'+[regex]::Escape($HostFilter)+'[^\"\'\''+])[\"\'\'']'
$pat_source = '<source[^>]+?src\s*=\s*[\"\'\''](?<u>https?://'+[regex]::Escape($HostFilter)+'[^\"\'\''+])[\"\'\'']'
$pat_video = '<video[^>]+?src\s*=\s*[\"\'\''](?<u>https?://'+[regex]::Escape($HostFilter)+'[^\"\'\''+])[\"\'\'']'

$found = @()
$found += Extract-Matches $html $pat_link_css 'u'
$found += Extract-Matches $html $pat_script 'u'
$found += Extract-Matches $html $pat_img 'u'
$found += Extract-Matches $html $pat_source 'u'
$found += Extract-Matches $html $pat_video 'u'

# Unique by URL
$seen = @{}
$queue = @()
foreach ($item in $found) {
    $u = $item.url
    if (-not $seen.ContainsKey($u)) { $seen[$u] = $true; $queue += $u }
}

# Download politely, sequential with small jitter
foreach ($u in $queue) {
    try {
        $uri = [Uri]$u
        if ($uri.Host -ne $HostFilter) { continue }
        $paths = Resolve-LocalPaths $u
        $ok = Invoke-PoliteDownload $u $paths.abs
        if ($ok) {
            $downloads += @{ url=$u; rel=$paths.rel; abs=$paths.abs }
            # If CSS, also process its nested urls
            if ($paths.abs.ToLower().EndsWith('.css')) { Process-CssFile $paths.abs }
        }
        Start-Sleep -Milliseconds (Get-Random -Minimum $DelayMinMs -Maximum $DelayMaxMs)
    } catch { Write-Warning $_ }
}

# Rewrite index.html
foreach ($d in $downloads) {
    $urlEsc = [Regex]::Escape($d.url)
    $html = [Regex]::Replace($html, '([\"\'\''])'+$urlEsc+'\1', '"'+$d.rel+'"', 'IgnoreCase')
}
Set-Content -LiteralPath $indexPath -Value $html -Encoding UTF8

# Report summary
$cssCount = ($downloads | Where-Object { $_.rel -like 'assets/css/*' }).Count
$jsCount = ($downloads | Where-Object { $_.rel -like 'assets/js/*' }).Count
$imgCount = ($downloads | Where-Object { $_.rel -like 'assets/images/*' }).Count
$fontCount = ($downloads | Where-Object { $_.rel -like 'assets/fonts/*' }).Count
$mediaCount = ($downloads | Where-Object { $_.rel -like 'assets/media/*' }).Count

Write-Output "Localized resources: CSS=$cssCount, JS=$jsCount, IMG=$imgCount, FONT=$fontCount, MEDIA=$mediaCount"
if ($GLOBAL:__downloads.Count -gt 0) { Write-Output "Nested CSS url() localized: $($GLOBAL:__downloads.Count)" }