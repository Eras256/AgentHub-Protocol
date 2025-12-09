#!/usr/bin/env python3
"""
AgentHub IoT - Motion Detector Example

Ejemplo de detector de movimiento que envía alertas con pagos x402
"""

import time
import json
from agenthub_iot import AgentHub

# Configuración
AGENT_ID = "motion-detector-001"
PRIVATE_KEY = "0x..."
NETWORK = "fuji"

ALERT_ENDPOINT = "https://api.agenthub.protocol/api/alerts"
PAYMENT_AMOUNT = "0.0001"

agent = AgentHub(AGENT_ID, PRIVATE_KEY, NETWORK)

def read_motion_sensor():
    """Leer sensor de movimiento (simulado)"""
    import random
    return random.random() > 0.7  # 30% probabilidad de movimiento

def main():
    while True:
        if read_motion_sensor():
            print("⚠️ Movimiento detectado!")
            
            alert_data = {
                "agentId": AGENT_ID,
                "motion": True,
                "timestamp": int(time.time() * 1000),
                "alert": "motion_detected"
            }
            
            response = agent.x402_request(
                ALERT_ENDPOINT,
                PAYMENT_AMOUNT,
                alert_data
            )
            
            if response.get("success"):
                print("✅ Alerta enviada!")
            else:
                print(f"❌ Error: {response.get('error')}")
            
            time.sleep(60)  # Esperar 1 minuto
        else:
            time.sleep(5)  # Revisar cada 5 segundos

if __name__ == "__main__":
    main()

