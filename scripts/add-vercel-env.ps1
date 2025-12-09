# Script para agregar variables de entorno seguras a Vercel
# EXCLUYE: claves privadas, secret keys y datos sensibles

Write-Host "🔒 Verificando variables de entorno seguras para Vercel..." -ForegroundColor Cyan

# Variables que NUNCA deben ir a Vercel (claves privadas y secretos)
$BLOCKED_VARS = @(
    "DEPLOYER_PRIVATE_KEY",
    "PRIVATE_KEY", 
    "FACILITATOR_PRIVATE_KEY"
)

# Variables que son SEGURAS para Vercel (públicas o no sensibles)
$SAFE_VARS = @(
    # NEXT_PUBLIC_* - Todas son públicas por diseño
    "NEXT_PUBLIC_THIRDWEB_CLIENT_ID",
    "NEXT_PUBLIC_MERCHANT_ADDRESS",
    "NEXT_PUBLIC_AVALANCHE_FUJI_RPC",
    "NEXT_PUBLIC_ENABLE_AI_INSIGHTS",
    "NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS",
    "NEXT_PUBLIC_REVENUE_DISTRIBUTOR_ADDRESS",
    "NEXT_PUBLIC_SERVICE_MARKETPLACE_ADDRESS",
    "NEXT_PUBLIC_BENQI_COMPTROLLER_ADDRESS",
    "NEXT_PUBLIC_AAVE_PROVIDER_ADDRESS",
    "NEXT_PUBLIC_APP_URL",
    
    # URLs públicas y direcciones de contratos
    "AVALANCHE_FUJI_RPC",
    "USDC_CONTRACT_ADDRESS",
    "THIRDWEB_FACILITATOR_URL",
    "KITE_RPC_URL",
    "TRADER_JOE_ROUTER_ADDRESS",
    "WAVAX_ADDRESS",
    
    # Configuración no sensible
    "NODE_ENV"
)

# Variables que son necesarias para server-side pero son sensibles
# Estas deben agregarse manualmente con cuidado
$SENSITIVE_BUT_NEEDED = @(
    "THIRDWEB_SECRET_KEY",           # Necesario para server-side API routes
    "THIRDWEB_SERVER_WALLET_ADDRESS", # Necesario para x402 payments
    "GOOGLE_GEMINI_API_KEY",         # Necesario para AI API routes
    "GEMINI_API_KEY"                 # Alternativa para Gemini
)

Write-Host "`n✅ Variables SEGURAS que se agregarán:" -ForegroundColor Green
$SAFE_VARS | ForEach-Object { Write-Host "  - $_" -ForegroundColor Gray }

Write-Host "`n⚠️  Variables SENSIBLES (necesarias para server-side, agregar manualmente):" -ForegroundColor Yellow
$SENSITIVE_BUT_NEEDED | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }

Write-Host "`n❌ Variables BLOQUEADAS (NUNCA se agregarán):" -ForegroundColor Red
$BLOCKED_VARS | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }

Write-Host "`n📋 Leyendo .env.local..." -ForegroundColor Cyan

if (-not (Test-Path .env.local)) {
    Write-Host "❌ Error: .env.local no encontrado" -ForegroundColor Red
    exit 1
}

$envContent = Get-Content .env.local
$varsToAdd = @{}

foreach ($line in $envContent) {
    # Saltar comentarios y líneas vacías
    if ($line -match '^\s*#' -or $line -match '^\s*$') {
        continue
    }
    
    # Extraer variable y valor
    if ($line -match '^([A-Z_]+)=(.*)$') {
        $varName = $matches[1]
        $varValue = $matches[2].Trim()
        
        # Saltar si está bloqueada
        if ($BLOCKED_VARS -contains $varName) {
            Write-Host "  ⛔ Bloqueada: $varName" -ForegroundColor Red
            continue
        }
        
        # Saltar si el valor es placeholder
        if ($varValue -match 'your_.*_here' -or $varValue -eq '') {
            Write-Host "  ⏭️  Omitida (placeholder): $varName" -ForegroundColor Gray
            continue
        }
        
        # Agregar si es segura
        if ($SAFE_VARS -contains $varName) {
            $varsToAdd[$varName] = $varValue
            Write-Host "  ✅ Segura: $varName" -ForegroundColor Green
        }
        # Advertir si es sensible pero necesaria
        elseif ($SENSITIVE_BUT_NEEDED -contains $varName) {
            Write-Host "  ⚠️  Sensible (necesaria): $varName - Requiere agregar manualmente" -ForegroundColor Yellow
        }
        else {
            Write-Host "  ⚠️  No categorizada: $varName - Revisar manualmente" -ForegroundColor Yellow
        }
    }
}

Write-Host "`n🚀 Agregando variables seguras a Vercel..." -ForegroundColor Cyan
Write-Host "   (Para producción, usa: vercel env add <VAR> production)" -ForegroundColor Gray
Write-Host "   (Para preview, usa: vercel env add <VAR> preview)" -ForegroundColor Gray
Write-Host "   (Para desarrollo, usa: vercel env add <VAR> development)`n" -ForegroundColor Gray

$count = 0
foreach ($var in $varsToAdd.Keys) {
    $value = $varsToAdd[$var]
    Write-Host "Agregando: $var" -ForegroundColor Cyan
    
    # Agregar para producción
    $result = vercel env add $var production 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ Agregada para producción" -ForegroundColor Green
        $count++
    } else {
        Write-Host "  ⚠️  Error o ya existe: $result" -ForegroundColor Yellow
    }
    
    # Agregar para preview
    $result = vercel env add $var preview 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ Agregada para preview" -ForegroundColor Green
    }
    
    # Agregar para desarrollo
    $result = vercel env add $var development 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ Agregada para desarrollo" -ForegroundColor Green
    }
}

Write-Host "`n✅ Proceso completado. $count variables seguras agregadas." -ForegroundColor Green
Write-Host "`n⚠️  IMPORTANTE: Las siguientes variables sensibles deben agregarse MANUALMENTE:" -ForegroundColor Yellow
$SENSITIVE_BUT_NEEDED | ForEach-Object { 
    Write-Host "  - $_" -ForegroundColor Yellow
    Write-Host "    Comando: vercel env add $_ production" -ForegroundColor Gray
}

Write-Host "`n📝 Nota: Usa 'vercel env ls' para ver todas las variables configuradas" -ForegroundColor Cyan

