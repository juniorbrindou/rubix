import { Stack, type ErrorBoundaryProps } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * En version installée (APK), une erreur JavaScript non rattrapée ferme l'app sans rien dire. On l'affiche à la
 * place, pour que l'utilisateur puisse en envoyer une capture : c'est le seul journal lisible sans câble.
 */
type Listener = (error: Error) => void;
const listeners = new Set<Listener>();
let lastError: Error | null = null;

const errorUtils = (globalThis as { ErrorUtils?: { getGlobalHandler(): (e: Error, fatal?: boolean) => void; setGlobalHandler(h: (e: Error, fatal?: boolean) => void): void } }).ErrorUtils;
if (errorUtils) {
  const previous = errorUtils.getGlobalHandler();
  errorUtils.setGlobalHandler((error, fatal) => {
    lastError = error;
    listeners.forEach((l) => l(error));
    if (!fatal) previous(error, fatal);
  });
}

export default function RootLayout() {
  const [error, setError] = useState<Error | null>(lastError);
  useEffect(() => {
    listeners.add(setError);
    return () => void listeners.delete(setError);
  }, []);
  if (error) return <CrashScreen error={error} onRetry={() => setError((lastError = null))} />;
  return <Stack screenOptions={{ headerShown: false }} />;
}

/** Erreur pendant l'affichage d'un écran : expo-router rend ce composant à la place de l'écran. */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return <CrashScreen error={error} onRetry={retry} />;
}

function CrashScreen({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Oups, l’app a rencontré une erreur</Text>
        <Text style={styles.help}>Fais une capture de cet écran et envoie-la : elle dit exactement ce qui s’est passé.</Text>
        <Text selectable style={styles.message}>
          {error.name}: {error.message}
        </Text>
        <Text selectable style={styles.stack}>
          {(error.stack ?? '').split('\n').slice(0, 12).join('\n')}
        </Text>
        <Pressable onPress={onRetry} style={styles.button}>
          <Text style={styles.buttonText}>Réessayer</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFF' },
  content: { padding: 16 },
  title: { fontSize: 20, fontWeight: '700' },
  help: { marginTop: 6, fontSize: 15, color: '#444' },
  message: { marginTop: 14, fontSize: 15, color: '#C62828', fontWeight: '600' },
  stack: { marginTop: 8, fontSize: 11, color: '#555', fontFamily: 'monospace' },
  button: { marginTop: 18, paddingVertical: 14, borderRadius: 12, backgroundColor: '#111', alignItems: 'center' },
  buttonText: { color: '#FFF', fontSize: 16 },
});
