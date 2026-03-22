# Xác định thư mục chứa script
$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
if ([string]::IsNullOrEmpty($ScriptRoot)) { $ScriptRoot = $PWD }

Write-Host "Cleaning up DEV environment..." -ForegroundColor Cyan

# Dùng đường dẫn tuyệt đối cho file compose
$ComposeFile = Join-Path $ScriptRoot "docker-compose.dev.yml"

# Dừng và xóa các container, network liên quan đến dev
docker compose -f "$ComposeFile" down --volumes --remove-orphans

Write-Host "Starting DEV MySQL in Docker..." -ForegroundColor Green
docker compose -f "$ComposeFile" up -d

Write-Host "Waiting for MySQL to be healthy..." -ForegroundColor Cyan
$maxRetries = 30
$retryCount = 0
while ($retryCount -lt $maxRetries) {
    $status = docker inspect --format='{{.State.Health.Status}}' lms-mysql-dev 2>$null
    if ($status -eq "healthy") {
        Write-Host "`nMySQL is up and healthy!" -ForegroundColor Green
        break
    }
    Write-Host "." -NoNewline
    Start-Sleep -Seconds 2
    $retryCount++
}

if ($retryCount -eq $maxRetries) {
    Write-Host "`nTimed out waiting for MySQL healthcheck." -ForegroundColor Red
}

Write-Host "DEV environment is ready." -ForegroundColor Yellow
Write-Host "You can now run 'npm run dev:be' and 'npm run dev:fe' locally." -ForegroundColor Yellow
Write-Host "You can now run 'npm run dev:be' and 'npm run dev:fe' locally." -ForegroundColor Yellow
