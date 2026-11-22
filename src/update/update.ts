/**
 * Mise à jour intégrée : `scripts/publier-apk.sh` écrit à chaque publication un fichier de version sur le serveur ;
 * l'app le lit au démarrage et propose la nouvelle APK si elle est plus récente que la sienne.
 */

export const LATEST_URL = 'https://brindoujunior.com/rubix-latest.json';
/** Seules les APK servies par notre site peuvent être installées depuis l'app. */
const TRUSTED_PREFIX = 'https://brindoujunior.com/rubix-v';

export interface LatestRelease {
  version: string;
  versionCode: number;
  url: string;
  notes?: string;
}

/** Lit le fichier de version ; `null` s'il est mal formé ou pointe ailleurs que sur notre site. */
export function parseLatest(json: unknown): LatestRelease | null {
  if (!json || typeof json !== 'object') return null;
  const { version, versionCode, url, notes } = json as Record<string, unknown>;
  if (typeof version !== 'string' || typeof versionCode !== 'number' || !Number.isInteger(versionCode)) return null;
  if (typeof url !== 'string' || !url.startsWith(TRUSTED_PREFIX) || !url.endsWith('.apk')) return null;
  return { version, versionCode, url, notes: typeof notes === 'string' ? notes : undefined };
}

export function isNewer(latest: LatestRelease, currentVersionCode: number | undefined): boolean {
  return typeof currentVersionCode === 'number' && latest.versionCode > currentVersionCode;
}
