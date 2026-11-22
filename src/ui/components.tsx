import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type PressableStateCallbackType, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GUTTER, color, font, radius, space } from './theme';

/** Sur le web, Pressable signale aussi le focus clavier : on l'affiche. */
type PressState = PressableStateCallbackType & { focused?: boolean };

const focusRing = (s: PressState, ring: string = color.go): ViewStyle | null =>
  s.focused ? { outlineWidth: 2, outlineStyle: 'solid', outlineColor: ring, outlineOffset: 2 } : null;

/** En-tête fixe d'un écran : il ne défile jamais, pour qu'on sache toujours où on est. */
export function ScreenHeader({
  eyebrow,
  title,
  subtitle,
  aside,
  top,
  titleAside,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  /** À droite du sous-titre : une action secondaire courte. */
  aside?: ReactNode;
  /** Au-dessus du titre : retour, compteur. */
  top?: ReactNode;
  /** Collé au titre : un bouton discret (la fiche de l'étape). */
  titleAside?: ReactNode;
}) {
  return (
    <View style={styles.header}>
      {top}
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <View style={styles.titleRow}>
        <Text style={styles.title} numberOfLines={2} accessibilityRole="header">
          {title}
        </Text>
        {titleAside}
      </View>
      {subtitle || aside ? (
        <View style={styles.subRow}>
          <Text style={styles.subtitle}>{subtitle}</Text>
          {aside}
        </View>
      ) : null}
    </View>
  );
}

/** Le plateau noir du bas : là où se trouvent la palette et l'action principale. */
export function Dock({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return <View style={[styles.dock, { paddingBottom: space.md + insets.bottom }]}>{children}</View>;
}

type ButtonVariant = 'go' | 'plate';

/**
 * `go` : autocollant jaune cerclé de noir, l'action qui fait avancer. `plate` : bouton secondaire, sur le dock.
 * Éteint, un bouton reste lisible et dit ce qui manque dans `sublabel`.
 */
export function ActionButton({
  label,
  sublabel,
  onPress,
  disabled,
  variant = 'plate',
  style,
}: {
  label: string;
  sublabel?: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: ButtonVariant;
  style?: StyleProp<ViewStyle>;
}) {
  const go = variant === 'go' && !disabled;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      accessibilityLabel={sublabel ? `${label}. ${sublabel}` : label}
      style={(s: PressState) => [
        styles.button,
        go ? styles.buttonGo : styles.buttonPlate,
        disabled && styles.buttonOff,
        s.pressed && styles.pressed,
        focusRing(s),
        style,
      ]}
    >
      <Text style={[styles.buttonText, go && styles.buttonTextGo, disabled && styles.buttonTextOff]} numberOfLines={1}>
        {label}
      </Text>
      {sublabel ? (
        <Text style={[styles.buttonSub, go && styles.buttonSubGo]} numberOfLines={1}>
          {sublabel}
        </Text>
      ) : null}
    </Pressable>
  );
}

/** Lien discret sur le tapis : actions secondaires (effacer, revenir). */
export function QuietButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      hitSlop={8}
      style={(s: PressState) => [styles.quiet, s.pressed && styles.pressed, focusRing(s, color.ink)]}
    >
      <Text style={styles.quietText}>{label}</Text>
    </Pressable>
  );
}

/**
 * Le cube prend toute la place qui reste, en restant carré : il rétrécit sur un petit téléphone au lieu de
 * pousser le reste de l'écran hors de vue. `CubeView` remplit la largeur qu'on lui donne.
 */
export function CubeStage({ children }: { children: ReactNode }) {
  const [side, setSide] = useState(0);
  return (
    <View
      style={styles.stage}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setSide(Math.floor(Math.min(width, height)));
      }}
    >
      {side > 0 && <View style={{ width: side, height: side }}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: GUTTER, paddingTop: space.sm },
  eyebrow: { fontFamily: font.displayMedium, fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', color: color.inkMute },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  title: { flexShrink: 1, fontFamily: font.display, fontSize: 20, lineHeight: 26, color: color.ink, letterSpacing: -0.4 },
  subRow: { marginTop: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  subtitle: { flexShrink: 1, fontFamily: font.body, fontSize: 15, color: color.inkSoft },
  dock: {
    backgroundColor: color.plate,
    borderTopLeftRadius: radius.dock,
    borderTopRightRadius: radius.dock,
    paddingHorizontal: space.md,
    paddingTop: space.md,
    gap: space.md,
  },
  button: {
    minHeight: 52,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.plate,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonGo: { backgroundColor: color.go, borderColor: color.plate },
  buttonPlate: { backgroundColor: color.plateRaised, borderColor: color.plateRaised },
  buttonOff: { backgroundColor: color.plateRaised, borderColor: color.plateRaised, opacity: 0.75 },
  pressed: { opacity: 0.8, transform: [{ translateY: 1 }] },
  buttonText: { fontFamily: font.bodyBold, fontSize: 16, color: color.onPlate },
  buttonTextGo: { color: color.ink },
  buttonTextOff: { color: color.onPlateSoft },
  buttonSub: { marginTop: 1, fontFamily: font.body, fontSize: 13, color: color.onPlateSoft },
  buttonSubGo: { color: color.ink },
  quiet: { paddingVertical: space.xs, paddingHorizontal: space.xs, borderRadius: 6 },
  quietText: { fontFamily: font.bodyBold, fontSize: 14, color: color.inkSoft, textDecorationLine: 'underline' },
  stage: { flex: 1, minHeight: 160, alignItems: 'center', justifyContent: 'center' },
});
