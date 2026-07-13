<#
.SYNOPSIS
Installs the pinned PostgreSQL prerequisite and prepares a private Raseed database.

.DESCRIPTION
This script is called by the elevated Raseed NSIS installer. It deliberately refuses
to alter an unrelated existing PostgreSQL installation because its administrator
password is unknown and changing it could damage another application.
#>

[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$PostgresInstaller,
  [switch]$PreventSleep
)

$ErrorActionPreference = "Stop"
$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$logPath = Join-Path $scriptRoot "bootstrap-install.log"

function Write-BootstrapLog([string]$message) {
  $line = "$(Get-Date -Format o) $message"
  Add-Content -Path $logPath -Value $line -Encoding utf8
  Write-Host $line
}

function Write-InstallationReport([string]$status, [string]$serviceName = "") {
  $report = [ordered]@{
    generatedAt = (Get-Date).ToUniversalTime().ToString("o")
    status = $status
    postgresqlVersion = "17.7"
    databaseName = "raseed_prod"
    databaseService = $serviceName
  }
  $report | ConvertTo-Json | Set-Content -Path (Join-Path $scriptRoot "installation-report.json") -Encoding utf8
}

function New-Secret([int]$length = 32) {
  $alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#%_-"
  -join (1..$length | ForEach-Object { $alphabet[(Get-Random -Minimum 0 -Maximum $alphabet.Length)] })
}

function Get-PostgresServices {
  @(Get-Service | Where-Object { $_.Name -like "postgresql*" -or $_.DisplayName -like "PostgreSQL*" })
}

function Find-PostgresBin {
  $candidate = Get-ChildItem -Path (Join-Path $env:ProgramFiles "PostgreSQL") -Filter "psql.exe" -Recurse -ErrorAction SilentlyContinue |
    Sort-Object FullName -Descending |
    Select-Object -First 1
  if (-not $candidate) { throw "PostgreSQL was installed but psql.exe could not be found." }
  Split-Path -Parent $candidate.FullName
}

function Assert-PrerequisiteIntegrity {
  $manifestPath = Join-Path (Split-Path -Parent $PostgresInstaller) "postgresql.json"
  if (-not (Test-Path $PostgresInstaller) -or -not (Test-Path $manifestPath)) {
    throw "The Raseed PostgreSQL prerequisite is missing. Use the complete Raseed release folder."
  }
  $manifest = Get-Content -Path $manifestPath -Raw | ConvertFrom-Json
  if ($manifest.filename -ne (Split-Path -Leaf $PostgresInstaller)) { throw "PostgreSQL prerequisite manifest does not match the installer." }
  if ((Get-Item -Path $PostgresInstaller).Length -ne $manifest.byteLength) { throw "PostgreSQL prerequisite size verification failed." }
  $actualHash = (Get-FileHash -Path $PostgresInstaller -Algorithm SHA256).Hash.ToLowerInvariant()
  if ($actualHash -ne $manifest.sha256.ToLowerInvariant()) { throw "PostgreSQL prerequisite checksum verification failed." }
}

try {
  Remove-Item -Path $logPath -Force -ErrorAction SilentlyContinue
  Write-BootstrapLog "Raseed database bootstrap started."
  $services = Get-PostgresServices
  $createdByRaseed = $false
  $postgresPassword = ""

  if ($services.Count -eq 0) {
    Assert-PrerequisiteIntegrity
    $postgresPassword = New-Secret
    $installDir = Join-Path $env:ProgramFiles "PostgreSQL\17"
    $dataDir = Join-Path $env:ProgramData "Raseed\PostgreSQL\data"
    New-Item -ItemType Directory -Force -Path $dataDir | Out-Null
    Write-BootstrapLog "Installing bundled PostgreSQL 17.7."
    $arguments = @(
      "--mode", "unattended",
      "--unattendedmodeui", "none",
      "--prefix", $installDir,
      "--datadir", $dataDir,
      "--serverport", "5432",
      "--superpassword", $postgresPassword,
      "--servicepassword", $postgresPassword
    )
    & $PostgresInstaller @arguments
    if ($LASTEXITCODE -ne 0) { throw "PostgreSQL installer failed with exit code $LASTEXITCODE." }
    $services = Get-PostgresServices
    if ($services.Count -ne 1) { throw "PostgreSQL installation did not create one identifiable Windows service." }
    $createdByRaseed = $true
  }

  if (-not $createdByRaseed) {
    throw "A PostgreSQL service already exists on this computer. Raseed will not change an existing database automatically. Ask Raseed support to connect it safely."
  }

  $postgresBin = Find-PostgresBin
  $initialize = Join-Path $scriptRoot "Initialize-Raseed.ps1"
  Write-BootstrapLog "Creating least-privileged Raseed database user and database."
  if ($PreventSleep) {
    & powershell.exe -NoLogo -NoProfile -NonInteractive -ExecutionPolicy Bypass -File $initialize -PostgresBin $postgresBin -PostgresServiceName $services[0].Name -PostgresPassword $postgresPassword -PreventSleep
  } else {
    & powershell.exe -NoLogo -NoProfile -NonInteractive -ExecutionPolicy Bypass -File $initialize -PostgresBin $postgresBin -PostgresServiceName $services[0].Name -PostgresPassword $postgresPassword
  }
  if ($LASTEXITCODE -ne 0) { throw "Raseed database initialization failed with exit code $LASTEXITCODE." }
  Write-InstallationReport "success" $services[0].Name
  Write-BootstrapLog "Raseed database bootstrap completed successfully."
  exit 0
} catch {
  Write-InstallationReport "failed"
  Write-BootstrapLog "FAILED: $($_.Exception.Message)"
  exit 1
}
