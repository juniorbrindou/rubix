import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SOLVED, applyMove, applyMoves, invertMoves, parseMoves, type Face, type Move } from '@/cube';
import { colorCounts } from '@/input/input';
import { markWelcomeSeen } from '@/onboarding';
import { CubeView, type CubeViewHandle } from '@/scene/CubeView';
import { Palette, type Brush } from '@/ui/Palette';
import { GUTTER, color, font, radius, space } from '@/ui/theme';

/**
 * Bienvenue, au premier lancement : le vrai cube de l'app, mélangé, reçoit ses dernières couleurs comme dans la
 * saisie (le doigt choisit la couleur dans la palette, puis touche la case), puis on touche « Résoudre » et le cube
 * tourne sous les yeux jusqu'à être résolu. En une quinzaine de secondes, on a vu tout ce que fait l'app.
 */

const SCRAMBLE = parseMoves("R U F' L2 D B' R2 U'");
const MIXED = applyMoves(SOLVED, SCRAMBLE);
/** Cases encore grises au départ, toutes visibles dans la vue de départ. */
const MISSING = [19, 6, 14, 24];
const SOLVE = invertMoves(SCRAMBLE);

type Phase = 'copy' | 'press' | 'solve' | 'done';
const CAPTION: Record<Phase, string> = {
  copy: 'Recopiez les couleurs de votre cube.',
  press: 'Touchez « Résoudre ».',
  solve: 'Il se résout sous vos yeux.',
  done: 'Le coach de votre Rubik’s Cube',
};

type Rect = { x: number; y: number; width: number; height: number };
const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Bout du doigt : le dessin du doigt (30 × 64, penché) est placé pour que son bout tombe exactement sur la cible. */
const TIP = { x: 15, y: 2 };
const FINGER_ANGLE = '-25deg';

