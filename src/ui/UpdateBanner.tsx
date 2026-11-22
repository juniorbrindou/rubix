import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppUpdate } from '../update/useAppUpdate';
import { color, font, radius, space } from './theme';

/** Bandeau discret, en haut de l'écran, quand une version plus récente de l'app est publiée. */
export function UpdateBanner() {
  const insets = useSafeAreaInsets();
  const { state, install, dismiss } = useAppUpdate();
  if (state.kind === 'none') return null;
  const busy = state.kind === 'downloading';
  return (
    <View style={[styles.wrap, { top: insets.top + space.xs }]} pointerEvents="box-none">
      <View style={styles.banner} accessibilityRole="alert">
        <View style={styles.text}>
          <Text style={styles.title}>Version {state.latest.version} disponible</Text>
          <Text style={styles.sub} numberOfLines={2}>
            {state.kind === 'error' ? state.message : busy ? 'Téléchargement en cours…' : state.latest.notes ?? 'Nouvelle version de Rubix Coach.'}
          </Text>
        </View>
        {busy ? (
          <ActivityIndicator color={color.go} />
        ) : (
          <Pressable onPress={install} style={({ pressed }) => [styles.go, pressed && { opacity: 0.8 }]} accessibilityRole="button">
            <Text style={styles.goText}>{state.kind === 'error' ? 'Réessayer' : 'Mettre à jour'}</Text>
          </Pressable>
        )}
        {!busy && (
          <Pressable onPress={dismiss} hitSlop={10} accessibilityRole="button" accessibilityLabel="Plus tard">
            <Text style={styles.close}>✕</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: space.md, right: space.md, zIndex: 10 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: color.plate,
    borderRadius: radius.plate,
    paddingVertical: space.sm,
    paddingLeft: space.md,
    paddingRight: space.sm,
  },
  text: { flex: 1 },
  title: { fontFamily: font.bodyBold, fontSize: 14, color: color.onPlate },
  sub: { fontFamily: font.body, fontSize: 12, color: color.onPlateSoft, marginTop: 1 },
  go: { backgroundColor: color.go, borderRadius: radius.chip, paddingVertical: space.sm, paddingHorizontal: space.md },
  goText: { fontFamily: font.bodyBold, fontSize: 14, color: color.ink },
  close: { fontSize: 16, color: color.onPlateSoft, paddingHorizontal: space.xs },
});
