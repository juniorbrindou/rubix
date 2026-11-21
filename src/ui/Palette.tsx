import { Pressable, StyleSheet, Text, View, type PressableStateCallbackType, type ViewStyle } from 'react-native';
import { FACES, FACE_COLOR_NAME, UNKNOWN, type Face } from '../cube';
import { color, font, radius } from './theme';

export type Brush = Face | typeof UNKNOWN;

const PIPS = [0, 1, 2, 3, 4, 5, 6, 7, 8];
/** Rouge lisible sur le plastique noir. */
const OVER = '#FF7A7A';

/**
 * Palette de saisie : chaque couleur est une petite face de 3×3 qui se remplit à mesure qu'on pose ses 9 cases.
 * On voit d'un coup d'œil ce qu'il reste à trouver, et une couleur en trop. La gomme compte les cases grises.
 */
export function Palette({
  brush,
  onChange,
  counts,
}: {
  brush: Brush;
  onChange: (b: Brush) => void;
  counts: Record<Face | typeof UNKNOWN, number>;
}) {
  return (
    <View style={styles.row} accessibilityRole="radiogroup">
      {[...FACES, UNKNOWN].map((c) => {
        const b = c as Brush;
        const selected = brush === b;
        const n = counts[b];
        const over = b !== UNKNOWN && n > 9;
        const name = b === UNKNOWN ? 'Gomme' : FACE_COLOR_NAME[b as Face];
        return (
          <Pressable
            key={b}
            onPress={() => onChange(b)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={b === UNKNOWN ? `Gomme, ${n} cases grises` : `${name}, ${n} sur 9`}
            style={(s: PressableStateCallbackType & { focused?: boolean }) => [
              styles.item,
              s.focused && (styles.focus as ViewStyle),
            ]}
          >
            <View style={[styles.ring, selected && styles.ringOn, over && styles.ringOver]}>
              {b === UNKNOWN ? (
                <View style={[styles.face, styles.eraser]}>
                  <Text style={styles.eraserGlyph}>⌫</Text>
                </View>
              ) : (
                <View style={styles.face}>
                  {PIPS.map((p) => (
                    <View key={p} style={[styles.pip, { backgroundColor: color.sticker[b] }, p >= n && styles.pipEmpty]} />
                  ))}
                </View>
              )}
            </View>
            <Text style={[styles.count, selected && styles.countOn, over && styles.countOver]}>
              {b === UNKNOWN ? n : `${n}/9`}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const FACE = 38;
const PIP = 10;

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  item: { alignItems: 'center', minWidth: 44, borderRadius: 10 },
  focus: { outlineWidth: 2, outlineStyle: 'solid', outlineColor: color.go, outlineOffset: 1 },
  ring: { padding: 2, borderRadius: radius.chip, borderWidth: 2, borderColor: 'transparent' },
  ringOn: { borderColor: color.onPlate },
  ringOver: { borderColor: OVER },
  face: {
    width: FACE,
    height: FACE,
    padding: 3,
    borderRadius: 7,
    backgroundColor: color.plateRaised,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignContent: 'space-between',
  },
  pip: { width: PIP, height: PIP, borderRadius: 2 },
  pipEmpty: { opacity: 0.18 },
  eraser: { backgroundColor: color.sticker['?'], alignItems: 'center', justifyContent: 'center' },
  eraserGlyph: { fontSize: 18, color: color.onPlate },
  count: { marginTop: 3, fontFamily: font.displayMedium, fontSize: 10, color: color.onPlateSoft, fontVariant: ['tabular-nums'] },
  countOn: { color: color.onPlate },
  countOver: { color: OVER },
});
