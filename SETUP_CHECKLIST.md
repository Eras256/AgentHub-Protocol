# Checklist de Configuración - AgentHub Protocol

## ✅ Configuración Inicial

- [ ] Instalar Node.js 18+
- [ ] Instalar pnpm globalmente: `npm install -g pnpm`
- [ ] Clonar o descargar el proyecto
- [ ] Ejecutar `pnpm install`

## 🔐 Variables de Entorno

Crea `.env.local` basado en `env.example`:

- [ ] `NEXT_PUBLIC_THIRDWEB_CLIENT_ID` - Obtener de Thirdweb Dashboard
- [ ] `AVALANCHE_FUJI_RPC` - URL del RPC (puede ser público)
- [ ] `DEPLOYER_PRIVATE_KEY` - Solo si vas a desplegar contratos

### Opcionales pero Recomendados:

- [ ] `SNOWTRACE_API_KEY` - Para verificar contratos
- [ ] `PINATA_API_KEY`, `PINATA_SECRET_KEY`, `PINATA_JWT` - Para IPFS
- [ ] `KITE_API_KEY` - Para integración Kite AI (cuando esté disponible)

## 🏗️ Smart Contracts

- [ ] Ejecutar `pnpm compile` para compilar contratos
- [ ] Ejecutar `pnpm test` para verificar que los tests pasen
- [ ] (Opcional) Obtener AVAX de faucet: https://faucet.avax.network/
- [ ] (Opcional) Ejecutar `pnpm deploy:fuji` para desplegar
- [ ] (Opcional) Actualizar `.env.local` con direcciones de contratos desplegados

## 🎨 Frontend

- [ ] Verificar que `pnpm dev` inicie correctamente
- [ ] Abrir http://localhost:3000
- [ ] Conectar wallet usando Thirdweb Connect
- [ ] Verificar que todas las páginas carguen:
  - [ ] Landing page (/)
  - [ ] Dashboard (/dashboard)
  - [ ] Marketplace (/marketplace)
  - [ ] Create Agent (/create-agent)

## 📱 PWA (Progressive Web App)

- [ ] Crear iconos para PWA:
  - [ ] `public/icon-192.png` (192x192px)
  - [ ] `public/icon-512.png` (512x512px)
- [ ] Verificar que `manifest.json` esté correcto
- [ ] Probar instalación como PWA en dispositivo móvil

## 🧪 Testing

- [ ] Ejecutar `pnpm test` - Todos los tests deben pasar
- [ ] Ejecutar `pnpm test:coverage` - Verificar cobertura > 80%
- [ ] Probar funcionalidad manualmente en el navegador

## 📚 Documentación

- [ ] Leer README.md
- [ ] Revisar INSTALL.md
- [ ] Consultar CONTRIBUTING.md si vas a contribuir

## 🚀 Listo para Desarrollo

Una vez completado este checklist, estás listo para:

1. Crear tu primer agente
2. Publicar servicios en el marketplace
3. Integrar con x402 para pagos
4. Desarrollar nuevas funcionalidades

## 🆘 Problemas Comunes

### Error: "Module not found"
**Solución**: Ejecuta `pnpm install` nuevamente

### Error: "Invalid RPC URL"
**Solución**: Verifica que `AVALANCHE_FUJI_RPC` esté correcto en `.env.local`

### Error: "Missing environment variable"
**Solución**: Asegúrate de que el archivo se llame `.env.local` (no `.env`)

### Contratos no compilan
**Solución**: Verifica que tienes Hardhat instalado: `pnpm add -D hardhat`

### Wallet no conecta
**Solución**: Verifica que `NEXT_PUBLIC_THIRDWEB_CLIENT_ID` esté configurado correctamente

