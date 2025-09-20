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

function Download-File([string]$url, [string]$path) {
    $retries = 0
    while ($retries -lt $MaxRetries) {
        try {
            Write-Host "Downloading $url -> $path"
            $delay = Get-Random -Minimum $DelayMinMs -Maximum $DelayMaxMs
            Start-Sleep -Milliseconds $delay
            
            $webClient = New-Object System.Net.WebClient
            $webClient.Headers.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
            $webClient.DownloadFile($url, $path)
            $webClient.Dispose()
            return $true
        }
        catch {
            $retries++
            Write-Warning "Download failed (attempt $retries/$MaxRetries): $($_.Exception.Message)"
            if ($retries -lt $MaxRetries) {
                Start-Sleep -Seconds ($retries * 2)
            }
        }
    }
    return $false
}

function Process-CssFile([string]$cssPath) {
    if (-not (Test-Path $cssPath)) { return }
    
    $content = Get-Content $cssPath -Raw -Encoding UTF8
    $urlPattern = 'url\s*\(\s*[''"]?([^''")]+)[''"]?\s*\)'
    
    $matches = [regex]::Matches($content, $urlPattern)
    foreach ($match in $matches) {
        $originalUrl = $match.Groups[1].Value
        
        # Skip data URLs and already relative URLs
        if ($originalUrl.StartsWith('data:') -or $originalUrl.StartsWith('./') -or $originalUrl.StartsWith('../')) {
            continue
        }
        
        # Convert relative URLs to absolute
        if (-not $originalUrl.StartsWith('http')) {
            $baseUri = [Uri]"https://$HostFilter/"
            $absoluteUrl = [Uri]::new($baseUri, $originalUrl).ToString()
        } else {
            $absoluteUrl = $originalUrl
        }
        
        # Only process URLs from our target host
        if (-not $absoluteUrl.Contains($HostFilter)) { continue }
        
        $paths = Resolve-LocalPaths $absoluteUrl
        
        if (-not (Test-Path $paths.abs)) {
            $success = Download-File $absoluteUrl $paths.abs
            if (-not $success) {
                Write-Warning "Failed to download: $absoluteUrl"
                continue
            }
        }
        
        # Calculate relative path from CSS file to asset
        $cssDir = Split-Path $cssPath -Parent
        $relativePath = [System.IO.Path]::GetRelativePath($cssDir, $paths.abs).Replace('\', '/')
        
        # Replace in content
        $content = $content.Replace($originalUrl, $relativePath)
    }
    
    Set-Content $cssPath -Value $content -Encoding UTF8
}

# Main processing
$indexPath = Join-Path $Root 'index.html'
if (-not (Test-Path $indexPath)) {
    Write-Error "index.html not found at $indexPath"
    exit 1
}

Write-Host "Processing $indexPath"
$html = Get-Content $indexPath -Raw -Encoding UTF8

# Find all URLs in HTML
$urlPatterns = @(
    'href\s*=\s*[''"]([^''"]+)[''"]',
    'src\s*=\s*[''"]([^''"]+)[''"]',
    'url\s*\(\s*[''"]?([^''")]+)[''"]?\s*\)'
)

$allUrls = @()
foreach ($pattern in $urlPatterns) {
    $matches = [regex]::Matches($html, $pattern)
    foreach ($match in $matches) {
        $url = $match.Groups[1].Value
        if ($url.Contains($HostFilter)) {
            $allUrls += $url
        }
    }
}

$allUrls = $allUrls | Sort-Object -Unique

Write-Host "Found $($allUrls.Count) URLs to process"

foreach ($url in $allUrls) {
    $paths = Resolve-LocalPaths $url
    
    if (-not (Test-Path $paths.abs)) {
        $success = Download-File $url $paths.abs
        if (-not $success) {
            Write-Warning "Failed to download: $url"
            continue
        }
    }
    
    # Process CSS files for nested URLs
    if ($paths.abs.EndsWith('.css')) {
        Process-CssFile $paths.abs
    }
    
    # Replace in HTML
    $html = $html.Replace($url, $paths.rel)
}

# Save updated HTML
Set-Content $indexPath -Value $html -Encoding UTF8
Write-Host "Localization complete. Updated $indexPath"