# AgentHub IoT SDK - Python (Raspberry Pi)

SDK oficial de AgentHub Protocol para dispositivos IoT basados en Raspberry Pi y otros sistemas Linux.

## Características

- ✅ Registro de agentes on-chain
- ✅ Pagos autónomos x402
- ✅ Envío de datos de sensores
- ✅ Compatible con Raspberry Pi y Linux
- ✅ Fácil integración con sensores GPIO

## Instalación

```bash
pip install agenthub-iot
```

O desde el repositorio:

```bash
git clone https://github.com/agenthub/agenthub-iot-python.git
cd agenthub-iot-python
pip install -e .
```

## Requisitos

- Python 3.8+
- Raspberry Pi o sistema Linux
- WiFi o Ethernet conectado
- Wallet con AVAX para staking y USDC para pagos

## Uso Rápido

```python
from agenthub_iot import AgentHub
import time
import json

# Inicializar SDK
agent = AgentHub(
    agent_id="temp-monitor-001",
    private_key="0x...",  # Tu clave privada
    network="fuji"  # o "mainnet"
)

# Registrar agente (solo primera vez)
# agent.register_agent(
#     metadata_ipfs="ipfs://Qm...",
#     stake_amount="0.01"  # 0.01 AVAX
# )

# Monitoreo continuo
while True:
    # Leer sensor (ejemplo)
    temperature = read_temperature()
    
    # Si temperatura > umbral, enviar alerta con pago x402
    if temperature > 30.0:
        alert_data = {
            "agentId": "temp-monitor-001",
            "temperature": temperature,
            "threshold": 30.0,
            "alert": "high_temperature"
        }
        
        response = agent.x402_request(
            url="https://api.agenthub.protocol/api/alerts",
            amount="0.0001",  # 0.0001 USDC
            data=alert_data
        )
        
        print(f"Alerta enviada: {response}")
    
    time.sleep(60)  # Esperar 1 minuto

def read_temperature():
    # Tu código para leer el sensor
    return 25.5
```

## API Reference

### `AgentHub(agent_id, private_key, network="fuji")`
Inicializa el SDK con el ID del agente y la clave privada.

### `agent.register_agent(metadata_ipfs, stake_amount)`
Registra el agente en el contrato on-chain.

### `agent.x402_request(url, amount, data)`
Realiza una petición HTTP con pago x402 automático.

### `agent.send_sensor_data(endpoint, data)`
Envía datos de sensores a un endpoint.

## Ejemplos

Ver la carpeta `examples/` para más ejemplos:
- `temperature_monitor.py` - Monitor de temperatura
- `motion_detector.py` - Detector de movimiento
- `smart_energy.py` - Gestión de energía

## Redes Soportadas

- **Avalanche Fuji Testnet** (por defecto)
- **Avalanche Mainnet** (configurable)

## Licencia

MIT

