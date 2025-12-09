# Script mejorado para agregar SOLO variables seguras a Vercel
# EXCLUYE: claves privadas, secret keys y datos sensibles

param(
    [switch]$DryRun = $false
)

Write-Host "🔒 Verificando variables de entorno seguras para Vercel..." -ForegroundColor Cyan
Write-Host ""

# Variables que NUNCA deben ir a Vercel
$BLOCKED_VARS = @(
    "DEPLOYER_PRIVATE_KEY",
    "PRIVATE_KEY", 
    "FACILITATOR_PRIVATE_KEY"
)

# Variables seguras con sus valores del .env.local
$SAFE_VARS = @{
    "NEXT_PUBLIC_THIRDWEB_CLIENT_ID" = "ddb9db37e18a182d55a0d0e6cf44c86d"
    "NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS" = "0x6750Ed798186b4B5a7441D0f46Dd36F372441306"
    "NEXT_PUBLIC_REVENUE_DISTRIBUTOR_ADDRESS" = "0x0B987e64a7cB481Aad7500011503D5d0444b1707"
    "NEXT_PUBLIC_SERVICE_MARKETPLACE_ADDRESS" = "0xe51BF692F7ce26999f8D18d799f73Ad250BfeEC4"
    "NEXT_PUBLIC_ENABLE_AI_INSIGHTS" = "true"
    "AVALANCHE_FUJI_RPC" = "https://api.avax-test.network/ext/bc/C/rpc"
    "USDC_CONTRACT_ADDRESS" = "0x5425890298aed601595a70AB815c96711a31Bc65"
    "THIRDWEB_FACILITATOR_URL" = "https://facilitator.thirdweb.com"
    "KITE_RPC_URL" = "https://rpc-testnet.gokite.ai/"
    "TRADER_JOE_ROUTER_ADDRESS" = "0xd7f655E3376cE2d7A2b08fF01Eb3B1023191A901"
    "WAVAX_ADDRESS" = "0xd00ae08403B9bbb9124bB305C09058E32C39A48c"
    "NODE_ENV" = "production"
}

Write-Host "✅ Variables SEGURAS que se agregarán:" -ForegroundColor Green
$SAFE_VARS.Keys | ForEach-Object { Write-Host "  - $_" -ForegroundColor Gray }

Write-Host ""
Write-Host "❌ Variables BLOQUEADAS (NUNCA se agregarán):" -ForegroundColor Red
$BLOCKED_VARS | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }

Write-Host ""
Write-Host "⚠️  Variables SENSIBLES (agregar MANUALMENTE):" -ForegroundColor Yellow
Write-Host "  - THIRDWEB_SECRET_KEY (necesario para server-side)" -ForegroundColor Yellow
Write-Host "  - THIRDWEB_SERVER_WALLET_ADDRESS (necesario para x402)" -ForegroundColor Yellow
Write-Host "  - GOOGLE_GEMINI_API_KEY (necesario para AI)" -ForegroundColor Yellow

if ($DryRun) {
    Write-Host ""
    Write-Host "🔍 DRY RUN - No se agregarán variables" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Comandos que se ejecutarían:" -ForegroundColor Cyan
    foreach ($var in $SAFE_VARS.Keys) {
        $value = $SAFE_VARS[$var]
        Write-Host "  vercel env add $var production" -ForegroundColor Gray
        Write-Host "  vercel env add $var preview" -ForegroundColor Gray
        Write-Host "  vercel env add $var development" -ForegroundColor Gray
    }
    exit 0
}

# Verificar que vercel está instalado y autenticado
$vercelCheck = vercel whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error: No estás autenticado en Vercel" -ForegroundColor Red
    Write-Host "   Ejecuta: vercel login" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "🚀 Agregando variables seguras a Vercel..." -ForegroundColor Cyan
Write-Host ""

$count = 0
$environments = @("production", "preview", "development")

foreach ($var in $SAFE_VARS.Keys) {
    $value = $SAFE_VARS[$var]
    Write-Host "Agregando: $var" -ForegroundColor Cyan
    
    foreach ($env in $environments) {
        # Usar echo para pasar el valor
        $result = echo $value | vercel env add $var $env 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✅ $env" -ForegroundColor Green
        } else {
            # Verificar si ya existe
            if ($result -match "already exists" -or $result -match "Environment Variable") {
                Write-Host "  ⚠️  $env (ya existe)" -ForegroundColor Yellow
            } else {
                Write-Host "  ❌ $env - Error: $result" -ForegroundColor Red
            }
        }
    }
    $count++
    Write-Host ""
}

Write-Host "✅ Proceso completado. $count variables procesadas." -ForegroundColor Green
Write-Host ""
Write-Host "📝 Próximos pasos:" -ForegroundColor Cyan
Write-Host "  1. Agregar manualmente las variables sensibles:" -ForegroundColor Yellow
Write-Host "     vercel env add THIRDWEB_SECRET_KEY production" -ForegroundColor Gray
Write-Host "     vercel env add THIRDWEB_SERVER_WALLET_ADDRESS production" -ForegroundColor Gray
Write-Host "     vercel env add GOOGLE_GEMINI_API_KEY production" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. Verificar variables:" -ForegroundColor Yellow
Write-Host "     vercel env ls" -ForegroundColor Gray
Write-Host ""
Write-Host "  3. Verificar que NO hay claves privadas:" -ForegroundColor Yellow
Write-Host "     vercel env ls | Select-String 'PRIVATE_KEY'" -ForegroundColor Gray
Write-Host "     (Debe retornar vacío)" -ForegroundColor Gray

