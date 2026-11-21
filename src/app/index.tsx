import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FACES, FACE_COLOR_NAME, UNKNOWN, faceOfFacelet, pieceFacelets, type Face } from '@/cube';
import {
  PRESET_STAGES,
  changeLevel,
  colorCounts,
  emptyInput,
  inputStatus,
  lockingStage,
  paint,
} from '@/input/input';
import { CubeView } from '@/scene/CubeView';
import { STICKER_COLOR } from '@/scene/cubies';
import { STAGE_LABEL, solve } from '@/solver';

type Brush = Face | typeof UNKNOWN;

const FILL_INTERVAL_MS = 30;

export default function InputScreen() {
  const [state, setState] = useState(emptyInput);
  const [level, setLevel] = useState(0);
  const [brush, setBrush] = useState<Brush>('U');
  const [hint, setHint] = useState<string | null>(null);
  const pending = useRef<number[]>([]);

  // Les cases d'une étape cochée se colorent une à une, pour qu'on voie l'étape se mettre en place.
  useEffect(() => {
    const id = setInterval(() => {
      const next = pending.current.splice(0, 2);
      if (!next.length) return;
      setState((s) => {
        const a = [...s];
        for (const f of next) a[f] = faceOfFacelet(f);
        return a.join('');
      });
    }, FILL_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  const flushPending = (s: string) => {
    const a = [...s];
    for (const f of pending.current.splice(0)) a[f] = faceOfFacelet(f);
    return a.join('');
  };

  const toggleStage = (index: number) => {
    const to = index + 1 === level ? index : index + 1;
    setHint(null);
    setState((s) => {
      const current = flushPending(s);
      const { state: next, filled } = changeLevel(current, level, to);
      if (to < level) return next;
      pending.current = filled;
      return current; // l'intervalle colorie les cases une à une
    });
    setLevel(to);
  };

  const onFaceletPress = (facelet: number) => {
    const lock = lockingStage(facelet, level);
    if (lock === 'center') return setHint('Les centres ne bougent jamais : leur couleur est déjà connue.');
    if (lock) return setHint(`Cette case est fixée par « ${STAGE_LABEL[lock]} ». Décoche l’étape pour la changer.`);
    setHint(null);
    setState((s) => paint(flushPending(s), facelet, brush, level));
  };

  const status = useMemo(() => inputStatus(state), [state]);
  const counts = colorCounts(state);
  const moves = useMemo(() => (status.kind === 'valid' ? solve(state).length : 0), [status, state]);

  const { message, tone, highlight, focus } = describe(status, state, level, moves);

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Montre-moi ton cube</Text>
        <Text style={styles.subtitle}>Tiens-le jaune en haut, vert face à toi.</Text>

        <CubeView state={state} onFaceletPress={onFaceletPress} highlight={highlight} focus={focus} />

        <View style={styles.palette}>
          {[...FACES, UNKNOWN].map((c) => (
            <Pressable
              key={c}
              onPress={() => setBrush(c as Brush)}
              style={[styles.swatchWrap, brush === c && styles.swatchSelected]}
              accessibilityLabel={c === UNKNOWN ? 'Gomme' : FACE_COLOR_NAME[c as Face]}
            >
              <View style={[styles.swatch, { backgroundColor: STICKER_COLOR[c] }, c === 'D' && styles.swatchWhite]}>
                {c === UNKNOWN && <Text style={styles.eraser}>⌫</Text>}
              </View>
              <Text style={[styles.count, c !== UNKNOWN && counts[c as Face] > 9 && styles.countOver]}>
                {c === UNKNOWN ? counts[UNKNOWN] : `${counts[c as Face]}/9`}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.message, styles[tone]]}>{hint ?? message}</Text>

        <Text style={styles.section}>Ce que tu as déjà fini</Text>
        <View style={styles.stages}>
          {PRESET_STAGES.map((stage, i) => {
            const on = i < level;
            return (
              <Pressable key={stage} onPress={() => toggleStage(i)} style={[styles.stage, on && styles.stageOn]}>
                <Text style={[styles.stageText, on && styles.stageTextOn]}>
                  {on ? '✓ ' : ''}
                  {STAGE_LABEL[stage]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          onPress={() => {
            pending.current = [];
            setState(emptyInput());
            setLevel(0);
            setHint(null);
          }}
          style={styles.reset}
        >
          <Text style={styles.resetText}>Tout effacer</Text>
        </Pressable>
      </ScrollView>
      <StatusBar style="dark" />
    </SafeAreaView>
  );
}

function describe(status: ReturnType<typeof inputStatus>, state: string, level: number, moves: number) {
  switch (status.kind) {
    case 'incomplete':
      return {
        message: `Choisis une couleur, puis touche les cases. Encore ${status.remaining} case${status.remaining > 1 ? 's' : ''} à colorier.`,
        tone: 'neutral' as const,
        highlight: [] as number[],
        focus: null,
      };
    case 'tooMany': {
      // Les cases fixées par une étape cochée sont justes : seules celles coloriées à la main sont suspectes.
      const cells = [...state].flatMap((c, i) => (c === status.face && !lockingStage(i, level) ? [i] : []));
      return {
        message: `Il y a ${status.count} cases ${FACE_COLOR_NAME[status.face]}, il en faut 9 : une de celles entourées est fausse.`,
        tone: 'error' as const,
        highlight: cells,
        focus: cells[0] ?? status.facelet,
      };
    }
    case 'invalid': {
      const f = status.validation.facelet;
      return {
        message: f === null ? status.validation.message : `${status.validation.message} Vérifie la pièce entourée.`,
        tone: 'error' as const,
        highlight: f === null ? [] : pieceFacelets(f),
        focus: f,
      };
    }
    case 'valid':
      return {
        message: `Ton cube est bon. Il se résout en ${moves} mouvements.`,
        tone: 'ok' as const,
        highlight: [] as number[],
        focus: null,
      };
  }
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FAFAF7' },
  content: { paddingHorizontal: 16, paddingVertical: 12 },
  title: { fontSize: 24, fontWeight: '700', textAlign: 'center' },
  subtitle: { marginTop: 2, fontSize: 15, textAlign: 'center', color: '#555' },
  palette: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  swatchWrap: { alignItems: 'center', padding: 3, borderRadius: 12, borderWidth: 2, borderColor: 'transparent' },
  swatchSelected: { borderColor: '#111' },
  swatch: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  swatchWhite: { borderWidth: 1, borderColor: '#CCC' },
  eraser: { fontSize: 18, color: '#FFF' },
  count: { marginTop: 2, fontSize: 12, color: '#555', fontVariant: ['tabular-nums'] },
  countOver: { color: '#C62828', fontWeight: '700' },
  message: { marginTop: 10, fontSize: 15, textAlign: 'center', minHeight: 40 },
  neutral: { color: '#444' },
  error: { color: '#C62828' },
  ok: { color: '#1B7F3B', fontWeight: '600' },
  section: { marginTop: 14, fontSize: 15, fontWeight: '600', color: '#222' },
  stages: { marginTop: 8, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stage: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: '#CCC', backgroundColor: '#FFF' },
  stageOn: { backgroundColor: '#111', borderColor: '#111' },
  stageText: { fontSize: 14, color: '#222' },
  stageTextOn: { color: '#FFF' },
  reset: { marginTop: 18, alignSelf: 'center', paddingVertical: 10, paddingHorizontal: 18 },
  resetText: { fontSize: 15, color: '#666', textDecorationLine: 'underline' },
});
