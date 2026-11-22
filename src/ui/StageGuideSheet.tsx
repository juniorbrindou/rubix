import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { STAGES, STAGE_LABEL, type StageId } from '../solver';
import { STAGE_GUIDES } from './stageGuides';
import { GUTTER, color, font, radius, space } from './theme';

const HINT_PINK = '#FF2D95'; // la couleur de la flèche d'aide et des cases visées

/** Petit bouton « i » qui ouvre la fiche de l'étape : discret, à côté du nom de l'étape. */
export function InfoButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel="Comprendre cette étape"
      style={({ pressed }) => [styles.info, pressed && { opacity: 0.6 }]}
    >
      <Text style={styles.infoText}>i</Text>
    </Pressable>
  );
}

/** Fiche d'une étape, en volet qui monte du bas. Se ferme par ✕, en touchant le fond ou par le bouton retour. */
export function StageGuideSheet({ stage, visible, onClose }: { stage: StageId; visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const guide = STAGE_GUIDES[stage];
  const n = STAGES.indexOf(stage);
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Fermer la fiche" />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + space.lg }]}>
          <View style={styles.grab} />
          <View style={styles.head}>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>
                Étape {n + 1} sur {STAGES.length}
              </Text>
              <Text style={styles.title}>{STAGE_LABEL[stage]}</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={10} style={styles.close} accessibilityRole="button" accessibilityLabel="Fermer">
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            <View style={styles.where} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              {STAGES.map((s, i) => (
                <View key={s} style={[styles.step, i < n && styles.stepDone, i === n && styles.stepCurrent]}>
                  <Text style={[styles.stepText, i < n && styles.stepTextDone, i === n && styles.stepTextCurrent]}>{i + 1}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.lede}>{guide.goal}</Text>

            <Text style={styles.h3}>Tenez le cube de cette façon</Text>
            <View style={styles.hold}>
              <Image source={guide.image} style={styles.image} accessibilityIgnoresInvertColors />
              <View style={styles.holdText}>
                {guide.hold.map((line, i) => (
                  <View key={i} style={styles.holdLine}>
                    <View style={[styles.dot, { backgroundColor: i === 0 ? color.go : HINT_PINK }]} />
                    <Text style={styles.text}>{line}</Text>
                  </View>
                ))}
              </View>
            </View>

            <Text style={styles.h3}>La formule</Text>
            {guide.formulas.map((f, k) => (
              <View key={k} style={styles.formula}>
                {f.label && <Text style={styles.formulaLabel}>{f.label}</Text>}
                {f.gloss ? (
                  f.moves.map((m, i) => (
                    <View key={i} style={styles.glossRow}>
                      <View style={styles.tileWide}>
                        <Text style={styles.tileText}>{m}</Text>
                      </View>
                      <Text style={styles.text}>{f.gloss![i]}</Text>
                    </View>
                  ))
                ) : (
                  <View style={styles.tiles}>
                    {f.moves.map((m, i) => (
                      <View key={i} style={styles.tile}>
                        <Text style={styles.tileText}>{m}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
            {guide.note && <Text style={styles.note}>{guide.note}</Text>}

            <Text style={styles.h3}>Objectif atteint</Text>
            {guide.done.map((d, i) => (
              <View key={i} style={styles.checkRow}>
                <View style={styles.check} />
                <Text style={styles.text}>{d}</Text>
              </View>
            ))}

            {guide.warning && (
              <View style={styles.warning}>
                <Text style={styles.text}>
                  <Text style={styles.bold}>{guide.warning.title} </Text>
                  {guide.warning.text}
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  info: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: color.inkSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: { fontFamily: font.display, fontSize: 13, color: color.inkSoft, lineHeight: 16 },
  backdrop: { flex: 1, backgroundColor: 'rgba(17,17,17,0.45)', justifyContent: 'flex-end' },
  sheet: {
    maxHeight: '88%',
    backgroundColor: color.card,
    borderTopLeftRadius: radius.dock,
    borderTopRightRadius: radius.dock,
    paddingTop: space.sm,
  },
  grab: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: color.line, marginBottom: space.sm },
  head: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: GUTTER + 2 },
  eyebrow: { fontFamily: font.displayMedium, fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', color: color.inkMute },
  title: { marginTop: 2, fontFamily: font.display, fontSize: 22, letterSpacing: -0.4, color: color.ink },
  close: { width: 32, height: 32, borderRadius: 16, backgroundColor: color.mat, alignItems: 'center', justifyContent: 'center' },
  closeText: { fontSize: 16, color: color.inkSoft },
  body: { paddingHorizontal: GUTTER + 2, paddingBottom: space.md },
  where: { flexDirection: 'row', gap: 4, marginTop: space.md },
  step: { flex: 1, paddingVertical: 5, borderRadius: 6, backgroundColor: color.mat, alignItems: 'center' },
  stepDone: { backgroundColor: color.plate },
  stepCurrent: { backgroundColor: color.go, borderWidth: 2, borderColor: color.plate },
  stepText: { fontFamily: font.displayMedium, fontSize: 10, color: color.inkMute },
  stepTextDone: { color: color.onPlate },
  stepTextCurrent: { color: color.ink },
  lede: { marginTop: space.md, fontFamily: font.body, fontSize: 16, lineHeight: 22, color: color.ink },
  h3: {
    marginTop: space.lg,
    marginBottom: space.sm,
    fontFamily: font.displayMedium,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: color.inkMute,
  },
  hold: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.plate,
    borderWidth: 1,
    borderColor: color.mat,
    paddingVertical: space.sm,
    paddingRight: space.md,
  },
  image: { width: 132, height: 132 },
  holdText: { flex: 1, gap: space.sm },
  holdLine: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-start' },
  dot: { width: 10, height: 10, borderRadius: 3, marginTop: 5 },
  text: { flexShrink: 1, fontFamily: font.body, fontSize: 14, lineHeight: 19, color: color.ink },
  bold: { fontFamily: font.bodyBold },
  formula: { marginBottom: space.sm },
  formulaLabel: { fontFamily: font.bodyBold, fontSize: 13, color: color.inkSoft, marginBottom: space.xs },
  glossRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginBottom: 6 },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  tile: { backgroundColor: color.plate, borderRadius: 7, paddingVertical: 5, paddingHorizontal: 8 },
  tileWide: { width: 44, backgroundColor: color.plate, borderRadius: 8, paddingVertical: 5, alignItems: 'center' },
  tileText: { fontFamily: font.display, fontSize: 14, color: color.onPlate },
  note: { fontFamily: font.body, fontSize: 13, lineHeight: 18, color: color.inkMute },
  checkRow: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-start', marginBottom: 6 },
  check: { width: 13, height: 13, borderRadius: 4, backgroundColor: color.ok, marginTop: 3 },
  warning: {
    marginTop: space.sm,
    backgroundColor: '#FFF1F7',
    borderLeftWidth: 4,
    borderLeftColor: HINT_PINK,
    borderRadius: 8,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
  },
});
