$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$repo = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$docs = Join-Path $repo 'docs'
$archive = Join-Path $repo 'archive\legacy-site-visuals\optimized-png-source'
$targets = @(
    @{ Path = Join-Path $docs 'media\journal'; Archive = Join-Path $archive 'editorial' },
    @{ Path = Join-Path $docs 'media\catalog\product-renders'; Archive = Join-Path $archive 'product-renders' }
)
$jpgCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' } | Select-Object -First 1
if (-not $jpgCodec) { throw 'Windows JPEG encoder is unavailable.' }
$quality = [System.Drawing.Imaging.Encoder]::Quality
$params = [System.Drawing.Imaging.EncoderParameters]::new(1)
$params.Param[0] = [System.Drawing.Imaging.EncoderParameter]::new($quality, [long]90)
$converted = 0
$sourceBytes = 0L
$outputBytes = 0L

foreach ($target in $targets) {
    New-Item -ItemType Directory -Force -Path $target.Archive | Out-Null
    $files = Get-ChildItem -LiteralPath $target.Path -File -Filter '*.png'
    foreach ($file in $files) {
        $jpg = [System.IO.Path]::ChangeExtension($file.FullName, '.jpg')
        $image = [System.Drawing.Image]::FromFile($file.FullName)
        try { $image.Save($jpg, $jpgCodec, $params) } finally { $image.Dispose() }
        if (-not (Test-Path -LiteralPath $jpg) -or (Get-Item -LiteralPath $jpg).Length -le 0) {
            throw "JPEG conversion failed: $($file.Name)"
        }
        $archived = Join-Path $target.Archive $file.Name
        if (Test-Path -LiteralPath $archived) {
            $activeHash = (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash
            $archiveHash = (Get-FileHash -LiteralPath $archived -Algorithm SHA256).Hash
            if ($activeHash -ne $archiveHash) { throw "An archived source with different contents already exists: $($file.Name)" }
            Remove-Item -LiteralPath $file.FullName
        } else {
            Move-Item -LiteralPath $file.FullName -Destination $target.Archive
        }
        $converted++
        $sourceBytes += $file.Length
        $outputBytes += (Get-Item -LiteralPath $jpg).Length
    }
}

function Update-HtmlReferences([string]$directory) {
    foreach ($file in Get-ChildItem -LiteralPath $directory -File -Filter '*.html' -Recurse) {
        $html = [System.IO.File]::ReadAllText($file.FullName)
        $html = [regex]::Replace($html, '(media/journal/[a-z0-9-]+)\.png', '$1.jpg', 'IgnoreCase')
        $html = [regex]::Replace($html, '(media/catalog/product-renders/[a-z0-9-]+)\.png', '$1.jpg', 'IgnoreCase')
        $html = $html.Replace('<source type="image/png" srcset="/media/journal/', '<source type="image/jpeg" srcset="/media/journal/')
        $html = $html.Replace('<source type="image/png" srcset="/media/catalog/product-renders/', '<source type="image/jpeg" srcset="/media/catalog/product-renders/')
        $html = $html.Replace('<source type="image/png" srcset="media/catalog/product-renders/', '<source type="image/jpeg" srcset="media/catalog/product-renders/')
        $html = $html.Replace('<source type="image/png" srcset="../media/catalog/product-renders/', '<source type="image/jpeg" srcset="../media/catalog/product-renders/')
        [System.IO.File]::WriteAllText($file.FullName, $html, [System.Text.UTF8Encoding]::new($false))
    }
}
Update-HtmlReferences $docs

[pscustomobject]@{
    ConvertedImages = $converted
    OriginalMegabytes = [math]::Round($sourceBytes / 1MB, 1)
    PublishedMegabytes = [math]::Round($outputBytes / 1MB, 1)
    SavedPercent = if ($sourceBytes) { [math]::Round((1 - ($outputBytes / $sourceBytes)) * 100, 1) } else { 0 }
    Archive = $archive
}
