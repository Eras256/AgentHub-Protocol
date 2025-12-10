import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { ethers } from "ethers";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Validates and normalizes an Ethereum address using Ethers.js utils
 * Uses EIP-55 checksum format for proper address normalization
 * 
 * Implementation ideal: Uses ethers.utils.isAddress() and getAddress()
 * 
 * @param address - Address string to validate and normalize
 * @returns Normalized checksum address
 * @throws Error if address format is invalid
 */
export function validateAndNormalizeAddress(address: string | undefined | null): string {
  // 1. Check de existencia básica
  if (!address || typeof address !== 'string') {
    throw new Error("Address inválida: Valor nulo o vacío");
  }

  // 2. Limpieza de espacios (común en copy-paste)
  const cleanAddress = address.trim();

  // 3. Validación estricta usando Ethers (verifica longitud, hex y checksum)
  const ethersAny = ethers as any;
  const utils = ethersAny.utils || ethersAny;
  
  if (utils.isAddress && typeof utils.isAddress === 'function') {
    if (!utils.isAddress(cleanAddress)) {
      throw new Error(`Address inválida: Formato incorrecto (${cleanAddress})`);
    }
    
    // 4. Normalización (Checksum Address)
    // Esto devuelve '0xCd...' con las mayúsculas correctas según EIP-55
    try {
      return utils.getAddress(cleanAddress);
    } catch (error) {
      throw new Error(`Address inválida: Error al normalizar (${cleanAddress})`);
    }
  }
  
  // Fallback for ethers v6 or if utils.isAddress is not available
  if (!cleanAddress.startsWith('0x') || cleanAddress.length !== 42) {
    throw new Error(`Address inválida: Formato incorrecto (${cleanAddress})`);
  }
  
  if (!/^0x[0-9a-fA-F]{40}$/.test(cleanAddress)) {
    throw new Error(`Address inválida: Formato hexadecimal inválido (${cleanAddress})`);
  }
  
  // Try to get checksum address if getAddress is available
  try {
    if (utils.getAddress && typeof utils.getAddress === 'function') {
      return utils.getAddress(cleanAddress);
    }
  } catch (error) {
    // If checksum fails, return lowercase as fallback
    return cleanAddress.toLowerCase();
  }
  
  return cleanAddress.toLowerCase();
}

/**
 * Validates an address without throwing (returns boolean)
 * Useful for React Query enabled checks
 */
export function isValidAddress(address: string | undefined | null): boolean {
  if (!address || typeof address !== 'string') {
    return false;
  }

  const cleanAddress = address.trim();
  const ethersAny = ethers as any;
  const utils = ethersAny.utils || ethersAny;
  
  if (utils.isAddress && typeof utils.isAddress === 'function') {
    return utils.isAddress(cleanAddress);
  }
  
  // Fallback validation
  return cleanAddress.startsWith('0x') && 
         cleanAddress.length === 42 && 
         /^0x[0-9a-fA-F]{40}$/.test(cleanAddress);
}

// Re-export from sub-modules
export * from "./formatters";
// Export validation functions except isValidAddress (we use the one above which is more complete)
export { isValidIPFSHash, validateStakeAmount, validateAgentId } from "./validation";

