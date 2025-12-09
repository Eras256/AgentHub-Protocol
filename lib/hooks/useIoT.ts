/**
 * React hooks for IoT device integration
 * Hooks to integrate IoT devices with the frontend
 */

import { useQuery, useMutation } from "@tanstack/react-query";
import { useAddress } from "@thirdweb-dev/react";

export interface SensorData {
  agentId: string;
  temperature?: number;
  humidity?: number;
  pressure?: number;
  [key: string]: any;
}

export interface IoTAlert {
  agentId: string;
  alert: string;
  temperature?: number;
  threshold?: number;
  timestamp: number;
  [key: string]: any;
}

/**
 * Hook to send sensor data
 */
export function useSendSensorData() {
  return useMutation({
    mutationFn: async (data: SensorData) => {
      const response = await fetch("/api/iot/sensors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Agent-ID": data.agentId,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to send sensor data");
      }

      return response.json();
    },
  });
}

/**
 * Hook to send alerts with x402 payment
 */
export function useSendIoTAlert() {
  return useMutation({
    mutationFn: async ({
      alert,
      paymentAmount = "0.0001",
    }: {
      alert: IoTAlert;
      paymentAmount?: string;
    }) => {
      // Primero hacer pago x402
      const paymentResponse = await fetch("/api/x402/pay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: paymentAmount,
          token: "USDC",
          tier: "basic",
          resourceUrl: "/api/iot/alerts",
        }),
      });

      if (!paymentResponse.ok) {
        const error = await paymentResponse.json();
        throw new Error(error.message || "Payment failed");
      }

      const paymentResult = await paymentResponse.json();

      // Luego enviar la alerta
      const alertResponse = await fetch("/api/iot/alerts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Agent-ID": alert.agentId,
          "x-payment": JSON.stringify({
            txHash: paymentResult.txHash,
            amount: paymentAmount,
          }),
        },
        body: JSON.stringify(alert),
      });

      if (!alertResponse.ok) {
        const error = await alertResponse.json();
        throw new Error(error.message || "Failed to send alert");
      }

      return alertResponse.json();
    },
  });
}

/**
 * Hook to query sensor data for an agent
 */
export function useSensorData(agentId?: string) {
  return useQuery({
    queryKey: ["sensor-data", agentId],
    queryFn: async () => {
      if (!agentId) return null;

      const response = await fetch(`/api/iot/sensors?agentId=${agentId}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch sensor data");
      }

      return response.json();
    },
    enabled: !!agentId,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

/**
 * Hook to get all IoT devices for the user
 * Filters agents that are IoT devices
 */
export function useIoTDevices() {
  const address = useAddress();
  
  return useQuery({
    queryKey: ["iot-devices", address],
    queryFn: async () => {
      // Importar dinámicamente para evitar dependencias circulares
      const { useAgents } = await import("@/lib/hooks/useAgents");
      
      // Obtener todos los agentes
      // Nota: Esto requiere que useAgents sea llamado en el componente padre
      // Por ahora retornamos una función que filtra agentes
      return [];
    },
    enabled: !!address,
  });
}

/**
 * Hook helper para filtrar agentes IoT
 */
export function filterIoTAgents(agents: any[]) {
  return agents.filter((agent: any) => {
    const agentIdLower = (agent.originalAgentId || agent.agentId || "").toLowerCase();
    return (
      agentIdLower.includes("iot") ||
      agentIdLower.includes("device") ||
      agentIdLower.includes("sensor") ||
      agentIdLower.includes("esp32") ||
      agentIdLower.includes("raspberry") ||
      agentIdLower.includes("temp") ||
      agentIdLower.includes("monitor")
    );
  });
}

