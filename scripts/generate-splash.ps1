Add-Type -AssemblyName System.Drawing

$sourcePath = "C:\Users\cyphernode\.gemini\antigravity-ide\brain\4a44c8e8-c3fe-427c-bdc5-c209a6bdbf29\.user_uploaded\media_1787384427188.png"
$resDir = "g:\LAMKA COACHING CENTER\lamka coaching apps\lamkacoaching\android\app\src\main\res"
$srcImg = [System.Drawing.Image]::FromFile($sourcePath)

function New-SplashImage {
    param(
        [int]$width,
        [int]$height,
        [string]$outputPath
    )

    $bmp = New-Object System.Drawing.Bitmap($width, $height)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    $color = [System.Drawing.ColorTranslator]::FromHtml("#050B44")
    $g.Clear($color)

    # Logo size ~40% of the smaller dimension
    $minDim = [Math]::Min($width, $height)
    $logoSize = [int]($minDim * 0.40)

    $posX = [int](($width - $logoSize) / 2)
    $posY = [int](($height - $logoSize) / 2)

    $g.DrawImage($srcImg, $posX, $posY, $logoSize, $logoSize)
    $g.Dispose()

    $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Generated splash: $outputPath ($width x $height)"
}

$splashConfigs = @(
    @{ Folder = "drawable"; W = 480; H = 800 },
    @{ Folder = "drawable-port-mdpi"; W = 320; H = 480 },
    @{ Folder = "drawable-port-hdpi"; W = 480; H = 800 },
    @{ Folder = "drawable-port-xhdpi"; W = 720; H = 1280 },
    @{ Folder = "drawable-port-xxhdpi"; W = 960; H = 1600 },
    @{ Folder = "drawable-port-xxxhdpi"; W = 1280; H = 1920 },
    @{ Folder = "drawable-land-mdpi"; W = 480; H = 320 },
    @{ Folder = "drawable-land-hdpi"; W = 800; H = 480 },
    @{ Folder = "drawable-land-xhdpi"; W = 1280; H = 720 },
    @{ Folder = "drawable-land-xxhdpi"; W = 1600; H = 960 },
    @{ Folder = "drawable-land-xxxhdpi"; W = 1920; H = 1280 }
)

foreach ($c in $splashConfigs) {
    $folder = Join-Path $resDir $c.Folder
    if (-not (Test-Path $folder)) {
        New-Item -ItemType Directory -Path $folder -Force | Out-Null
    }
    $targetFile = Join-Path $folder "splash.png"
    New-SplashImage -width $c.W -height $c.H -outputPath $targetFile
}

$srcImg.Dispose()
Write-Host "All Splash screens generated successfully!"
