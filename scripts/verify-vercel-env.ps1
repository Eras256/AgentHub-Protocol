# Script para verificar y actualizar variables de entorno en Vercel
# Este script verifica que todas las variables necesarias estén configuradas

Write-Host "🔍 Verificando variables de entorno en Vercel..." -ForegroundColor Cyan
Write-Host ""

# Variables requeridas para producción
$REQUIRED_VARS = @{
    "NEXT_PUBLIC_THIRDWEB_CLIENT_ID" = "Required for ThirdWeb SDK"
    "NEXT_PUBLIC_AVALANCHE_FUJI_RPC" = "https://api.avax-test.network/ext/bc/C/rpc"
    "AVALANCHE_FUJI_RPC" = "https://api.avax-test.network/ext/bc/C/rpc"
    "NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS" = "0x6750Ed798186b4B5a7441D0f46Dd36F372441306"
    "NEXT_PUBLIC_REVENUE_DISTRIBUTOR_ADDRESS" = "0x0B987e64a7cB481Aad7500011503D5d0444b1707"
    "NEXT_PUBLIC_SERVICE_MARKETPLACE_ADDRESS" = "0xe51BF692F7ce26999f8D18d799f73Ad250BfeEC4"
    "USDC_CONTRACT_ADDRESS" = "0x5425890298aed601595a70AB815c96711a31Bc65"
    "THIRDWEB_FACILITATOR_URL" = "https://facilitator.thirdweb.com"
    "NEXT_PUBLIC_ENABLE_AI_INSIGHTS" = "true"
    "NODE_ENV" = "production"
}

# Variables sensibles que deben estar configuradas manualmente
$SENSITIVE_VARS = @(
    "THIRDWEB_SECRET_KEY",
    "THIRDWEB_SERVER_WALLET_ADDRESS",
    "GOOGLE_GEMINI_API_KEY"
)

Write-Host "✅ Variables requeridas para producción:" -ForegroundColor Green
$REQUIRED_VARS.Keys | ForEach-Object { 
    Write-Host "  - $_ = $($REQUIRED_VARS[$_])" -ForegroundColor Gray 
}

Write-Host ""
Write-Host "⚠️  Variables sensibles (deben configurarse manualmente):" -ForegroundColor Yellow
$SENSITIVE_VARS | ForEach-Object { 
    Write-Host "  - $_" -ForegroundColor Yellow 
}

Write-Host ""
Write-Host "📋 Para agregar variables a Vercel, usa:" -ForegroundColor Cyan
Write-Host "  vercel env add VARIABLE_NAME" -ForegroundColor White
Write-Host ""
Write-Host "📋 Para ver todas las variables:" -ForegroundColor Cyan
Write-Host "  vercel env ls" -ForegroundColor White
Write-Host ""
Write-Host "📋 Para verificar que NEXT_PUBLIC_AVALANCHE_FUJI_RPC esté configurada:" -ForegroundColor Cyan
Write-Host "  vercel env ls | grep NEXT_PUBLIC_AVALANCHE_FUJI_RPC" -ForegroundColor White
Write-Host ""

# Verificar si vercel CLI está instalado
try {
    $vercelVersion = vercel --version 2>&1
    Write-Host "✅ Vercel CLI instalado: $vercelVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Vercel CLI no está instalado. Instálalo con: npm install -g vercel" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔍 Listando variables actuales en Vercel..." -ForegroundColor Cyan
vercel env ls

