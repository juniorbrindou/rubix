import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type ScrollViewInstance } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FACE_COLOR_PLURAL, faceOfFacelet, pieceFacelets } from '@/cube';
import {
  PRESET_STAGES,
  changeLevel,
  colorCounts,
  emptyInput,
  inputStatus,
  lockingStage,
  paint,
  paintRefusal,
} from '@/input/input';
import { CubeView } from '@/scene/CubeView';
import { STAGE_LABEL, solve } from '@/solver';
import { ActionButton, CubeStage, Dock, QuietButton, ScreenHeader } from '@/ui/components';
import { Palette, type Brush } from '@/ui/Palette';
import { GUTTER, color, font, radius, space } from '@/ui/theme';

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
    if (lock) return setHint(`Cette case est fixée par « ${STAGE_LABEL[lock]} ». Décochez l’étape pour la modifier.`);
    if (brush !== '?' && paintRefusal(state, facelet, brush, level) === 'full')
      return setHint(`Les 9 cases ${FACE_COLOR_PLURAL[brush]} sont déjà placées. Gommez-en une si elle est mal placée.`);
    setHint(null);
    setState((s) => paint(flushPending(s), facelet, brush, level));
  };

  const status = useMemo(() => inputStatus(state), [state]);
  const counts = colorCounts(state);
  const moves = useMemo(() => (status.kind === 'valid' ? solve(state).length : 0), [status, state]);

  const { message, tone, highlight, focus } = describe(status, state, level);

  const go = () => router.push({ pathname: '/solution', params: { state } });
  const sublabel =
    status.kind === 'valid'
      ? `${moves} mouvement${moves > 1 ? 's' : ''} jusqu’au cube résolu`
      : status.kind === 'incomplete'
        ? `Encore ${status.remaining} case${status.remaining > 1 ? 's' : ''} à colorier`
        : 'Corrigez d’abord l’erreur signalée';

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ScreenHeader
        top={
          <View style={styles.topRow}>
            <QuietButton
              label={status.kind === 'valid' ? 'Le résoudre moi-même ›' : 'Apprendre sur un cube mélangé ›'}
              onPress={() => router.push(status.kind === 'valid' ? { pathname: '/apprendre', params: { state } } : '/apprendre')}
            />
          </View>
        }
        title="Montrez-moi votre cube"
        subtitle="Jaune en haut, vert face à vous."
        aside={
          <QuietButton
            label="Tout effacer"
            onPress={() => {
              pending.current = [];
              setState(emptyInput());
              setLevel(0);
              setHint(null);
            }}
          />
        }
      />

      <Text style={styles.section}>Étapes déjà terminées</Text>
      <StageRail level={level} onToggle={toggleStage} />

      <CubeStage>
        <CubeView state={state} onFaceletPress={onFaceletPress} highlight={highlight} focus={focus} />
      </CubeStage>

      <Text style={[styles.message, styles[hint ? 'neutral' : tone]]} numberOfLines={3}>
        {hint ?? message}
      </Text>

      <Dock>
        <Palette brush={brush} onChange={setBrush} counts={counts} />
        <ActionButton label="Voir la solution" sublabel={sublabel} variant="go" disabled={status.kind !== 'valid'} onPress={go} />
      </Dock>
      <StatusBar style="dark" />
    </SafeAreaView>
  );
}

/**
 * Les étapes de la méthode, dans l'ordre : cocher une étape coche les précédentes. Le rail défile seul pour
 * garder la dernière étape cochée en vue.
 */
function StageRail({ level, onToggle }: { level: number; onToggle: (index: number) => void }) {
  const rail = useRef<ScrollViewInstance>(null);
  const x = useRef<number[]>([]);
  useEffect(() => {
    const target = x.current[Math.max(0, level - 1)];
    if (target !== undefined) rail.current?.scrollTo({ x: Math.max(0, target - 40), animated: true });
  }, [level]);
  return (
    <ScrollView ref={rail} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail} style={styles.railBox}>
      {PRESET_STAGES.map((stage, i) => {
        const on = i < level;
        return (
          <Pressable
            key={stage}
            onPress={() => onToggle(i)}
            onLayout={(e) => (x.current[i] = e.nativeEvent.layout.x)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: on }}
            accessibilityLabel={`Étape ${i + 1} : ${STAGE_LABEL[stage]}`}
            style={({ pressed }) => [styles.stage, on && styles.stageOn, pressed && { opacity: 0.8 }]}
          >
            <View style={[styles.stageMark, on && styles.stageMarkOn]}>
              <Text style={[styles.stageNum, on && styles.stageNumOn]}>{on ? '✓' : i + 1}</Text>
            </View>
            <Text style={[styles.stageText, on && styles.stageTextOn]}>{STAGE_LABEL[stage]}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function describe(status: ReturnType<typeof inputStatus>, state: string, level: number) {
  switch (status.kind) {
    case 'incomplete':
      return {
        message: 'Choisissez une couleur, puis touchez les cases grises.',
        tone: 'neutral' as const,
        highlight: [] as number[],
        focus: null,
      };
    case 'tooMany': {
      // Les cases fixées par une étape cochée sont justes : seules celles coloriées à la main sont suspectes.
      const cells = [...state].flatMap((c, i) => (c === status.face && !lockingStage(i, level) ? [i] : []));
      return {
        message: `Il y a ${status.count} cases ${FACE_COLOR_PLURAL[status.face]}, il en faut 9 : une de celles entourées est fausse.`,
        tone: 'error' as const,
        highlight: cells,
        focus: cells[0] ?? status.facelet,
      };
    }
    case 'invalid': {
      const f = status.validation.facelet;
      return {
        message: f === null ? status.validation.message : `${status.validation.message} Vérifiez la pièce entourée.`,
        tone: 'error' as const,
        highlight: f === null ? [] : pieceFacelets(f),
        focus: f,
      };
    }
    case 'valid':
      return {
        message: 'Cube valide : la solution est prête.',
        tone: 'ok' as const,
        highlight: [] as number[],
        focus: null,
      };
  }
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 2 },
  screen: { flex: 1, backgroundColor: color.mat },
  section: {
    marginTop: space.md,
    paddingHorizontal: GUTTER,
    fontFamily: font.displayMedium,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: color.inkMute,
  },
  railBox: { flexGrow: 0 },
  rail: { gap: space.sm, paddingHorizontal: GUTTER, paddingTop: space.sm, paddingBottom: space.xs },
  stage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingVertical: 7,
    paddingLeft: 7,
    paddingRight: space.md,
    borderRadius: radius.chip,
    borderWidth: 1.5,
    borderColor: color.line,
    backgroundColor: color.card,
  },
  stageOn: { backgroundColor: color.plate, borderColor: color.plate },
  stageMark: {
    width: 22,
    height: 22,
    borderRadius: radius.sticker,
    borderWidth: 1.5,
    borderColor: color.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageMarkOn: { backgroundColor: color.go, borderColor: color.go },
  stageNum: { fontFamily: font.displayMedium, fontSize: 11, color: color.inkMute },
  stageNumOn: { color: color.ink },
  stageText: { fontFamily: font.bodyBold, fontSize: 14, color: color.ink },
  stageTextOn: { color: color.onPlate },
  message: {
    minHeight: 44,
    paddingHorizontal: GUTTER,
    paddingVertical: space.xs,
    fontFamily: font.body,
    fontSize: 15,
    lineHeight: 20,
    textAlign: 'center',
  },
  neutral: { color: color.inkSoft },
  error: { color: color.error, fontFamily: font.bodyBold },
  ok: { color: color.ok, fontFamily: font.bodyBold },
});
