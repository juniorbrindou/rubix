import { File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

/**
 * Mouchard de démarrage. Sur téléphone, aucun journal n'est lisible d'ici : un plantage natif (moteur 3D, module)
 * ferme l'app sans laisser de trace. Chaque étape du démarrage est donc écrite tout de suite sur le disque ; au
 * lancement suivant, si le précédent ne s'est pas bien fini, l'app montre la dernière étape atteinte.
 * Les erreurs JavaScript non rattrapées sont aussi gardées ici, pour que `_layout` les affiche au lieu de fermer l'app.
 */

export interface LaunchLog {
  started: string;
  device: string;
  steps: string[];
  ok: boolean;
}

const device = (() => {
  const c = (Platform.constants ?? {}) as { Brand?: string; Model?: string; Release?: string };
  return `${Platform.OS} ${c.Release ?? Platform.Version} · ${c.Brand ?? ''} ${c.Model ?? ''}`.trim();
})();

let file: File | null = null;
try {
  file = new File(Paths.document, 'demarrage.json');
} catch {
  file = null; // web ou module absent : pas de mouchard
}

function read(): LaunchLog | null {
  try {
    return file?.exists ? (JSON.parse(file.textSync()) as LaunchLog) : null;
  } catch {
    return null;
  }
}

/** Le lancement précédent, s'il ne s'est pas bien fini. */
export const crashedLaunch: LaunchLog | null = (() => {
  const previous = read();
  return previous && !previous.ok ? previous : null;
})();

const t0 = Date.now();
const current: LaunchLog = { started: new Date().toISOString(), device, steps: [], ok: false };

function save() {
  try {
    file?.writeSync(JSON.stringify(current));
  } catch {
    // le mouchard ne doit jamais faire planter l'app
  }
}

export function mark(step: string) {
  if (current.ok) return;
  current.steps.push(`${Date.now() - t0} ms · ${step}`);
  save();
}

/** L'app tourne normalement : le prochain lancement n'affichera rien. */
export function markHealthy() {
  if (current.ok) return;
  mark('ok');
  current.ok = true;
  save();
}

// --- Erreurs JavaScript non rattrapées ---

type Listener = (error: Error) => void;
const listeners = new Set<Listener>();
export let lastError: Error | null = null;

export function onError(listener: Listener): () => void {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}

export function clearError() {
  lastError = null;
}

type ErrorUtilsT = { getGlobalHandler(): (e: Error, fatal?: boolean) => void; setGlobalHandler(h: (e: Error, fatal?: boolean) => void): void };
const errorUtils = (globalThis as { ErrorUtils?: ErrorUtilsT }).ErrorUtils;
if (errorUtils) {
  const previous = errorUtils.getGlobalHandler();
  errorUtils.setGlobalHandler((error, fatal) => {
    lastError = error;
    mark(`erreur JS${fatal ? ' fatale' : ''} : ${error?.message}`);
    listeners.forEach((l) => l(error));
    if (!fatal) previous(error, fatal);
  });
}

mark('JavaScript démarré');
