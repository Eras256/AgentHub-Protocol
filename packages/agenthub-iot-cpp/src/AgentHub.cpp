#include "AgentHub.h"

AgentHub::AgentHub() {
  this->initialized = false;
  this->network = "fuji";
  this->rpcUrl = AGENTHUB_FUJI_RPC;
  this->registryAddress = AGENTHUB_REGISTRY_ADDRESS;
}

void AgentHub::begin(String agentId, String privateKey) {
  this->begin(agentId, privateKey, "fuji");
}

void AgentHub::begin(String agentId, String privateKey, String network) {
  this->agentId = agentId;
  this->privateKey = privateKey;
  this->network = network;
  
  if (network == "mainnet") {
    this->rpcUrl = AGENTHUB_MAINNET_RPC;
  } else {
    this->rpcUrl = AGENTHUB_FUJI_RPC;
  }
  
  this->initialized = true;
}

void AgentHub::setRegistryAddress(String address) {
  this->registryAddress = address;
}

String AgentHub::hashAgentId(String id) {
  // Implementación simplificada de keccak256
  // En producción, usar librería completa de keccak256
  SHA256 sha256;
  sha256.update(id.c_str(), id.length());
  uint8_t hash[32];
  sha256.finalize(hash, 32);
  
  String result = "0x";
  for (int i = 0; i < 32; i++) {
    if (hash[i] < 16) result += "0";
    result += String(hash[i], HEX);
  }
  return result;
}

String AgentHub::signMessage(String message) {
  // Implementación simplificada de firma ECDSA
  // En producción, usar librería completa de ECDSA/secp256k1
  // Por ahora, retornamos un placeholder
  // NOTA: Esto requiere una librería de criptografía completa
  return "0x" + String(message.length());
}

String AgentHub::makeRPCRequest(String method, String params) {
  if (WiFi.status() != WL_CONNECTED) {
    return "{\"error\":\"WiFi not connected\"}";
  }
  
  HTTPClient http;
  http.begin(this->rpcUrl);
  http.addHeader("Content-Type", "application/json");
  
  String payload = "{\"jsonrpc\":\"2.0\",\"method\":\"" + method + "\",\"params\":" + params + ",\"id\":1}";
  
  int httpResponseCode = http.POST(payload);
  String response = "";
  
  if (httpResponseCode > 0) {
    response = http.getString();
  } else {
    response = "{\"error\":\"HTTP error: " + String(httpResponseCode) + "\"}";
  }
  
  http.end();
  return response;
}

String AgentHub::generatePaymentData(String url, String amount) {
  // Generar datos de pago x402
  // Esto debe incluir la firma del mensaje de pago
  DynamicJsonDocument doc(1024);
  doc["resourceUrl"] = url;
  doc["amount"] = amount;
  doc["token"] = "USDC";
  doc["tier"] = "basic";
  doc["timestamp"] = millis();
  
  String message = url + amount + String(millis());
  String signature = this->signMessage(message);
  doc["signature"] = signature;
  
  String output;
  serializeJson(doc, output);
  return output;
}

bool AgentHub::registerAgent(String metadataIPFS, String stakeAmount) {
  if (!this->initialized) {
    return false;
  }
  
  if (WiFi.status() != WL_CONNECTED) {
    return false;
  }
  
  // Hash del agentId
  String hashedAgentId = this->hashAgentId(this->agentId);
  
  // Preparar transacción (simplificado)
  // En producción, esto requiere construir la transacción completa
  // y firmarla con la clave privada
  
  String params = "[{\"to\":\"" + this->registryAddress + "\",\"data\":\"0x...\"}]";
  String response = this->makeRPCRequest("eth_sendTransaction", params);
  
  // Parsear respuesta
  DynamicJsonDocument doc(1024);
  deserializeJson(doc, response);
  
  return doc.containsKey("result");
}

String AgentHub::x402Request(String url, String amount, String data) {
  if (!this->initialized) {
    return "{\"error\":\"AgentHub not initialized\"}";
  }
  
  if (WiFi.status() != WL_CONNECTED) {
    return "{\"error\":\"WiFi not connected\"}";
  }
  
  // Generar datos de pago
  String paymentData = this->generatePaymentData(url, amount);
  
  // Hacer petición al API x402
  HTTPClient http;
  http.begin(AGENTHUB_X402_API);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-payment", paymentData);
  
  int httpResponseCode = http.POST(data.length() > 0 ? data : "{}");
  String response = "";
  
  if (httpResponseCode > 0) {
    response = http.getString();
  } else {
    response = "{\"error\":\"HTTP error: " + String(httpResponseCode) + "\"}";
  }
  
  http.end();
  return response;
}

String AgentHub::x402Request(String url, String amount, JsonObject data) {
  String jsonData;
  serializeJson(data, jsonData);
  return this->x402Request(url, amount, jsonData);
}

String AgentHub::sendSensorData(String endpoint, JsonObject data) {
  String jsonData;
  serializeJson(data, jsonData);
  return this->sendSensorData(endpoint, jsonData);
}

String AgentHub::sendSensorData(String endpoint, String data) {
  if (WiFi.status() != WL_CONNECTED) {
    return "{\"error\":\"WiFi not connected\"}";
  }
  
  HTTPClient http;
  http.begin(endpoint);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Agent-ID", this->agentId);
  
  int httpResponseCode = http.POST(data);
  String response = "";
  
  if (httpResponseCode > 0) {
    response = http.getString();
  } else {
    response = "{\"error\":\"HTTP error: " + String(httpResponseCode) + "\"}";
  }
  
  http.end();
  return response;
}

String AgentHub::getAgentId() {
  return this->agentId;
}

bool AgentHub::isInitialized() {
  return this->initialized;
}

