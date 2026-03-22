Write-Host "Cleaning up TEST environment..." -ForegroundColor Cyan

# Dừng và xóa các container, network, volumes liên quan đến test
docker compose -f docker-compose.test.yml down --volumes --remove-orphans

Write-Host "Building and starting all TEST services (FE, BE, MySQL) in Docker..." -ForegroundColor Green
docker compose -f docker-compose.test.yml up -d --build

Write-Host "TEST environment is starting up..." -ForegroundColor Yellow
Write-Host "Frontend: http://localhost:5174" -ForegroundColor White
Write-Host "Backend API: http://localhost:5001" -ForegroundColor White
docker compose -f docker-compose.test.yml ps
