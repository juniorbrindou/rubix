import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  FACE_COLOR_NAME,
  SOLVED,
  applyMove,
  applyMoves,
  faceOfFacelet,
  formatMoves,
  parseMoves,
  randomScramble,
  type Move,
} from '@/cube';
import { CubeView } from '@/scene/CubeView';
import { solve } from '@/solver';

// Écran de démonstration de la phase 3 : animation, toucher d'une facette, temps du solveur sur le téléphone.
// Il sera remplacé par l'écran de saisie en phase 4.

const DEMO = parseMoves("R U R' U'");

export default function Home() {
  const [state, setState] = useState(SOLVED);
  const [queue, setQueue] = useState<Move[]>([]);
  const [speed, setSpeed] = useState(300);
  const [touched, setTouched] = useState<number | null>(null);
  const [info, setInfo] = useState('Glisse le doigt pour tourner le cube, touche une case pour la repérer.');

  const animation = useMemo(
    () =>
      queue.length
        ? {
            move: queue[0],
            onDone: () => {
              setState((s) => applyMove(s, queue[0]));
              setQueue((q) => q.slice(1));
            },
          }
        : null,
    [queue],
  );
  const busy = queue.length > 0;

  const play = (moves: Move[], ms: number) => {
    setSpeed(ms);
    setQueue(moves);
  };

  const scramble = () => {
    const moves = randomScramble(25);
    setState(applyMoves(SOLVED, moves));
    setInfo(`Mélange : ${formatMoves(moves)}`);
  };

  const solveIt = () => {
    const t = performance.now();
    const steps = solve(state);
    const ms = performance.now() - t;
    setInfo(`Solveur : ${steps.length} mouvements calculés en ${ms.toFixed(1)} ms.`);
    play(
      steps.map((s) => s.move),
      90,
    );
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Rubix</Text>
        <Text style={styles.moves}>{busy ? `En cours : ${queue[0]} (reste ${queue.length})` : ' '}</Text>
        <CubeView
          state={state}
          animation={animation}
          durationMs={speed}
          highlight={touched}
          onFaceletPress={(f) => {
            setTouched(f);
            setInfo(`Case ${f} : face ${faceOfFacelet(f)}, couleur ${FACE_COLOR_NAME[state[f] as keyof typeof FACE_COLOR_NAME] ?? 'inconnue'}.`);
          }}
        />
        <Text style={styles.info}>{info}</Text>
        <View style={styles.buttons}>
          <Button label={formatMoves(DEMO)} onPress={() => play(DEMO, 300)} disabled={busy} />
          <Button label="Mélanger" onPress={scramble} disabled={busy} />
          <Button label="Résoudre" onPress={solveIt} disabled={busy || state === SOLVED} />
          <Button
            label="Remettre à zéro"
            onPress={() => {
              setState(SOLVED);
              setTouched(null);
            }}
            disabled={busy}
          />
        </View>
      </ScrollView>
      <StatusBar style="dark" />
    </SafeAreaView>
  );
}

function Button({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.button, pressed && styles.pressed, disabled && styles.disabled]}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FAFAF7' },
  content: { paddingHorizontal: 16, paddingVertical: 12, alignItems: 'stretch' },
  title: { fontSize: 28, fontWeight: '700', textAlign: 'center' },
  moves: { marginTop: 4, fontSize: 16, textAlign: 'center', color: '#333', fontVariant: ['tabular-nums'] },
  info: { marginTop: 8, fontSize: 15, textAlign: 'center', color: '#444', minHeight: 44 },
  buttons: { marginTop: 8, flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  button: {
    flexGrow: 1,
    flexBasis: '45%',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDD',
    backgroundColor: '#FFF',
    alignItems: 'center',
  },
  pressed: { backgroundColor: '#EEE' },
  disabled: { opacity: 0.4 },
  buttonText: { fontSize: 16, color: '#111' },
});
