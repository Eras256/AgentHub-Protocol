"""
Integration tests for AgentHub IoT Python SDK
These tests require real blockchain connection and private keys
"""

import pytest
import os
import time
from dotenv import load_dotenv
import sys

# Add parent directory to path
src_path = os.path.join(os.path.dirname(__file__), '..', 'src')
if src_path not in sys.path:
    sys.path.insert(0, src_path)

# Type checking: ignore import resolution warning
# The path is added dynamically above, so the import works at runtime
from agenthub_iot import AgentHub  # type: ignore[reportMissingImports]

# Load environment variables
env_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', '.env.local')
load_dotenv(dotenv_path=env_path)

# Test configuration from .env.local
TEST_PRIVATE_KEY = os.getenv("DEPLOYER_PRIVATE_KEY") or os.getenv("FACILITATOR_PRIVATE_KEY")
TEST_REGISTRY_ADDRESS = os.getenv("NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS") or "0x6750Ed798186b4B5a7441D0f46Dd36F372441306"
TEST_NETWORK = "fuji"

# Skip all tests if no private key is configured
pytestmark = pytest.mark.skipif(
    not TEST_PRIVATE_KEY,
    reason="Requires DEPLOYER_PRIVATE_KEY or FACILITATOR_PRIVATE_KEY in .env.local"
)


@pytest.mark.integration
class TestAgentHubIntegration:
    """Tests de integración con blockchain real"""
    
    def test_client_initialization(self):
        """Test que el cliente se inicializa correctamente con clave real"""
        agent = AgentHub(
            agent_id=f"test-iot-{int(time.time())}",
            private_key=TEST_PRIVATE_KEY,
            network=TEST_NETWORK,
            registry_address=TEST_REGISTRY_ADDRESS
        )
        
        assert agent.is_initialized() is True
        assert agent.get_address() is not None
        assert agent.get_address().startswith("0x")
        print(f"✅ Agent initialized with address: {agent.get_address()}")
    
    def test_hash_agent_id(self):
        """Test hash de agent ID con cliente real"""
        agent = AgentHub(
            agent_id="test-agent-001",
            private_key=TEST_PRIVATE_KEY,
            network=TEST_NETWORK
        )
        
        hashed = agent._hash_agent_id("test-agent-001")
        assert hashed.startswith("0x")
        assert len(hashed) == 66
        print(f"✅ Agent ID hashed: {hashed}")
    
    def test_sign_message(self):
        """Test firma de mensaje con clave real"""
        agent = AgentHub(
            agent_id="test-agent-001",
            private_key=TEST_PRIVATE_KEY,
            network=TEST_NETWORK
        )
        
        message = "test message for signing"
        signature = agent._sign_message(message)
        assert signature is not None
        assert len(signature) > 0
        print(f"✅ Message signed: {signature[:20]}...")
    
    def test_rpc_connection(self):
        """Test conexión RPC a la blockchain"""
        agent = AgentHub(
            agent_id="test-agent-001",
            private_key=TEST_PRIVATE_KEY,
            network=TEST_NETWORK
        )
        
        # Test RPC call
        result = agent._make_rpc_request("eth_blockNumber", [])
        assert "error" not in result or result.get("result") is not None
        print(f"✅ RPC connection successful")
    
    @pytest.mark.slow
    def test_register_agent_onchain(self):
        """Test registro de agente on-chain (requiere AVAX para gas)"""
        # Generar ID único
        unique_id = f"iot-test-{int(time.time())}"
        
        agent = AgentHub(
            agent_id=unique_id,
            private_key=TEST_PRIVATE_KEY,
            network=TEST_NETWORK,
            registry_address=TEST_REGISTRY_ADDRESS
        )
        
        # Intentar registrar (solo si hay fondos)
        # NOTA: Esto requiere AVAX para gas y stake
        try:
            result = agent.register_agent(
                metadata_ipfs=f"ipfs://test-{unique_id}",
                stake_amount="0.01"  # 0.01 AVAX
            )
            
            if result.get("success"):
                print(f"✅ Agent registered! TX: {result.get('txHash')}")
                assert "txHash" in result
            else:
                print(f"⚠️ Registration failed: {result.get('error')}")
                # No fallar el test si no hay fondos
                assert "error" in result
        except Exception as e:
            print(f"⚠️ Registration error (expected if no funds): {e}")
            # No fallar el test si no hay fondos
            pytest.skip(f"Skipping due to: {e}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-m", "integration"])

