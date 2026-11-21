// En premier : le mouchard de démarrage s'installe avant que les écrans (et la 3D) ne se chargent.
import { clearError, crashedLaunch, lastError, mark, onError, type LaunchLog } from '@/diagnostics';
import { Stack, type ErrorBoundaryProps } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActionButton } from '@/ui/components';
import { useAppFonts } from '@/ui/fonts';
import { GUTTER, color, font, radius, space } from '@/ui/theme';

/**
 * En version installée (APK), une erreur non rattrapée ferme l'app sans rien dire. On l'affiche à la place, ainsi
 * que le déroulé d'un lancement précédent qui s'est mal fini : c'est le seul journal lisible sans câble.
 */
export default function RootLayout() {
  const [error, setError] = useState<Error | null>(lastError);
  const [crash, setCrash] = useState<LaunchLog | null>(crashedLaunch);
  useAppFonts();
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
        <View style={styles.badge}>
          <View style={styles.badgeSticker} />
          <Text style={styles.eyebrow}>Rapport d’erreur</Text>
        </View>
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
        <Text style={styles.help}>Fais une capture de cet écran et envoie-la : elle dit exactement ce qui s’est passé.</Text>
        <View style={styles.log}>
          {lines.map((l, i) => (
            <Text key={i} selectable style={i === 0 ? styles.first : styles.line}>
              {l}
            </Text>
          ))}
        </View>
        <ActionButton label="Continuer" variant="go" onPress={onContinue} style={styles.button} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.mat },
  content: { padding: GUTTER },
  badge: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  badgeSticker: { width: 14, height: 14, borderRadius: 4, backgroundColor: color.sticker.L, borderWidth: 2, borderColor: color.plate },
  eyebrow: { fontFamily: font.displayMedium, fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', color: color.inkMute },
  title: { marginTop: space.sm, fontFamily: font.display, fontSize: 20, lineHeight: 27, color: color.ink, letterSpacing: -0.4 },
  help: { marginTop: space.sm, marginBottom: space.lg, fontFamily: font.body, fontSize: 15, lineHeight: 21, color: color.inkSoft },
  log: { padding: space.md, borderRadius: radius.plate, backgroundColor: color.plate, gap: 2 },
  first: { marginBottom: space.sm, fontFamily: font.mono, fontSize: 14, lineHeight: 19, color: '#FF8A80' },
  line: { fontFamily: font.mono, fontSize: 12, lineHeight: 17, color: color.onPlateSoft },
  button: { marginTop: space.lg },
});
