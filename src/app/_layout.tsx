// En premier : le mouchard de démarrage s'installe avant que les écrans (et la 3D) ne se chargent.
import { clearError, crashedLaunch, lastError, mark, onError, type LaunchLog } from '@/diagnostics';
import { Stack, type ErrorBoundaryProps } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * En version installée (APK), une erreur non rattrapée ferme l'app sans rien dire. On l'affiche à la place, ainsi
 * que le déroulé d'un lancement précédent qui s'est mal fini : c'est le seul journal lisible sans câble.
 */
export default function RootLayout() {
  const [error, setError] = useState<Error | null>(lastError);
  const [crash, setCrash] = useState<LaunchLog | null>(crashedLaunch);
  useEffect(() => {
    mark('écran racine affiché');
    return onError(setError);
  }, []);

  if (error)
    return (
      <Report
        title="Oups, l’app a rencontré une erreur"
        lines={[`${error.name}: ${error.message}`, ...(error.stack ?? '').split('\n').slice(0, 12)]}
        onContinue={() => {
          clearError();
          setError(null);
        }}
      />
    );
  if (crash)
    return (
      <Report
        title="L’app s’est fermée la dernière fois"
        lines={[crash.device, `Lancement du ${crash.started}`, 'Dernières étapes atteintes :', ...crash.steps.slice(-15)]}
        onContinue={() => setCrash(null)}
      />
    );
  return <Stack screenOptions={{ headerShown: false }} />;
}

/** Erreur pendant l'affichage d'un écran : expo-router rend ce composant à la place de l'écran. */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  useEffect(() => mark(`erreur d’affichage : ${error.message}`), [error]);
  return (
    <Report
      title="Oups, l’app a rencontré une erreur"
      lines={[`${error.name}: ${error.message}`, ...(error.stack ?? '').split('\n').slice(0, 12)]}
      onContinue={retry}
    />
  );
}

function Report({ title, lines, onContinue }: { title: string; lines: string[]; onContinue: () => void }) {
  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.help}>Fais une capture de cet écran et envoie-la : elle dit exactement ce qui s’est passé.</Text>
        {lines.map((l, i) => (
          <Text key={i} selectable style={i === 0 ? styles.first : styles.line}>
            {l}
          </Text>
        ))}
        <Pressable onPress={onContinue} style={styles.button}>
          <Text style={styles.buttonText}>Continuer</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFF' },
  content: { padding: 16 },
  title: { fontSize: 20, fontWeight: '700' },
  help: { marginTop: 6, marginBottom: 12, fontSize: 15, color: '#444' },
  first: { fontSize: 15, color: '#C62828', fontWeight: '600', marginBottom: 6 },
  line: { fontSize: 12, color: '#333', fontFamily: 'monospace' },
  button: { marginTop: 18, paddingVertical: 14, borderRadius: 12, backgroundColor: '#111', alignItems: 'center' },
  buttonText: { color: '#FFF', fontSize: 16 },
});
