Add-Type -AssemblyName System.Drawing

$sourcePath = "C:\Users\cyphernode\.gemini\antigravity-ide\brain\4a44c8e8-c3fe-427c-bdc5-c209a6bdbf29\.user_uploaded\media_1787384427188.png"
$resDir = "g:\LAMKA COACHING CENTER\lamka coaching apps\lamkacoaching\android\app\src\main\res"
$publicDir = "g:\LAMKA COACHING CENTER\lamka coaching apps\lamkacoaching\public"

# Also update web public assets
Copy-Item -Path $sourcePath -Destination "$publicDir\uploads\logo.png" -Force
Copy-Item -Path $sourcePath -Destination "$publicDir\logo.png" -Force

$srcImg = [System.Drawing.Image]::FromFile($sourcePath)

function New-CenteredImage {
    param(
        [System.Drawing.Image]$img,
        [int]$canvasWidth,
        [int]$canvasHeight,
        [double]$scale,
        [string]$bgColor,
        [string]$outputPath,
        [bool]$isRound = $false
    )

    $bmp = New-Object System.Drawing.Bitmap($canvasWidth, $canvasHeight)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    if ($bgColor -ne "transparent") {
        $color = [System.Drawing.ColorTranslator]::FromHtml($bgColor)
        if ($isRound) {
            $g.Clear([System.Drawing.Color]::Transparent)
            $brush = New-Object System.Drawing.SolidBrush($color)
            $g.FillEllipse($brush, 0, 0, $canvasWidth, $canvasHeight)
            $brush.Dispose()
        } else {
            $g.Clear($color)
        }
    } else {
        $g.Clear([System.Drawing.Color]::Transparent)
    }

    $drawW = [int]($canvasWidth * $scale)
    $drawH = [int]($canvasHeight * $scale)
    $posX = [int](($canvasWidth - $drawW) / 2)
    $posY = [int](($canvasHeight - $drawH) / 2)

    $g.DrawImage($img, $posX, $posY, $drawW, $drawH)
    $g.Dispose()

    $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
}

$densities = @(
    @{ Name = "mipmap-mdpi"; LegacySize = 48; ForegroundSize = 108 },
    @{ Name = "mipmap-hdpi"; LegacySize = 72; ForegroundSize = 162 },
    @{ Name = "mipmap-xhdpi"; LegacySize = 96; ForegroundSize = 216 },
    @{ Name = "mipmap-xxhdpi"; LegacySize = 144; ForegroundSize = 324 },
    @{ Name = "mipmap-xxxhdpi"; LegacySize = 192; ForegroundSize = 432 }
)

foreach ($d in $densities) {
    $folder = Join-Path $resDir $d.Name
    if (-not (Test-Path $folder)) {
        New-Item -ItemType Directory -Path $folder -Force | Out-Null
    }

    # 1. Adaptive Icon Foreground (Transparent background, centered logo at 66% scale)
    $fgPath = Join-Path $folder "ic_launcher_foreground.png"
    New-CenteredImage -img $srcImg -canvasWidth $d.ForegroundSize -canvasHeight $d.ForegroundSize -scale 0.66 -bgColor "transparent" -outputPath $fgPath

    # 2. Legacy Square Launcher (Navy background #050B44, centered logo at 78% scale)
    $legacyPath = Join-Path $folder "ic_launcher.png"
    New-CenteredImage -img $srcImg -canvasWidth $d.LegacySize -canvasHeight $d.LegacySize -scale 0.78 -bgColor "#050B44" -outputPath $legacyPath

    # 3. Legacy Round Launcher (Navy background #050B44 circle, centered logo at 78% scale)
    $roundPath = Join-Path $folder "ic_launcher_round.png"
    New-CenteredImage -img $srcImg -canvasWidth $d.LegacySize -canvasHeight $d.LegacySize -scale 0.78 -bgColor "#050B44" -outputPath $roundPath -isRound $true

    Write-Host "Generated icons for $($d.Name)"
}

$srcImg.Dispose()
Write-Host "All Android icons generated successfully!"
