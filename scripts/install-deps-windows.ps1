# Windows dependencies installation script for Telegram Desktop Controller
# Installs: NirCmd and SoundVolumeCommandLine to System32 (requires admin rights)
# Run: powershell -ExecutionPolicy Bypass -File install-deps-windows.ps1

# Check if running as administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "This script requires administrator privileges!" -ForegroundColor Red
    Write-Host "Please run PowerShell as Administrator and try again." -ForegroundColor Yellow
    Write-Host "`nTo run as administrator:" -ForegroundColor Cyan
    Write-Host "1. Right-click on PowerShell" 
    Write-Host "2. Select 'Run as administrator'"
    Write-Host "3. Navigate to project folder and run this script"
    exit 1
}

Write-Host "Installing Windows dependencies for Telegram Desktop Controller..." -ForegroundColor Green

# Function to install a tool to System32
function Install-Tool {
    param(
        [string]$Name,
        [string]$ExeName,
        [string]$Url
    )
    
    Write-Host "`nInstalling $Name..." -ForegroundColor Cyan
    
    # Check if already installed in System32
    $systemPath = Join-Path $env:SystemRoot "System32\$ExeName"
    if (Test-Path $systemPath) {
        Write-Host "$Name already installed in System32: $systemPath" -ForegroundColor Green
        return $true
    }

    Write-Host "Downloading $Name from $Url..."

    # Create temp directory
    $tempDir = Join-Path $env:TEMP "$Name-install"
    if (Test-Path $tempDir) {
        Remove-Item $tempDir -Recurse -Force
    }
    New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

    try {
        # Download archive
        $zipPath = Join-Path $tempDir "$Name.zip"
        Invoke-WebRequest -Uri $Url -OutFile $zipPath -UseBasicParsing
        Write-Host "File downloaded: $zipPath"

        # Extract
        Add-Type -AssemblyName System.IO.Compression.FileSystem
        [System.IO.Compression.ZipFile]::ExtractToDirectory($zipPath, $tempDir)
        Write-Host "Archive extracted"

        # Find executable
        $toolExe = Get-ChildItem -Path $tempDir -Name $ExeName -Recurse | Select-Object -First 1
        if (-not $toolExe) {
            throw "$ExeName not found in archive"
        }
        
        $sourcePath = Join-Path $tempDir $toolExe
        Write-Host "Found: $sourcePath"

        # Install to System32 (we have admin rights)
        Copy-Item $sourcePath $systemPath -Force
        Write-Host "$Name installed to System32: $systemPath" -ForegroundColor Green

        # Test installation
        Write-Host "Testing $Name..."
        $testResult = $false
        
        if ($Name -eq "NirCmd") {
            & $systemPath help > $null 2>&1
            $testResult = ($LASTEXITCODE -eq 0)
        } elseif ($Name -eq "SoundVolumeCommandLine") {
            & $systemPath /? > $null 2>&1
            $testResult = ($LASTEXITCODE -eq 0 -or $LASTEXITCODE -eq 1)
        }
        
        if ($testResult) {
            Write-Host "$Name successfully installed and working!" -ForegroundColor Green
            return $true
        } else {
            throw "$Name installed but not working correctly"
        }

    } catch {
        Write-Host "Error installing $Name`: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    } finally {
        # Cleanup temp files
        if (Test-Path $tempDir) {
            Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
}

# Install tools
Write-Host "Installing required NirSoft tools to System32..." -ForegroundColor Cyan

$arch = if ([Environment]::Is64BitOperatingSystem) { "-x64" } else { "" }
$nircmdUrl = "https://www.nirsoft.net/utils/nircmd$arch.zip"
$svclUrl = "https://www.nirsoft.net/utils/svcl.zip"

$nircmdSuccess = Install-Tool -Name "NirCmd" -ExeName "nircmd.exe" -Url $nircmdUrl
$svclSuccess = Install-Tool -Name "SoundVolumeCommandLine" -ExeName "svcl.exe" -Url $svclUrl

# Show results
Write-Host "`nInstallation Results:" -ForegroundColor Cyan
if ($nircmdSuccess) {
    Write-Host "  NirCmd: Installed in System32" -ForegroundColor Green
} else {
    Write-Host "  NirCmd: Error" -ForegroundColor Red
}

if ($svclSuccess) {
    Write-Host "  SoundVolumeCommandLine: Installed in System32" -ForegroundColor Green
} else {
    Write-Host "  SoundVolumeCommandLine: Error" -ForegroundColor Red
}

if ($nircmdSuccess -and $svclSuccess) {
    Write-Host "`nAll Windows dependencies installed successfully!" -ForegroundColor Green
    
    Write-Host "`nTools are now available system-wide:" -ForegroundColor Cyan
    Write-Host "  # NirCmd commands:"
    Write-Host "  nircmd mutesysvolume 1              # Mute sound"
    Write-Host "  nircmd mutesysvolume 0              # Unmute sound"
    Write-Host "  nircmd sendkeypress 0xB3            # Play/Pause"
    Write-Host "  nircmd savescreenshot screen.png    # Screenshot"
    Write-Host ""
    Write-Host "  # SoundVolumeCommandLine commands:"
    Write-Host "  svcl /GetPercent DefaultRenderDevice # Get volume"
    Write-Host "  svcl /GetMute DefaultRenderDevice    # Check mute"
    Write-Host "  svcl /SetVolume DefaultRenderDevice 50 # Set volume"
    
    Write-Host "`nYou can now start the Telegram bot with:" -ForegroundColor Green
    Write-Host "  npm install"
    Write-Host "  npm start"
    
} else {
    Write-Host "`nSome dependencies failed to install!" -ForegroundColor Yellow
    Write-Host "`nManual installation:" -ForegroundColor Yellow
    if (-not $nircmdSuccess) {
        Write-Host "- Download NirCmd: https://www.nirsoft.net/utils/nircmd.html"
        Write-Host "  Extract nircmd.exe to C:\\Windows\\System32\\"
    }
    if (-not $svclSuccess) {
        Write-Host "- Download SoundVolumeCommandLine: https://www.nirsoft.net/utils/sound_volume_command_line.html"
        Write-Host "  Extract svcl.exe to C:\\Windows\\System32\\"
    }
    exit 1
}

Write-Host "`nWindows dependencies installation completed!" -ForegroundColor Green 