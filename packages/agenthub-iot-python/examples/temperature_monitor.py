#!/usr/bin/env python3
"""
AgentHub IoT - Temperature Monitor Example

Este ejemplo muestra cómo usar AgentHub SDK para:
- Registrar un agente IoT
- Monitorear temperatura
- Enviar alertas con pagos x402 cuando la temperatura excede un umbral

Requisitos:
- Raspberry Pi con sensor de temperatura
- O usar datos simulados para pruebas
"""

import time
import json
from agenthub_iot import AgentHub

# Configuración
AGENT_ID = "temp-monitor-001"
PRIVATE_KEY = "0x..."  # Tu clave privada del wallet
NETWORK = "fuji"  # o "mainnet"

# Configuración alertas
TEMP_THRESHOLD = 30.0  # Temperatura umbral en Celsius
ALERT_ENDPOINT = "https://api.agenthub.protocol/api/alerts"
PAYMENT_AMOUNT = "0.0001"  # 0.0001 USDC

# Inicializar SDK
print("=== AgentHub IoT Temperature Monitor ===")
agent = AgentHub(
    agent_id=AGENT_ID,
    private_key=PRIVATE_KEY,
    network=NETWORK
)

print(f"Agent ID: {agent.get_agent_id()}")
print(f"Wallet Address: {agent.get_address()}")
print("AgentHub inicializado")

# Registrar agente on-chain (solo primera vez)
# Descomenta para registrar:
"""
print("Registrando agente on-chain...")
result = agent.register_agent(
    metadata_ipfs="ipfs://Qm...",  # metadataIPFS
    stake_amount="0.01"  # stakeAmount en AVAX
)
if result.get("success"):
    print("✅ Agente registrado exitosamente!")
    print(f"TX Hash: {result['txHash']}")
else:
    print(f"❌ Error al registrar agente: {result.get('error')}")
"""

print("=== Iniciando monitoreo ===")


def read_temperature():
    """
    Leer temperatura del sensor
    
    Para Raspberry Pi con sensor DS18B20:
    import os
    os.system('modprobe w1-gpio')
    os.system('modprobe w1-therm')
    
    base_dir = '/sys/bus/w1/devices/'
    device_folder = glob.glob(base_dir + '28*')[0]
    device_file = device_folder + '/w1_slave'
    
    # Leer archivo y parsear temperatura
    # ...
    
    Para pruebas, retornamos un valor simulado
    """
    # Simulación: temperatura aleatoria entre 20-35°C
    import random
    return 20 + random.random() * 15


def main():
    """Loop principal de monitoreo"""
    while True:
        try:
            # Leer temperatura
            temperature = read_temperature()
            print(f"Temperatura: {temperature:.2f}°C")
            
            # Verificar umbral
            if temperature > TEMP_THRESHOLD:
                print("⚠️ Temperatura alta detectada!")
                
                # Crear datos de alerta
                alert_data = {
                    "agentId": AGENT_ID,
                    "temperature": temperature,
                    "threshold": TEMP_THRESHOLD,
                    "timestamp": int(time.time() * 1000),
                    "alert": "high_temperature"
                }
                
                # Enviar alerta con pago x402
                print("Enviando alerta con pago x402...")
                response = agent.x402_request(
                    url=ALERT_ENDPOINT,
                    amount=PAYMENT_AMOUNT,
                    data=alert_data
                )
                
                if response.get("success"):
                    print("✅ Alerta enviada exitosamente!")
                    print(f"Respuesta: {json.dumps(response.get('data'), indent=2)}")
                    # Esperar 5 minutos antes de la siguiente alerta
                    time.sleep(300)
                else:
                    print(f"❌ Error al enviar alerta: {response.get('error')}")
                    time.sleep(60)
            else:
                # Temperatura normal, esperar 1 minuto
                time.sleep(60)
                
        except KeyboardInterrupt:
            print("\n=== Deteniendo monitoreo ===")
            break
        except Exception as e:
            print(f"Error: {e}")
            time.sleep(60)


if __name__ == "__main__":
    main()

