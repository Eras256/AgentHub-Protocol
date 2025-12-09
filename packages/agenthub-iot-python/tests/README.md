# Tests para AgentHub IoT Python SDK

## Ejecutar Tests

### Todos los tests
```bash
cd packages/agenthub-iot-python
python -m pytest tests/ -v
```

### Solo tests unitarios (sin conexión blockchain)
```bash
python -m pytest tests/test_client.py -v
```

### Solo tests de integración (requiere .env.local)
```bash
python -m pytest tests/test_integration.py -v -m integration
```

### Con cobertura
```bash
python -m pytest tests/ --cov=agenthub_iot --cov-report=html
```

## Requisitos para Tests de Integración

Los tests de integración requieren:
- Archivo `.env.local` en la raíz del proyecto con:
  - `DEPLOYER_PRIVATE_KEY` o `FACILITATOR_PRIVATE_KEY`
  - `NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS` (opcional, tiene valor por defecto)

## Estructura de Tests

- `test_client.py`: Tests unitarios con mocks
- `test_integration.py`: Tests de integración con blockchain real

## Resultados Esperados

- ✅ 14 tests unitarios
- ✅ 5 tests de integración
- ✅ Todos los tests deben pasar

