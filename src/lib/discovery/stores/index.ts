import { StoreOrigin } from "@/lib/scrapers/types"
import { auchanConfig } from "@/lib/discovery/stores/auchan"
import { continenteConfig } from "@/lib/discovery/stores/continente"
import type { StoreDiscoveryConfig } from "@/lib/discovery/types"

/**
 * Map of origin IDs to discovery configurations
 */
export const storeConfigs: Record<number, StoreDiscoveryConfig> = {
  [StoreOrigin.Continente]: continenteConfig,
  [StoreOrigin.Auchan]: auchanConfig,
}

/**
 * Get discovery config for a specific store
 */
export function getStoreConfig(originId: number): StoreDiscoveryConfig | null {
  return storeConfigs[originId] || null
}

/**
 * Get all available store configs
 */
export function getAllStoreConfigs(): StoreDiscoveryConfig[] {
  return Object.values(storeConfigs)
}

export { continenteConfig, auchanConfig }
