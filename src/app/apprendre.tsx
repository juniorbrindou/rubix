import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SOLVED, applyMove, applyMoves, invertMove, randomScramble, validate, type Move } from '@/cube';
import { CubeView } from '@/scene/CubeView';
import { STAGE_LABEL, solve, type SolutionStep } from '@/solver';
import { describeMove } from '@/ui/moveText';

// Volet « Apprendre » : un cube numérique qu'on résout soi-même. « Aide » montre le prochain mouvement de la
// méthode débutant, calculé depuis l'état où l'on en est ; un second appui le joue.

const MOVE_MS = 260;

type Pending = { move: Move; history: 'push' | 'pop' };

function scrambled() {
  return applyMoves(SOLVED, randomScramble(25));
}

export default function LearnScreen() {
  const { state: param } = useLocalSearchParams<{ state?: string }>();
  const fromRealCube = typeof param === 'string' && validate(param).ok;
  const [state, setState] = useState(() => (fromRealCube ? (param as string) : scrambled()));
  const [history, setHistory] = useState<Move[]>([]);
  const [pending, setPending] = useState<Pending | null>(null);
  const [hint, setHint] = useState<SolutionStep | null>(null);
  const solved = state === SOLVED;

  const animation = useMemo(
    () =>
      pending && {
        move: pending.move,
        onDone: () => {
          setState((s) => applyMove(s, pending.move));
          setHistory((h) => (pending.history === 'push' ? [...h, pending.move] : h.slice(0, -1)));
          setPending(null);
        },
      },
    [pending],
  );

  const play = (move: Move) => {
    if (pending) return;
    setHint(null);
    setPending({ move, history: 'push' });
  };

  const help = () => {
    if (pending || solved) return;
    if (hint) return play(hint.move); // second appui : on le fait pour toi
    const next = solve(state)[0];
    if (next) setHint(next);
  };

  const undo = () => {
    if (pending || !history.length) return;
    setHint(null);
    setPending({ move: invertMove(history[history.length - 1]), history: 'pop' });
  };

  const reshuffle = () => {
    if (pending) return;
    setState(scrambled());
    setHistory([]);
    setHint(null);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} hitSlop={10}>
            <Text style={styles.back}>‹ Retour</Text>
          </Pressable>
          <Text style={styles.title}>Apprendre</Text>
          <Text style={styles.count}>{history.length} coup{history.length > 1 ? 's' : ''}</Text>
        </View>
        <Text style={styles.subtitle}>
          {fromRealCube ? 'Ton cube, à résoudre toi-même.' : 'Un cube mélangé, à résoudre toi-même.'}
        </Text>

        <CubeView state={state} animation={animation} durationMs={MOVE_MS} mode="turn" onTurn={play} hint={hint?.move ?? null} />

        <View style={styles.panel}>
          {solved ? (
            <Text style={styles.done}>Bravo, tu l’as résolu en {history.length} coups !</Text>
          ) : hint ? (
            <>
              <Text style={styles.stage}>
                {STAGE_LABEL[hint.stage]} · {hint.label}
              </Text>
              <Text style={styles.instruction}>
                {hint.move} — {describeMove(hint.move)}
              </Text>
              <Text style={styles.note}>Suis la flèche rose, ou appuie encore sur Aide pour que je le fasse.</Text>
            </>
          ) : (
            <Text style={styles.note}>
              Glisse un doigt sur une face pour la tourner, deux doigts pour tourner le cube. Bloqué ? Appuie sur Aide.
            </Text>
          )}
        </View>

        <View style={styles.controls}>
          <Button label="Annuler" onPress={undo} disabled={!history.length || !!pending} />
          <Button label={hint ? 'Fais-le' : 'Aide'} onPress={help} disabled={solved || !!pending} primary />
          <Button label="Mélanger" onPress={reshuffle} disabled={!!pending} />
        </View>
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { fontSize: 16, color: '#555', minWidth: 70 },
  title: { fontSize: 22, fontWeight: '700' },
  count: { fontSize: 14, color: '#777', minWidth: 70, textAlign: 'right', fontVariant: ['tabular-nums'] },
  subtitle: { marginTop: 4, fontSize: 15, color: '#555', textAlign: 'center' },
  panel: { minHeight: 92, justifyContent: 'center', marginTop: 4 },
  stage: { fontSize: 14, fontWeight: '600', color: '#B0126B', textAlign: 'center' },
  instruction: { marginTop: 4, fontSize: 16, color: '#222', textAlign: 'center' },
  note: { marginTop: 6, fontSize: 14, color: '#666', textAlign: 'center' },
  done: { fontSize: 18, fontWeight: '700', color: '#1B7F3B', textAlign: 'center' },
  controls: { marginTop: 8, flexDirection: 'row', gap: 8 },
  button: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#DDD', backgroundColor: '#FFF', alignItems: 'center' },
  primary: { backgroundColor: '#111', borderColor: '#111' },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.35 },
  buttonText: { fontSize: 16, color: '#111' },
  primaryText: { color: '#FFF', fontWeight: '600' },
});
