
import { prisma } from "@/lib/prisma";

export interface PluginInfo {
  id: string;
  name: string;
  version: string;
  isEnabled: boolean;
  manifest: any;
}

export class PluginRegistry {
  /**
   * Get all installed plugins.
   */
  static async getAll(): Promise<PluginInfo[]> {
    const plugins = await prisma.plugin.findMany({
      orderBy: { name: 'asc' }
    });
    
    return plugins.map(p => ({
      id: p.id,
      name: p.name,
      version: p.version,
      isEnabled: p.isEnabled,
      manifest: JSON.parse(p.manifest || "{}")
    }));
  }

  /**
   * Register a new plugin.
   */
  static async register(name: string, version: string, manifest: any) {
    return prisma.plugin.create({
      data: {
        name,
        version,
        isEnabled: false, // Requires approval
        manifest: JSON.stringify(manifest)
      }
    });
  }

  /**
   * Enable a plugin.
   */
  static async enable(pluginId: string) {
    return prisma.plugin.update({
      where: { id: pluginId },
      data: { isEnabled: true }
    });
  }

  /**
   * Disable a plugin.
   */
  static async disable(pluginId: string) {
    return prisma.plugin.update({
      where: { id: pluginId },
      data: { isEnabled: false }
    });
  }
}
