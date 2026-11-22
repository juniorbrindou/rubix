import { Alert, Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { GUTTER, color, font, radius, space } from './theme';

export type Mode = 'cube' | 'learn';

const ICON = {
  cube: require('../../assets/icones/cube-gris.png'),
  learn: require('../../assets/icones/cube-couleurs.png'),
};

/** Les deux modes de l'app, en haut des écrans : décrire son cube, ou apprendre sur un cube numérique. */
export function ModeTabs({ active, onSelect }: { active: Mode; onSelect: (mode: Mode) => void }) {
  return (
    <View style={styles.tabs} accessibilityRole="tablist">
      {(['cube', 'learn'] as const).map((mode) => {
        const on = mode === active;
        return (
          <Pressable
            key={mode}
            onPress={() => !on && onSelect(mode)}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            style={({ pressed }) => [styles.tab, on && styles.tabOn, pressed && !on && { opacity: 0.7 }]}
          >
            <Image source={ICON[mode]} style={styles.icon} />
            <Text style={[styles.tabText, on && styles.tabTextOn]}>{mode === 'cube' ? 'Mon cube' : 'Apprendre'}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Corbeille dessinée en traits (couvercle, poignée, cuve rayée) : pas de police d'icônes à charger. */
function TrashIcon() {
  return (
    <View style={styles.trash} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={styles.trashHandle} />
      <View style={styles.trashLid} />
      <View style={styles.trashBody}>
        <View style={styles.trashLine} />
        <View style={styles.trashLine} />
      </View>
    </View>
  );
}

/** Demande confirmation avant une action qu'on ne peut pas annuler. */
function confirm(title: string, message: string, action: string, onConfirm: () => void) {
  if (Platform.OS === 'web') {
    if (globalThis.confirm?.(`${title}\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Annuler', style: 'cancel' },
    { text: action, style: 'destructive', onPress: onConfirm },
  ]);
}

/** Bouton « Effacer » : corbeille légendée, qui demande confirmation. */
export function EraseButton({ onErase, disabled }: { onErase: () => void; disabled?: boolean }) {
  return (
    <Pressable
      onPress={() => confirm('Tout effacer ?', 'Les couleurs saisies et les étapes cochées seront perdues.', 'Effacer', onErase)}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel="Tout effacer"
      hitSlop={6}
      style={({ pressed }) => [styles.erase, pressed && { opacity: 0.7 }, disabled && { opacity: 0.4 }]}
    >
      <TrashIcon />
      <Text style={styles.eraseText}>Effacer</Text>
    </Pressable>
  );
}

const INK = color.inkSoft;

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    marginHorizontal: GUTTER,
    marginTop: space.sm,
    padding: 4,
    borderRadius: 14,
    backgroundColor: '#D3DAE3',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
  },
  tabOn: { backgroundColor: color.plate },
  icon: { width: 20, height: 20 },
  tabText: { fontFamily: font.bodyBold, fontSize: 14, color: color.inkSoft },
  tabTextOn: { color: color.onPlate },
  erase: {
    alignItems: 'center',
    gap: 3,
    paddingVertical: 6,
    paddingHorizontal: 9,
    borderRadius: radius.chip + 2,
    borderWidth: 1,
    borderColor: color.line,
    backgroundColor: '#FFFFFF',
  },
  eraseText: { fontFamily: font.bodyBold, fontSize: 10, color: INK },
  trash: { width: 16, height: 18, alignItems: 'center' },
  trashHandle: { width: 6, height: 3, borderTopLeftRadius: 2, borderTopRightRadius: 2, borderWidth: 2, borderBottomWidth: 0, borderColor: INK },
  trashLid: { width: 16, height: 2, borderRadius: 1, backgroundColor: INK },
  trashBody: {
    marginTop: 1,
    width: 12,
    height: 12,
    borderWidth: 2,
    borderTopWidth: 0,
    borderColor: INK,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingTop: 2,
  },
  trashLine: { width: 1.5, height: 6, backgroundColor: INK, borderRadius: 1 },
});
