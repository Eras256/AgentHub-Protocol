"""
AgentHub IoT Client
Cliente principal para interactuar con AgentHub Protocol desde dispositivos IoT
"""

import json
import time
import requests
from typing import Dict, Optional, Any
from eth_account import Account
from web3 import Web3
import hashlib


class AgentHub:
    """AgentHub client for IoT devices"""
    
    # Network URLs
    FUJI_RPC = "https://api.avax-test.network/ext/bc/C/rpc"
    MAINNET_RPC = "https://api.avax.network/ext/bc/C/rpc"
    # Note: Replace with your domain in production
    # API endpoints - can be overridden with environment variables
    # For local development: http://localhost:3000
    # For production: https://your-domain.com
    BASE_URL = os.getenv("AGENTHUB_API_URL", "http://localhost:3000")
    X402_API = f"{BASE_URL}/api/x402/pay"
    SENSORS_API = f"{BASE_URL}/api/iot/sensors"
    ALERTS_API = f"{BASE_URL}/api/iot/alerts"
    
    def __init__(
        self,
        agent_id: str,
        private_key: str,
        network: str = "fuji",
        registry_address: Optional[str] = None,
        rpc_url: Optional[str] = None
    ):
        """
        Initialize AgentHub client
        
        Args:
            agent_id: Unique agent ID
            private_key: Wallet private key (with or without 0x)
            network: Network to use ("fuji" or "mainnet")
            registry_address: AgentRegistry contract address (optional)
            rpc_url: Custom RPC URL (optional)
        """
        self.agent_id = agent_id
        self.network = network
        
        # Configurar clave privada
        if not private_key.startswith("0x"):
            private_key = "0x" + private_key
        self.private_key = private_key
        self.account = Account.from_key(private_key)
        
        # Configurar RPC
        if rpc_url:
            self.rpc_url = rpc_url
        elif network == "mainnet":
            self.rpc_url = self.MAINNET_RPC
        else:
            self.rpc_url = self.FUJI_RPC
        
        # Inicializar Web3
        self.web3 = Web3(Web3.HTTPProvider(self.rpc_url))
        
        # Dirección del registro (configurar según deployment)
        self.registry_address = registry_address or "0x..."
        
        self.initialized = True
    
    def _hash_agent_id(self, agent_id: str) -> str:
        """Hash del agent ID usando keccak256"""
        # keccak256 es equivalente a SHA3-256
        message = agent_id.encode('utf-8')
        hash_bytes = hashlib.sha3_256(message).digest()
        return "0x" + hash_bytes.hex()
    
    def _sign_message(self, message: str) -> str:
        """Firmar mensaje con la clave privada"""
        # Usar sign_message de eth_account con el formato estándar de Ethereum
        from eth_account.messages import encode_defunct
        message_encoded = encode_defunct(text=message)
        signed = self.account.sign_message(message_encoded)
        return signed.signature.hex()
    
    def _make_rpc_request(self, method: str, params: list) -> Dict[str, Any]:
        """Hacer petición RPC a la blockchain"""
        payload = {
            "jsonrpc": "2.0",
            "method": method,
            "params": params,
            "id": 1
        }
        
        try:
            response = requests.post(self.rpc_url, json=payload, timeout=10)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            return {"error": str(e)}
    
    def register_agent(
        self,
        metadata_ipfs: str,
        stake_amount: str,
        gas_price: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Registrar agente en el contrato on-chain
        
        Args:
            metadata_ipfs: URI IPFS de los metadatos
            stake_amount: Cantidad de AVAX para staking (en AVAX, no wei)
            gas_price: Precio de gas (opcional)
        
        Returns:
            Dict con resultado de la transacción
        """
        if not self.initialized:
            return {"error": "AgentHub not initialized"}
        
        try:
            # Hash del agent ID
            hashed_agent_id = self._hash_agent_id(self.agent_id)
            
            # Convertir stake amount a wei
            stake_wei = Web3.to_wei(float(stake_amount), 'ether')
            
            # Construir transacción
            # NOTA: Esto requiere el ABI del contrato AgentRegistry
            # Por ahora, retornamos un placeholder
            # En producción, usar el ABI completo del contrato
            
            transaction = {
                "to": self.registry_address,
                "from": self.account.address,
                "value": stake_wei,
                "gas": 200000,
                "gasPrice": gas_price or self.web3.eth.gas_price,
                "nonce": self.web3.eth.get_transaction_count(self.account.address),
                "data": "0x..."  # ABI encoded function call
            }
            
            # Firmar transacción
            signed_txn = self.account.sign_transaction(transaction)
            
            # Enviar transacción
            tx_hash = self.web3.eth.send_raw_transaction(signed_txn.rawTransaction)
            
            # Esperar confirmación
            receipt = self.web3.eth.wait_for_transaction_receipt(tx_hash)
            
            return {
                "success": True,
                "txHash": tx_hash.hex(),
                "receipt": dict(receipt)
            }
            
        except Exception as e:
            return {"error": str(e), "success": False}
    
    def x402_request(
        self,
        url: str,
        amount: str,
        data: Optional[Dict[str, Any]] = None,
        token: str = "USDC",
        tier: str = "basic"
    ) -> Dict[str, Any]:
        """
        Realizar petición HTTP con pago x402 automático
        
        Args:
            url: URL del endpoint
            amount: Cantidad a pagar (en USDC)
            data: Datos a enviar (opcional)
            token: Token a usar (por defecto USDC)
            tier: Tier de pago (por defecto "basic")
        
        Returns:
            Dict con respuesta del servidor
        """
        if not self.initialized:
            return {"error": "AgentHub not initialized"}
        
        try:
            # Generar datos de pago
            timestamp = int(time.time() * 1000)
            message = f"{url}{amount}{timestamp}"
            signature = self._sign_message(message)
            
            payment_data = {
                "resourceUrl": url,
                "amount": amount,
                "token": token,
                "tier": tier,
                "timestamp": timestamp,
                "signature": signature,
                "agentId": self.agent_id
            }
            
            # Headers
            headers = {
                "Content-Type": "application/json",
                "x-payment": json.dumps(payment_data)
            }
            
            # Body
            body = json.dumps(data) if data else "{}"
            
            # Hacer petición
            response = requests.post(
                url,
                headers=headers,
                data=body,
                timeout=30
            )
            
            return {
                "success": response.status_code == 200,
                "status": response.status_code,
                "data": response.json() if response.headers.get("content-type", "").startswith("application/json") else response.text,
                "headers": dict(response.headers)
            }
            
        except Exception as e:
            return {"error": str(e), "success": False}
    
    def send_sensor_data(
        self,
        endpoint: str,
        data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Enviar datos de sensores a un endpoint
        
        Args:
            endpoint: URL del endpoint
            data: Datos del sensor
        
        Returns:
            Dict con respuesta del servidor
        """
        if not self.initialized:
            return {"error": "AgentHub not initialized"}
        
        try:
            headers = {
                "Content-Type": "application/json",
                "X-Agent-ID": self.agent_id
            }
            
            response = requests.post(
                endpoint,
                headers=headers,
                json=data,
                timeout=10
            )
            
            return {
                "success": response.status_code == 200,
                "status": response.status_code,
                "data": response.json() if response.headers.get("content-type", "").startswith("application/json") else response.text
            }
            
        except Exception as e:
            return {"error": str(e), "success": False}
    
    def get_agent_id(self) -> str:
        """Obtener ID del agente"""
        return self.agent_id
    
    def get_address(self) -> str:
        """Obtener dirección del wallet"""
        return self.account.address
    
    def is_initialized(self) -> bool:
        """Verificar si el SDK está inicializado"""
        return self.initialized

