# Script para actualizar el alias del dominio después de un despliegue
# Uso: .\scripts\update-domain-alias.ps1 <deployment-url>

param(
    [Parameter(Mandatory=$true)]
    [string]$DeploymentUrl,
    
    [string]$Domain = "agenthub-protocolmx.vercel.app"
)

Write-Host "🔗 Actualizando alias del dominio..." -ForegroundColor Cyan
Write-Host "   Dominio: $Domain" -ForegroundColor Gray
Write-Host "   Despliegue: $DeploymentUrl" -ForegroundColor Gray

$result = vercel alias $DeploymentUrl $Domain 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Alias actualizado correctamente" -ForegroundColor Green
    Write-Host "   https://$Domain ahora apunta a $DeploymentUrl" -ForegroundColor Gray
} else {
    Write-Host "❌ Error al actualizar el alias" -ForegroundColor Red
    Write-Host $result -ForegroundColor Red
    exit 1
}

