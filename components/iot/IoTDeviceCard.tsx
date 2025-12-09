"use client";

import { motion } from "framer-motion";
import { useSensorData } from "@/lib/hooks/useIoT";
import { Bot, Thermometer, Droplets, Gauge, AlertTriangle, Loader2 } from "lucide-react";
import GlassCard from "@/components/effects/GlassCard";

interface IoTDeviceCardProps {
  agentId: string;
  agentName?: string;
  trustScore?: number;
  isActive?: boolean;
}

export default function IoTDeviceCard({
  agentId,
  agentName,
  trustScore = 0,
  isActive = true,
}: IoTDeviceCardProps) {
  const { data: sensorData, isLoading, error } = useSensorData(agentId);

  const displayName = agentName || agentId.substring(0, 16) + "...";

  return (
    <GlassCard className="p-4 sm:p-6">
      <div className="flex items-start justify-between mb-3 sm:mb-4 gap-2">
        <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
          <div className="p-1.5 sm:p-2 bg-cyan-500/20 rounded-lg flex-shrink-0">
            <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-white text-sm sm:text-base truncate">{displayName}</h3>
            <p className="text-xs text-gray-400">IoT Device</p>
          </div>
        </div>
        <div className="flex items-center space-x-1.5 sm:space-x-2 flex-shrink-0">
          {isActive ? (
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          ) : (
            <div className="w-2 h-2 bg-gray-400 rounded-full" />
          )}
          <span className="text-xs text-gray-400 whitespace-nowrap">
            Trust: {trustScore.toFixed(1)}/10
          </span>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
        </div>
      )}

      {error && (
        <div className="flex items-center space-x-2 text-yellow-400 py-4">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm">No sensor data available</span>
        </div>
      )}

      {sensorData?.data && sensorData.data.length > 0 && (
        <div className="space-y-2 sm:space-y-3">
          {sensorData.data.map((reading: any, index: number) => (
            <div key={index} className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
              {reading.temperature !== undefined && (
                <div className="flex items-center space-x-2 p-2 bg-purple-500/10 rounded-lg">
                  <Thermometer className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400">Temperature</p>
                    <p className="text-xs sm:text-sm font-semibold text-white">
                      {reading.temperature.toFixed(1)}°C
                    </p>
                  </div>
                </div>
              )}

              {reading.humidity !== undefined && (
                <div className="flex items-center space-x-2 p-2 bg-blue-500/10 rounded-lg">
                  <Droplets className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400">Humidity</p>
                    <p className="text-xs sm:text-sm font-semibold text-white">
                      {reading.humidity.toFixed(1)}%
                    </p>
                  </div>
                </div>
              )}

              {reading.pressure !== undefined && (
                <div className="flex items-center space-x-2 p-2 bg-cyan-500/10 rounded-lg">
                  <Gauge className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400">Pressure</p>
                    <p className="text-xs sm:text-sm font-semibold text-white">
                      {reading.pressure.toFixed(1)} hPa
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!isLoading && !error && (!sensorData?.data || sensorData.data.length === 0) && (
        <div className="text-center py-4 text-gray-400 text-sm">
          No recent sensor readings
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-white/10">
        <p className="text-xs text-gray-500">
          Agent ID: {agentId.substring(0, 20)}...
        </p>
      </div>
    </GlassCard>
  );
}

