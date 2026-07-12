<#!
.SYNOPSIS
Initializes PostgreSQL for a local Raseed desktop installation.

.DESCRIPTION
Run this once in an elevated PowerShell window after PostgreSQL is installed.
It creates a least-privileged local role and database, then records the encrypted
runtime configuration when Raseed is launched for the first time.
#>

[CmdletBinding()]
param(
  [string]$PostgresBin = "",
  [string]$DatabaseName = "raseed_prod",
  [string]$RoleName = "raseed_app",
  [string]$Port = "5432",
  [string]$PostgresServiceName = "",
  [switch]$PreventSleep
)

$ErrorActionPreference = "Stop"

function Find-PostgresTool([string]$tool) {
  if ($PostgresBin) {
    $candidate = Join-Path $PostgresBin "$tool.exe"
    if (Test-Path $candidate) { return $candidate }
  }
  $command = Get-Command "$tool.exe" -ErrorAction SilentlyContinue
  if ($command) { return $command.Source }
  throw "PostgreSQL tool $tool.exe was not found. Install PostgreSQL, or pass -PostgresBin with its bin folder."
}

function Find-PostgresService {
  if ($PostgresServiceName) {
    $service = Get-Service -Name $PostgresServiceName -ErrorAction Stop
    return $service
  }

  $services = @(Get-Service | Where-Object {
    $_.Name -like "postgresql*" -or $_.DisplayName -like "PostgreSQL*"
  })
  if ($services.Count -eq 0) {
    throw "PostgreSQL Windows service was not found. Install PostgreSQL as a Windows service, or pass -PostgresServiceName."
  }
  if ($services.Count -gt 1) {
    $names = ($services | ForEach-Object { $_.Name }) -join ", "
    throw "Multiple PostgreSQL services were found ($names). Run again with -PostgresServiceName."
  }
  return $services[0]
}

if (-not ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  throw "Run PowerShell as Administrator, then run this script again."
}

$psql = Find-PostgresTool "psql"
$postgresService = Find-PostgresService
Set-Service -Name $postgresService.Name -StartupType Automatic
if ($postgresService.Status -ne "Running") {
  Start-Service -Name $postgresService.Name
}

# Restart the database service after a crash. The first two retries are one minute apart.
& sc.exe failure $postgresService.Name reset= 86400 actions= restart/60000/restart/60000/restart/60000 | Out-Null
& sc.exe failureflag $postgresService.Name 1 | Out-Null

if ($PreventSleep) {
  powercfg /change standby-timeout-ac 0
  powercfg /change hibernate-timeout-ac 0
}
$rolePassword = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
$escapedRole = $RoleName.Replace('"', '""')
$escapedDb = $DatabaseName.Replace('"', '""')
$passwordLiteral = $rolePassword.Replace("'", "''")

$createRole = "DO `$`$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '$($RoleName.Replace("'", "''"))') THEN CREATE ROLE `"$escapedRole`" LOGIN PASSWORD '$passwordLiteral' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT; END IF; END `$`$;"
& $psql -v ON_ERROR_STOP=1 -U postgres -p $Port -d postgres -c $createRole

$dbExists = & $psql -At -U postgres -p $Port -d postgres -c "SELECT 1 FROM pg_database WHERE datname = '$($DatabaseName.Replace("'", "''"))';"
if ($dbExists -ne "1") {
  & $psql -v ON_ERROR_STOP=1 -U postgres -p $Port -d postgres -c "CREATE DATABASE `"$escapedDb`" OWNER `"$escapedRole`";"
}

& $psql -v ON_ERROR_STOP=1 -U postgres -p $Port -d $DatabaseName -c "GRANT ALL ON SCHEMA public TO `"$escapedRole`";"

$configDirectory = Join-Path $env:APPDATA "Raseed"
New-Item -ItemType Directory -Force -Path $configDirectory | Out-Null
$setupPath = Join-Path $configDirectory "database-connection.txt"
$connection = "postgresql://$RoleName:$rolePassword@127.0.0.1:$Port/$DatabaseName?schema=public"
Set-Content -Path $setupPath -Value $connection -NoNewline -Encoding utf8

Write-Host "Raseed database is ready." -ForegroundColor Green
Write-Host "PostgreSQL service '$($postgresService.Name)' is configured to start automatically and restart after failures."
if ($PreventSleep) {
  Write-Host "Sleep and hibernation are disabled while plugged in."
} else {
  Write-Host "For 24-hour operation, keep the shop computer powered on and disable sleep, or rerun with -PreventSleep."
}
Write-Host "Start Raseed once. It imports $setupPath and removes it after successful secure import."
