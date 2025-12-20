
export class ABTestEngine {
    /**
     * Determine which variant to show based on user ID and experiment config.
     * Uses deterministic hashing so a user always sees the same variant for a given experiment.
     */
    static selectVariant(userId: string, experimentId: string, variants: string[]): string {
        if (!variants || variants.length === 0) return "control";
        
        // Simple hash of userId + experimentId to select index
        const hash = this.simpleHash(userId + experimentId);
        const index = Math.abs(hash) % variants.length;
        
        return variants[index];
    }

    private static simpleHash(str: string): number {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash;
    }
}
