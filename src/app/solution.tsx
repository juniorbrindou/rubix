import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, type ScrollViewInstance } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { applyMove, invertMove, validate, type Move } from '@/cube';
import { CubeView } from '@/scene/CubeView';
import { STAGES, STAGE_LABEL, solve, type SolutionStep } from '@/solver';
import { ActionButton, CubeStage, Dock, QuietButton, ScreenHeader } from '@/ui/components';
import { InfoButton, StageGuideSheet } from '@/ui/StageGuideSheet';
import { describeMove } from '@/ui/moveText';
import { GUTTER, color, font, radius, space } from '@/ui/theme';

const MOVE_MS = 450;
const PAUSE_MS = 250;

export default function SolutionScreen() {
  const { state: param } = useLocalSearchParams<{ state: string }>();
  const start = typeof param === 'string' && validate(param).ok ? param : null;
  if (!start) return <Invalid />;
  return <Player start={start} />;
}

function Invalid() {
  return (
    <SafeAreaView style={styles.screen}>
      <ScreenHeader eyebrow="Solution" title="Ce cube n’est pas valide." subtitle="Revenez à la saisie pour vérifier ses couleurs." />
      <View style={styles.invalidAction}>
        <ActionButton label="Revenir à la saisie" variant="go" onPress={() => router.replace('/')} />
      </View>
    </SafeAreaView>
  );
}

