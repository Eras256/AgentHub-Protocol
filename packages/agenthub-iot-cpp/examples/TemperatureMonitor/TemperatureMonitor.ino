/*
 * AgentHub IoT - Temperature Monitor Example
 * 
 * Este ejemplo muestra cómo usar AgentHub SDK para:
 * - Registrar un agente IoT
 * - Monitorear temperatura
 * - Enviar alertas con pagos x402 cuando la temperatura excede un umbral
 * 
 * Hardware requerido:
 * - ESP32
 * - Sensor de temperatura (DS18B20 o similar)
 * 
 * Configuración:
 * 1. Actualiza WIFI_SSID y WIFI_PASSWORD
 * 2. Actualiza AGENT_ID con un ID único
 * 3. Actualiza PRIVATE_KEY con tu clave privada del wallet
 */

#include <AgentHub.h>
#include <WiFi.h>
#include <OneWire.h>
#include <DallasTemperature.h>

// Configuración WiFi
const char* WIFI_SSID = "TU_WIFI";
const char* WIFI_PASSWORD = "TU_PASSWORD";

// Configuración AgentHub
const char* AGENT_ID = "temp-monitor-001";
const char* PRIVATE_KEY = "0x..."; // Tu clave privada

// Configuración sensor
#define ONE_WIRE_BUS 4 // Pin del sensor DS18B20
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);

// Configuración alertas
const float TEMP_THRESHOLD = 30.0; // Temperatura umbral en Celsius
const String ALERT_ENDPOINT = "https://api.agenthub.protocol/api/alerts";
const String PAYMENT_AMOUNT = "0.0001"; // 0.0001 USDC

// Instancia de AgentHub
AgentHub agent;

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("=== AgentHub IoT Temperature Monitor ===");
  
  // Inicializar sensor
  sensors.begin();
  
  // Conectar WiFi
  Serial.print("Conectando a WiFi: ");
  Serial.println(WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println();
  Serial.println("WiFi conectado!");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
  
  // Inicializar AgentHub
  agent.begin(AGENT_ID, PRIVATE_KEY);
  Serial.println("AgentHub inicializado");
  Serial.print("Agent ID: ");
  Serial.println(agent.getAgentId());
  
  // Registrar agente on-chain (solo primera vez)
  // Descomenta para registrar:
  /*
  Serial.println("Registrando agente on-chain...");
  bool registered = agent.registerAgent(
    "ipfs://Qm...", // metadataIPFS
    "0.01"          // stakeAmount en AVAX
  );
  if (registered) {
    Serial.println("Agente registrado exitosamente!");
  } else {
    Serial.println("Error al registrar agente");
  }
  */
  
  Serial.println("=== Iniciando monitoreo ===");
}

void loop() {
  // Leer temperatura
  sensors.requestTemperatures();
  float temperature = sensors.getTempCByIndex(0);
  
  Serial.print("Temperatura: ");
  Serial.print(temperature);
  Serial.println("°C");
  
  // Verificar umbral
  if (temperature > TEMP_THRESHOLD) {
    Serial.println("⚠️ Temperatura alta detectada!");
    
    // Crear datos de alerta
    DynamicJsonDocument alertData(256);
    alertData["agentId"] = AGENT_ID;
    alertData["temperature"] = temperature;
    alertData["threshold"] = TEMP_THRESHOLD;
    alertData["timestamp"] = millis();
    alertData["alert"] = "high_temperature";
    
    String jsonData;
    serializeJson(alertData, jsonData);
    
    // Enviar alerta con pago x402
    Serial.println("Enviando alerta con pago x402...");
    String response = agent.x402Request(
      ALERT_ENDPOINT,
      PAYMENT_AMOUNT,
      jsonData
    );
    
    Serial.print("Respuesta: ");
    Serial.println(response);
    
    // Parsear respuesta
    DynamicJsonDocument doc(512);
    DeserializationError error = deserializeJson(doc, response);
    
    if (!error && doc["success"]) {
      Serial.println("✅ Alerta enviada exitosamente!");
      Serial.print("TX Hash: ");
      Serial.println(doc["txHash"].as<String>());
    } else {
      Serial.println("❌ Error al enviar alerta");
    }
    
    // Esperar 5 minutos antes de la siguiente alerta
    delay(300000);
  } else {
    // Temperatura normal, esperar 1 minuto
    delay(60000);
  }
}