export default function Welcome() {
  const cube = useRef<CubeViewHandle>(null);
  const [phase, setPhase] = useState<Phase>('copy');
  const [state, setState] = useState(() => {
    const a = [...MIXED];
    for (const f of MISSING) a[f] = '?';
    return a.join('');
  });
  const [brush, setBrush] = useState<Brush>('U');
  const [queue, setQueue] = useState<Move[]>([]);
  const [spin, setSpin] = useState(false);
  const [stage, setStage] = useState({ x: 0, y: 0, side: 0, offX: 0, offY: 0 });
  // Positions mesurées à l'écran (dans la vue racine) : palette, bouton.
  const dock = useRef({ x: 0, y: 0 });
  const paletteRow = useRef({ x: 0, y: 0 });
  const swatches = useRef<Partial<Record<Brush, Rect>>>({});
  const [button, setButton] = useState<Rect | null>(null);
  const [paletteReady, setPaletteReady] = useState(false);

  /** Point visé par le bout du doigt (coordonnées de la vue racine). */
  const tip = useRef(new Animated.ValueXY({ x: 330, y: 900 })).current;
  const fingerOpacity = useRef(new Animated.Value(0)).current;
  const fingerPress = useRef(new Animated.Value(1)).current;
  const ripple = useRef(new Animated.Value(0)).current;
  const press = useRef(new Animated.Value(1)).current;
  const title = useRef(new Animated.Value(0)).current;
  const caption = useRef(new Animated.Value(1)).current;
  const alive = useRef(true);

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

  const run = (a: Animated.CompositeAnimation) => new Promise<void>((r) => a.start(() => r()));
  const moveTo = (x: number, y: number, ms = 460) =>
    run(Animated.timing(tip, { toValue: { x, y }, duration: ms, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }));
  /** Le doigt appuie (il s'écrase un peu) et une onde part du point touché. */
  const touch = async () => {
    ripple.setValue(0);
    Animated.timing(ripple, { toValue: 1, duration: 520, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
    await run(Animated.sequence([
      Animated.timing(fingerPress, { toValue: 0.88, duration: 90, useNativeDriver: true }),
      Animated.timing(fingerPress, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]));
  };
  const changeCaption = async (p: Phase) => {
    await run(Animated.timing(caption, { toValue: 0, duration: 160, useNativeDriver: true }));
    setPhase(p);
    await run(Animated.timing(caption, { toValue: 1, duration: 220, useNativeDriver: true }));
  };

  const finish = () => {
    alive.current = false;
    markWelcomeSeen();
    router.replace('/');
  };

  /** Centre d'une pastille de la palette (le carré de couleur, pas son compteur). */
  const swatchCenter = (b: Brush) => {
    const r = swatches.current[b];
    if (!r) return null;
    return { x: dock.current.x + paletteRow.current.x + r.x + r.width / 2, y: dock.current.y + paletteRow.current.y + r.y + SWATCH_CENTER_Y };
  };

  // La démonstration se lance une fois que le cube, la palette et le bouton ont leur place à l'écran.
  const ready = stage.side > 0 && paletteReady && !!button;
  useEffect(() => {
    if (!ready) return;
    alive.current = true;
    (async () => {
      await wait(700);
      run(Animated.timing(fingerOpacity, { toValue: 1, duration: 250, useNativeDriver: true }));
      for (const f of MISSING) {
        if (!alive.current) return;
        const c = MIXED[f] as Face;
        const s = swatchCenter(c);
        if (s) {
          await moveTo(s.x, s.y);
          await touch();
          setBrush(c);
          await wait(120);
        }
        const p = cube.current?.project(f);
        if (!p) continue;
        await moveTo(stage.x + stage.offX + p.x, stage.y + stage.offY + p.y);
        await touch();
        setState((st) => st.slice(0, f) + MIXED[f] + st.slice(f + 1));
        await wait(220);
      }
      if (!alive.current || !button) return;
      await changeCaption('press');
      await moveTo(dock.current.x + button.x + button.width / 2, dock.current.y + button.y + button.height / 2);
      await Promise.all([
        touch(),
        run(Animated.sequence([
          Animated.timing(press, { toValue: 0.95, duration: 100, useNativeDriver: true }),
          Animated.timing(press, { toValue: 1, duration: 140, useNativeDriver: true }),
        ])),
      ]);
      run(Animated.timing(fingerOpacity, { toValue: 0, duration: 250, useNativeDriver: true }));
      if (!alive.current) return;
      changeCaption('solve');
      setSpin(true);
      setQueue(SOLVE);
    })();
    return () => {
      alive.current = false;
    };
    // La démonstration ne se lance qu'une fois, quand tout est en place.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // Fin de la résolution : le cube revient de face, le nom apparaît.
  useEffect(() => {
    if (phase !== 'solve' || queue.length) return;
    setSpin(false);
    (async () => {
      await wait(600);
      if (!alive.current) return;
      await changeCaption('done');
      run(Animated.timing(title, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue.length, phase]);

  const done = phase === 'done';
  const counts = colorCounts(state);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.top}>
        <Animated.View style={{ opacity: title, transform: [{ translateY: title.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }}>
          <Text style={styles.brand}>Rubix Coach</Text>
        </Animated.View>
        {!done && (
          <Pressable onPress={finish} hitSlop={12} accessibilityRole="button">
            <Text style={styles.skip}>Passer</Text>
          </Pressable>
        )}
      </View>

      <Animated.Text style={[styles.caption, done && styles.captionDone, { opacity: caption }]}>{CAPTION[phase]}</Animated.Text>

      <View
        style={styles.stage}
        onLayout={(e) => {
          const { x, y, width, height } = e.nativeEvent.layout;
          const side = Math.floor(Math.min(width, height));
          setStage({ x, y, side, offX: (width - side) / 2, offY: (height - side) / 2 });
        }}
      >
        {stage.side > 0 && (
          <View style={{ width: stage.side, height: stage.side }}>
            <CubeView ref={cube} state={state} animation={animation} durationMs={300} spin={spin} interactive={false} showRecenter={false} />
          </View>
        )}
      </View>

      <View
        style={styles.dock}
        onLayout={(e) => {
          dock.current = { x: e.nativeEvent.layout.x, y: e.nativeEvent.layout.y };
        }}
      >
        {!done && (
          <View
            pointerEvents="none"
            onLayout={(e) => {
              paletteRow.current = { x: e.nativeEvent.layout.x, y: e.nativeEvent.layout.y };
            }}
          >
            <Palette
              brush={brush}
              onChange={() => {}}
              counts={counts}
              onSwatchLayout={(b, r) => {
                swatches.current[b] = r;
                if (Object.keys(swatches.current).length === 7) setPaletteReady(true);
              }}
            />
          </View>
        )}
        <Animated.View
          style={{ transform: [{ scale: press }] }}
          onLayout={(e) => {
            const { x, y, width, height } = e.nativeEvent.layout;
            setButton({ x, y, width, height }); // relatif au plateau : on ajoute sa position au moment de viser
          }}
        >
          <Pressable
            onPress={done ? finish : undefined}
            disabled={!done}
            style={({ pressed }) => [styles.button, pressed && { opacity: 0.85 }]}
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>{done ? 'Commencer' : 'Résoudre'}</Text>
          </Pressable>
        </Animated.View>
      </View>

      {/* L'onde du toucher, centrée sur le point visé, puis le doigt, dont le bout tombe sur ce point. */}
      <Animated.View
        pointerEvents="none"
        style={[styles.ripple, {
          transform: [
            { translateX: Animated.add(tip.x, -RIPPLE / 2) },
            { translateY: Animated.add(tip.y, -RIPPLE / 2) },
            { scale: ripple.interpolate({ inputRange: [0, 1], outputRange: [0.4, 2.4] }) },
          ],
          opacity: ripple.interpolate({ inputRange: [0, 0.1, 1], outputRange: [0, 1, 0] }),
        }]}
      />
      <Animated.View
        pointerEvents="none"
        style={[styles.finger, {
          opacity: fingerOpacity,
          transform: [
            { translateX: Animated.add(tip.x, -TIP.x) },
            { translateY: Animated.add(tip.y, -TIP.y) },
            { rotate: FINGER_ANGLE },
            { scale: fingerPress },
          ],
        }]}
      >
        <View style={styles.nail} />
      </Animated.View>
      <StatusBar style="light" />
    </SafeAreaView>
  );
}

/** Centre vertical du carré de couleur dans une pastille de la palette (anneau : bord 2 + marge 2 + carré 38). */
const SWATCH_CENTER_Y = 23;
const RIPPLE = 22;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.plate },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: GUTTER + 4, paddingTop: space.md, minHeight: 44 },
  brand: { fontFamily: font.display, fontSize: 22, color: color.onPlate, letterSpacing: -0.4 },
  skip: { fontFamily: font.bodyBold, fontSize: 15, color: color.onPlateSoft },
  caption: { marginTop: space.md, paddingHorizontal: GUTTER + 4, fontFamily: font.display, fontSize: 26, lineHeight: 32, color: color.onPlate, letterSpacing: -0.4 },
  captionDone: { color: color.go },
  // Le carré du cube est centré dans sa zone : `offX` / `offY` le supposent pour viser les cases.
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  dock: {
    backgroundColor: color.plateRaised,
    borderTopLeftRadius: radius.dock,
    borderTopRightRadius: radius.dock,
    paddingHorizontal: space.md,
    paddingTop: space.md,
    paddingBottom: space.xl,
    gap: space.md,
  },
  button: { height: 56, borderRadius: radius.plate, backgroundColor: color.go, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontFamily: font.bodyBold, fontSize: 18, color: color.ink },
  finger: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 30,
    height: 64,
    borderRadius: 15,
    backgroundColor: '#F4C9A8',
    borderWidth: 3,
    borderColor: '#000',
    // Rotation et écrasement autour du bout du doigt : le bout reste sur la cible.
    transformOrigin: `${TIP.x}px ${TIP.y}px`,
  },
  nail: { marginTop: 4, marginLeft: 5, width: 14, height: 12, borderRadius: 6, backgroundColor: '#FBE3D2' },
  ripple: { position: 'absolute', left: 0, top: 0, width: RIPPLE, height: RIPPLE, borderRadius: RIPPLE / 2, borderWidth: 3, borderColor: '#FF2D95' },
});