function Player({ start }: { start: string }) {
  const steps = useMemo(() => solve(start), [start]);
  const [state, setState] = useState(start);
  const [index, setIndex] = useState(0); // nombre de mouvements déjà faits
  const [anim, setAnim] = useState<{ move: Move; dir: 1 | -1 } | null>(null);
  const [playing, setPlaying] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const total = steps.length;
  const finished = index === total;

  const animation = useMemo(
    () =>
      anim && {
        move: anim.move,
        onDone: () => {
          setState((s) => applyMove(s, anim.move));
          setIndex((i) => i + anim.dir);
          setAnim(null);
        },
      },
    [anim],
  );

  const next = () => !anim && index < total && setAnim({ move: steps[index].move, dir: 1 });
  const previous = () => {
    if (anim || index === 0) return;
    setPlaying(false);
    setAnim({ move: invertMove(steps[index - 1].move), dir: -1 });
  };

  // Lecture : enchaîne les mouvements, avec une courte pause entre deux pour laisser suivre.
  useEffect(() => {
    if (!playing || anim) return;
    if (finished) return setPlaying(false);
    const id = setTimeout(next, PAUSE_MS);
    return () => clearTimeout(id);
  });

  // Le pas affiché : celui qu'on va faire, ou le dernier fait quand tout est fini.
  const current: SolutionStep | undefined = steps[Math.min(index, total - 1)];
  const stageSteps = current ? steps.map((s, i) => ({ ...s, i })).filter((s) => s.stage === current.stage) : [];

  const bar = useRef<ScrollViewInstance>(null);
  const chipX = useRef<Record<number, number>>({});
  useEffect(() => {
    const x = chipX.current[index];
    if (x !== undefined) bar.current?.scrollTo({ x: Math.max(0, x - 120), animated: true });
  }, [index]);

  const shownStage = finished || !current ? 'solved' : current.stage;
  const stageNumber = STAGES.indexOf(shownStage) + 1;
  const move = finished ? null : steps[index].move;

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ScreenHeader
        top={
          <View style={styles.topRow}>
            <QuietButton label="‹ Modifier mon cube" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
            <Text style={styles.counter} accessibilityLabel={`Mouvement ${Math.min(index + 1, total)} sur ${total}`}>
              {Math.min(index + 1, total)}
              <Text style={styles.counterTotal}>/{total}</Text>
            </Text>
          </View>
        }
        eyebrow={`Étape ${stageNumber} sur ${STAGES.length}`}
        title={STAGE_LABEL[shownStage]}
        titleAside={<InfoButton onPress={() => setGuideOpen(true)} />}
        subtitle={finished || !current ? undefined : current.label}
      />

      <View style={styles.stages} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {STAGES.map((s, i) => (
          <View
            key={s}
            style={[styles.segment, i < stageNumber - 1 && styles.segmentDone, i === stageNumber - 1 && styles.segmentCurrent]}
          />
        ))}
      </View>

      <View style={styles.barPlate}>
        <ScrollView key={current?.stage} ref={bar} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bar}>
          {stageSteps.map((s) => (
            <View
              key={s.i}
              onLayout={(e) => {
                chipX.current[s.i] = e.nativeEvent.layout.x;
                if (s.i === index) bar.current?.scrollTo({ x: Math.max(0, e.nativeEvent.layout.x - 120), animated: false });
              }}
              style={[styles.chip, s.i === index && styles.chipCurrent]}
            >
              <Text style={[styles.chipText, s.i < index && styles.chipTextDone, s.i === index && styles.chipTextCurrent]}>{s.move}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <CubeStage>
        <CubeView state={state} animation={animation} durationMs={MOVE_MS} />
      </CubeStage>

      <View style={styles.instruction}>
        {move ? (
          <>
            <View style={styles.moveTile}>
              <Text style={styles.moveTileText} numberOfLines={1} adjustsFontSizeToFit>
                {move}
              </Text>
            </View>
            <Text style={styles.instructionText}>{describeMove(move)}</Text>
          </>
        ) : (
          <Text style={styles.done}>{total === 0 ? 'Votre cube est déjà résolu.' : 'Bravo, votre cube est résolu !'}</Text>
        )}
      </View>

      <Dock>
        <View style={styles.controls}>
          <ActionButton label="Précédent" onPress={previous} disabled={index === 0 || !!anim} style={styles.side} />
          <ActionButton
            label={playing ? 'Pause' : 'Lecture'}
            onPress={() => setPlaying((p) => !p)}
            disabled={finished}
            variant="go"
            style={styles.main}
          />
          <ActionButton
            label="Suivant"
            onPress={() => {
              setPlaying(false);
              next();
            }}
            disabled={finished || !!anim}
            style={styles.side}
          />
        </View>
      </Dock>
      <StageGuideSheet stage={shownStage} visible={guideOpen} onClose={() => setGuideOpen(false)} />
      <StatusBar style="dark" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.mat },
  invalidAction: { padding: GUTTER },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.sm, marginLeft: -space.xs },
  counter: { fontFamily: font.display, fontSize: 16, color: color.ink, fontVariant: ['tabular-nums'] },
  counterTotal: { fontFamily: font.displayMedium, fontSize: 12, color: color.inkMute },
  stages: { flexDirection: 'row', gap: 4, paddingHorizontal: GUTTER, marginTop: space.md },
  segment: { flex: 1, height: 6, borderRadius: 3, backgroundColor: color.line },
  segmentDone: { backgroundColor: color.plate },
  segmentCurrent: { backgroundColor: color.go, borderWidth: 1.5, borderColor: color.plate },
  barPlate: { marginTop: space.md, marginHorizontal: GUTTER, borderRadius: radius.plate, backgroundColor: color.plate, overflow: 'hidden' },
  bar: { gap: 4, padding: 6 },
  chip: { minWidth: 40, paddingVertical: 7, paddingHorizontal: 8, borderRadius: radius.chip, alignItems: 'center' },
  chipCurrent: { backgroundColor: color.go },
  chipText: { fontFamily: font.display, fontSize: 15, color: color.onPlate },
  chipTextDone: { color: color.onPlateSoft, opacity: 0.55 },
  chipTextCurrent: { color: color.ink },
  instruction: {
    minHeight: 64,
    marginHorizontal: GUTTER,
    marginBottom: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  moveTile: {
    width: 60,
    height: 60,
    borderRadius: radius.chip + 2,
    borderWidth: 3,
    borderColor: color.plate,
    backgroundColor: color.go,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moveTileText: { fontFamily: font.display, fontSize: 22, color: color.ink },
  instructionText: { flex: 1, fontFamily: font.body, fontSize: 15, lineHeight: 20, color: color.ink },
  done: { flex: 1, fontFamily: font.display, fontSize: 17, lineHeight: 24, textAlign: 'center', color: color.ok },
  controls: { flexDirection: 'row', gap: space.sm },
  side: { flex: 1, paddingHorizontal: space.xs },
  main: { flex: 1.3 },
});
