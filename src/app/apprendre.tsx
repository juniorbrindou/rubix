import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SOLVED, applyMove, applyMoves, invertMove, randomScramble, validate, type Move } from '@/cube';
import { CubeView } from '@/scene/CubeView';
import { STAGES, STAGE_LABEL, solve, stageDone, type SolutionStep } from '@/solver';
import { ActionButton, CubeStage, Dock, ScreenHeader } from '@/ui/components';
import { ModeTabs } from '@/ui/ModeTabs';
import { describeMove } from '@/ui/moveText';
import { InfoButton, StageGuideSheet } from '@/ui/StageGuideSheet';
import { GUTTER, color, font, radius, space } from '@/ui/theme';

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
  const [guideOpen, setGuideOpen] = useState(false);
  // L'étape en cours : celle de l'aide affichée, sinon la première pas encore finie.
  const stage = hint?.stage ?? STAGES.find((s) => !stageDone(state, s)) ?? 'solved';

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
    if (hint) return play(hint.move); // second appui : l'app joue le coup
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

  const count = `${history.length} coup${history.length > 1 ? 's' : ''}`;

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ModeTabs active="learn" onSelect={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
      <ScreenHeader
        eyebrow={count}
        title="Résolvez-le vous-même"
        titleAside={<InfoButton onPress={() => setGuideOpen(true)} />}
        subtitle={fromRealCube ? 'Votre cube, tel que saisi.' : 'Un cube mélangé au hasard.'}
      />

      <CubeStage>
        <CubeView state={state} animation={animation} durationMs={MOVE_MS} mode="turn" onTurn={play} hint={hint?.move ?? null} />
      </CubeStage>

      <View style={styles.panel}>
        {solved ? (
          <Text style={styles.done}>{history.length ? `Bravo, résolu en ${count} !` : 'Ce cube est déjà résolu.'}</Text>
        ) : hint ? (
          <View style={styles.hintRow}>
            <View style={styles.moveTile}>
              <Text style={styles.moveTileText} numberOfLines={1} adjustsFontSizeToFit>
                {hint.move}
              </Text>
            </View>
            <View style={styles.hintText}>
              <Text style={styles.stage}>
                {STAGE_LABEL[hint.stage]} · {hint.label}
              </Text>
              <Text style={styles.instruction}>{describeMove(hint.move)}</Text>
            </View>
          </View>
        ) : (
          <Text style={styles.note}>Un doigt sur une face la tourne, deux doigts tournent le cube. Besoin d’un coup de pouce ? Aide.</Text>
        )}
      </View>

      <Dock>
        <View style={styles.controls}>
          <ActionButton label="Annuler" onPress={undo} disabled={!history.length || !!pending} style={styles.side} />
          <ActionButton
            label={hint ? 'Jouer' : 'Aide'}
            sublabel={hint ? 'ou suivez la flèche' : undefined}
            onPress={help}
            disabled={solved || !!pending}
            variant="go"
            style={styles.main}
          />
          <ActionButton label="Mélanger" onPress={reshuffle} disabled={!!pending} style={styles.side} />
        </View>
      </Dock>
      <StageGuideSheet stage={stage} visible={guideOpen} onClose={() => setGuideOpen(false)} />
      <StatusBar style="dark" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.mat },
  panel: { minHeight: 76, paddingHorizontal: GUTTER, justifyContent: 'center', marginBottom: space.sm },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  moveTile: {
    width: 64,
    height: 64,
    borderRadius: radius.plate,
    backgroundColor: color.plate,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FF2D95', // la couleur de la flèche d'aide sur le cube
  },
  moveTileText: { fontFamily: font.display, fontSize: 26, color: color.onPlate },
  hintText: { flex: 1 },
  stage: { fontFamily: font.bodyBold, fontSize: 13, color: color.inkMute },
  instruction: { marginTop: 2, fontFamily: font.body, fontSize: 15, lineHeight: 20, color: color.ink },
  note: { fontFamily: font.body, fontSize: 15, lineHeight: 21, color: color.inkSoft, textAlign: 'center' },
  done: { fontFamily: font.display, fontSize: 18, color: color.ok, textAlign: 'center' },
  controls: { flexDirection: 'row', gap: space.sm },
  side: { flex: 1, paddingHorizontal: space.xs },
  main: { flex: 1 },
});
