#ifndef AGENTHUB_H
#define AGENTHUB_H

#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Crypto.h>
#include <SHA256.h>
#include <Base64.h>

// Configuración de red
#define AGENTHUB_FUJI_RPC "https://api.avax-test.network/ext/bc/C/rpc"
#define AGENTHUB_MAINNET_RPC "https://api.avax.network/ext/bc/C/rpc"
// Nota: Reemplazar con tu dominio en producción
// Para desarrollo local: http://localhost:3000/api/x402/pay
#define AGENTHUB_X402_API "http://localhost:3000/api/x402/pay"
#define AGENTHUB_SENSORS_API "http://localhost:3000/api/iot/sensors"
#define AGENTHUB_ALERTS_API "http://localhost:3000/api/iot/alerts"
#define AGENTHUB_REGISTRY_ADDRESS "0x6750Ed798186b4B5a7441D0f46Dd36F372441306" // Avalanche Fuji

class AgentHub {
private:
  String agentId;
  String privateKey;
  String network;
  String rpcUrl;
  String registryAddress;
  bool initialized;
  
  // Helper functions
  String hashAgentId(String id);
  String signMessage(String message);
  String makeRPCRequest(String method, String params);
  String generatePaymentData(String url, String amount);
  
public:
  AgentHub();
  
  // Inicialización
  void begin(String agentId, String privateKey);
  void begin(String agentId, String privateKey, String network);
  void setRegistryAddress(String address);
  
  // Registro de agente
  bool registerAgent(String metadataIPFS, String stakeAmount);
  
  // Pagos x402
  String x402Request(String url, String amount, String data = "");
  String x402Request(String url, String amount, JsonObject data);
  
  // Envío de datos
  String sendSensorData(String endpoint, JsonObject data);
  String sendSensorData(String endpoint, String data);
  
  // Utilidades
  String getAgentId();
  bool isInitialized();
};

#endif

