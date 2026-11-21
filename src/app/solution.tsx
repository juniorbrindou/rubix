import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type ScrollViewInstance } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { applyMove, invertMove, validate, type Move } from '@/cube';
import { CubeView } from '@/scene/CubeView';
import { STAGES, STAGE_LABEL, solve, type SolutionStep } from '@/solver';
import { describeMove } from '@/ui/moveText';

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
      <Text style={styles.done}>Ce cube n’est pas valide.</Text>
      <Button label="Revenir à la saisie" onPress={() => router.replace('/')} />
    </SafeAreaView>
  );
}

function Player({ start }: { start: string }) {
  const steps = useMemo(() => solve(start), [start]);
  const [state, setState] = useState(start);
  const [index, setIndex] = useState(0); // nombre de mouvements déjà faits
  const [anim, setAnim] = useState<{ move: Move; dir: 1 | -1 } | null>(null);
  const [playing, setPlaying] = useState(false);
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

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        {current && (
          <>
            <Text style={styles.stage}>
              Étape {STAGES.indexOf(current.stage) + 1}/7 · {STAGE_LABEL[current.stage]}
            </Text>
            <Text style={styles.label}>{finished ? ' ' : current.label}</Text>
          </>
        )}

        <ScrollView key={current?.stage} ref={bar} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bar}>
          {stageSteps.map((s) => (
            <View
              key={s.i}
              onLayout={(e) => {
                chipX.current[s.i] = e.nativeEvent.layout.x;
                if (s.i === index) bar.current?.scrollTo({ x: Math.max(0, e.nativeEvent.layout.x - 120), animated: false });
              }}
              style={[styles.chip, s.i < index && styles.chipDone, s.i === index && styles.chipCurrent]}
            >
              <Text style={[styles.chipText, s.i === index && styles.chipTextCurrent]}>{s.move}</Text>
            </View>
          ))}
        </ScrollView>

        <CubeView state={state} animation={animation} durationMs={MOVE_MS} />

        <Text style={finished ? styles.done : styles.instruction}>
          {total === 0
            ? 'Ton cube est déjà résolu.'
            : finished
              ? 'Bravo, ton cube est résolu !'
              : `${steps[index].move} — ${describeMove(steps[index].move)}`}
        </Text>
        <Text style={styles.progress}>
          Mouvement {Math.min(index + 1, total)} sur {total}
        </Text>

        <View style={styles.controls}>
          <Button label="Précédent" onPress={previous} disabled={index === 0 || !!anim} />
          <Button
            label={playing ? 'Pause' : 'Lecture'}
            onPress={() => setPlaying((p) => !p)}
            disabled={finished}
            primary
          />
          <Button
            label="Suivant"
            onPress={() => {
              setPlaying(false);
              next();
            }}
            disabled={finished || !!anim}
          />
        </View>

        <Pressable onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>Modifier mon cube</Text>
        </Pressable>
      </ScrollView>
      <StatusBar style="dark" />
    </SafeAreaView>
  );
}

function Button({ label, onPress, disabled, primary }: { label: string; onPress: () => void; disabled?: boolean; primary?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.button, primary && styles.primary, pressed && styles.pressed, disabled && styles.disabled]}
    >
      <Text style={[styles.buttonText, primary && styles.primaryText]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FAFAF7' },
  content: { paddingHorizontal: 16, paddingVertical: 12 },
  stage: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
  label: { marginTop: 2, fontSize: 15, textAlign: 'center', color: '#555' },
  bar: { gap: 6, paddingVertical: 10, paddingHorizontal: 2 },
  chip: { minWidth: 44, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10, borderWidth: 1, borderColor: '#DDD', backgroundColor: '#FFF', alignItems: 'center' },
  chipDone: { opacity: 0.4 },
  chipCurrent: { backgroundColor: '#111', borderColor: '#111' },
  chipText: { fontSize: 16, color: '#222', fontVariant: ['tabular-nums'] },
  chipTextCurrent: { color: '#FFF', fontWeight: '700' },
  instruction: { marginTop: 6, fontSize: 16, textAlign: 'center', color: '#222', minHeight: 44 },
  done: { marginTop: 6, fontSize: 18, textAlign: 'center', color: '#1B7F3B', fontWeight: '700', minHeight: 44 },
  progress: { marginTop: 4, fontSize: 13, textAlign: 'center', color: '#777' },
  controls: { marginTop: 12, flexDirection: 'row', gap: 8 },
  button: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#DDD', backgroundColor: '#FFF', alignItems: 'center' },
  primary: { backgroundColor: '#111', borderColor: '#111' },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.35 },
  buttonText: { fontSize: 16, color: '#111' },
  primaryText: { color: '#FFF', fontWeight: '600' },
  back: { marginTop: 18, alignSelf: 'center', paddingVertical: 10, paddingHorizontal: 18 },
  backText: { fontSize: 15, color: '#666', textDecorationLine: 'underline' },
});
