# AgentHub IoT SDK - C++ (ESP32/Arduino)

SDK oficial de AgentHub Protocol para dispositivos IoT basados en ESP32 y Arduino con WiFi.

## Características

- ✅ Registro de agentes on-chain
- ✅ Pagos autónomos x402
- ✅ Envío de datos de sensores
- ✅ Gestión de WiFi
- ✅ Compatible con ESP32 y Arduino con WiFi

## Instalación

### Arduino IDE

1. Descarga este repositorio
2. En Arduino IDE: `Sketch` → `Include Library` → `Add .ZIP Library`
3. Selecciona la carpeta `agenthub-iot-cpp`

### PlatformIO

```ini
lib_deps = 
    https://github.com/agenthub/agenthub-iot-cpp.git
```

## Uso Rápido

```cpp
#include <AgentHub.h>
#include <WiFi.h>

// Configuración
const char* ssid = "TU_WIFI";
const char* password = "TU_PASSWORD";
const char* agentId = "temp-monitor-001";
const char* privateKey = "0x..."; // Clave privada del wallet

AgentHub agent;

void setup() {
  Serial.begin(115200);
  
  // Conectar WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("WiFi conectado!");
  
  // Inicializar AgentHub
  agent.begin(agentId, privateKey);
  
  // Registrar agente on-chain (opcional, solo primera vez)
  // agent.registerAgent("ipfs://Qm...", "0.01"); // 0.01 AVAX stake
}

void loop() {
  // Leer sensor
  float temperature = readTemperature();
  
  // Si temperatura > umbral, hacer pago x402 y enviar alerta
  if (temperature > 30.0) {
    String response = agent.x402Request(
      "https://api.agenthub.protocol/api/alerts",
      "0.0001", // 0.0001 USDC
      "{\"temp\":" + String(temperature) + "}"
    );
    Serial.println("Alerta enviada: " + response);
  }
  
  delay(60000); // Esperar 1 minuto
}

float readTemperature() {
  // Tu código para leer el sensor
  return 25.5;
}
```

## API Reference

### `AgentHub.begin(agentId, privateKey)`
Inicializa el SDK con el ID del agente y la clave privada.

### `AgentHub.registerAgent(metadataIPFS, stakeAmount)`
Registra el agente en el contrato on-chain.

### `AgentHub.x402Request(url, amount, data)`
Realiza una petición HTTP con pago x402 automático.

### `AgentHub.sendSensorData(endpoint, data)`
Envía datos de sensores a un endpoint.

## Requisitos

- ESP32 o Arduino con WiFi
- WiFi conectado
- Wallet con AVAX para staking y USDC para pagos

## Redes Soportadas

- **Avalanche Fuji Testnet** (por defecto)
- **Avalanche Mainnet** (configurable)

## Licencia

MIT

