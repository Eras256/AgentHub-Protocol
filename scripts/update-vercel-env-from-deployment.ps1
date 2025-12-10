# Script para actualizar variables de Vercel con direcciones de fuji-latest.json
# y luego desplegar

Write-Host "🚀 Actualizando variables de Vercel desde fuji-latest.json..." -ForegroundColor Cyan
Write-Host ""

# Leer fuji-latest.json
$deploymentFile = Join-Path $PSScriptRoot "..\deployments\fuji-latest.json"
if (-not (Test-Path $deploymentFile)) {
    Write-Host "❌ Error: No se encontró deployments/fuji-latest.json" -ForegroundColor Red
    exit 1
}

$deployment = Get-Content $deploymentFile | ConvertFrom-Json
Write-Host "✅ Archivo de deployment cargado:" -ForegroundColor Green
Write-Host "   Network: $($deployment.network)" -ForegroundColor Gray
Write-Host "   Timestamp: $($deployment.timestamp)" -ForegroundColor Gray
Write-Host ""

# Variables a actualizar
$vars = @{
    "NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS" = $deployment.contracts.AgentRegistry
    "NEXT_PUBLIC_REVENUE_DISTRIBUTOR_ADDRESS" = $deployment.contracts.RevenueDistributor
    "NEXT_PUBLIC_SERVICE_MARKETPLACE_ADDRESS" = $deployment.contracts.ServiceMarketplace
    "USDC_CONTRACT_ADDRESS" = $deployment.contracts.USDC
}

Write-Host "📋 Variables a actualizar:" -ForegroundColor Cyan
foreach ($key in $vars.Keys) {
    Write-Host "   $key = $($vars[$key])" -ForegroundColor Yellow
}
Write-Host ""

# Verificar que vercel está instalado y autenticado
try {
    $vercelCheck = vercel whoami 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error: No estás autenticado en Vercel" -ForegroundColor Red
        Write-Host "   Ejecuta: vercel login" -ForegroundColor Yellow
        exit 1
    }
    Write-Host "✅ Autenticado en Vercel: $vercelCheck" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ Error: Vercel CLI no está instalado" -ForegroundColor Red
    Write-Host "   Instala con: npm install -g vercel" -ForegroundColor Yellow
    exit 1
}

# Preguntar confirmación
$confirm = Read-Host "¿Actualizar estas variables en Vercel? (s/n)"
if ($confirm -ne "s" -and $confirm -ne "S") {
    Write-Host "❌ Operación cancelada" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "🔄 Actualizando variables en Vercel..." -ForegroundColor Cyan
Write-Host ""

$environments = @("production", "preview", "development")
$updated = 0
$errors = 0

foreach ($varName in $vars.Keys) {
    $varValue = $vars[$varName]
    Write-Host "📝 Actualizando: $varName" -ForegroundColor Cyan
    
    foreach ($env in $environments) {
        # Primero eliminar si existe
        Write-Host "   Eliminando de $env..." -ForegroundColor Gray -NoNewline
        vercel env rm $varName $env --yes 2>&1 | Out-Null
        Start-Sleep -Milliseconds 500
        
        # Agregar nuevo valor
        Write-Host "`r   Agregando a $env..." -ForegroundColor Gray -NoNewline
        $varValue | vercel env add $varName $env 2>&1 | Out-Null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "`r   ✅ $env actualizado" -ForegroundColor Green
            $updated++
        } else {
            Write-Host "`r   ⚠️  $env - Error o ya existe" -ForegroundColor Yellow
            $errors++
        }
    }
    Write-Host ""
}

Write-Host "✅ Variables actualizadas: $updated" -ForegroundColor Green
if ($errors -gt 0) {
    Write-Host "⚠️  Errores/Advertencias: $errors" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🔍 Verificando variables actualizadas..." -ForegroundColor Cyan
vercel env ls

Write-Host ""
$deployConfirm = Read-Host "¿Desplegar a producción ahora? (s/n)"
if ($deployConfirm -eq "s" -or $deployConfirm -eq "S") {
    Write-Host ""
    Write-Host "🚀 Desplegando a producción..." -ForegroundColor Cyan
    vercel --prod
} else {
    Write-Host ""
    Write-Host "📝 Para desplegar manualmente, ejecuta:" -ForegroundColor Yellow
    Write-Host "   vercel --prod" -ForegroundColor Gray
}

