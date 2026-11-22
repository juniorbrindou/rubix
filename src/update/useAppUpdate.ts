import Constants from 'expo-constants';
import { File, Paths } from 'expo-file-system';
import { startActivityAsync } from 'expo-intent-launcher';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { mark } from '../diagnostics';
import { LATEST_URL, isNewer, parseLatest, type LatestRelease } from './update';

export type UpdateState =
  | { kind: 'none' }
  | { kind: 'available'; latest: LatestRelease }
  | { kind: 'downloading'; latest: LatestRelease }
  | { kind: 'error'; latest: LatestRelease; message: string };

const FLAG_GRANT_READ_URI_PERMISSION = 1;

/**
 * Vérifie au démarrage s'il existe une APK plus récente, puis, sur demande, la télécharge et ouvre l'installation
 * d'Android. Android seulement : ailleurs, rien ne se passe.
 */
export function useAppUpdate() {
  const [state, setState] = useState<UpdateState>({ kind: 'none' });

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const current = Constants.expoConfig?.android?.versionCode;
    fetch(`${LATEST_URL}?t=${Date.now()}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        const latest = parseLatest(json);
        if (latest && isNewer(latest, current)) setState({ kind: 'available', latest });
      })
      .catch(() => {
        // hors ligne : on réessaiera au prochain lancement
      });
  }, []);

  const install = useCallback(async () => {
    if (state.kind !== 'available' && state.kind !== 'error') return;
    const { latest } = state;
    setState({ kind: 'downloading', latest });
    try {
      const target = new File(Paths.cache, `rubix-v${latest.version}.apk`);
      if (target.exists) target.delete(); // un téléchargement interrompu laisserait un fichier incomplet
      const apk = await File.downloadFileAsync(latest.url, target);
      mark(`mise à jour ${latest.version} téléchargée`);
      await startActivityAsync('android.intent.action.VIEW', {
        data: apk.contentUri,
        type: 'application/vnd.android.package-archive',
        flags: FLAG_GRANT_READ_URI_PERMISSION,
      });
      setState({ kind: 'available', latest }); // installation annulée : le bandeau reste proposé
    } catch (e) {
      setState({ kind: 'error', latest, message: 'Téléchargement impossible. Vérifiez la connexion, puis réessayez.' });
      mark(`mise à jour : ${(e as Error)?.message}`);
    }
  }, [state]);

  const dismiss = useCallback(() => setState({ kind: 'none' }), []);

  return { state, install, dismiss };
}
