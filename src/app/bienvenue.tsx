import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SOLVED, applyMove, applyMoves, invertMoves, parseMoves, type Move } from '@/cube';
import { markWelcomeSeen } from '@/onboarding';
import { CubeView, type CubeViewHandle } from '@/scene/CubeView';
import { GUTTER, color, font, radius, space } from '@/ui/theme';

/**
 * Bienvenue, au premier lancement : le vrai cube de l'app, mélangé, reçoit ses dernières couleurs du doigt,
 * puis on touche « Résoudre » et le cube tourne sous les yeux jusqu'à être résolu. En une quinzaine de secondes,
 * on a vu tout ce que fait l'app.
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

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export default function Welcome() {
  const cube = useRef<CubeViewHandle>(null);
  const [phase, setPhase] = useState<Phase>('copy');
  const [state, setState] = useState(() => {
    const a = [...MIXED];
    for (const f of MISSING) a[f] = '?';
    return a.join('');
  });
  const [queue, setQueue] = useState<Move[]>([]);
  const [spin, setSpin] = useState(false);
  const [stage, setStage] = useState({ x: 0, y: 0, side: 0, offX: 0, offY: 0 });
  const [button, setButton] = useState({ x: 0, y: 0, w: 0, h: 0 });

  const finger = useRef(new Animated.ValueXY({ x: 300, y: 900 })).current;
  const fingerOpacity = useRef(new Animated.Value(0)).current;
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
  const moveFinger = (x: number, y: number) =>
    run(Animated.timing(finger, { toValue: { x: x - 8, y: y + 6 }, duration: 480, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }));
  const tapRipple = () => {
    ripple.setValue(0);
    return run(Animated.timing(ripple, { toValue: 1, duration: 520, easing: Easing.out(Easing.quad), useNativeDriver: true }));
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

  // La démonstration se déroule une fois que le cube et le bouton ont leur place à l'écran.
  const ready = stage.side > 0 && button.w > 0;
  useEffect(() => {
    if (!ready) return;
    alive.current = true;
    (async () => {
      await wait(700);
      for (const f of MISSING) {
        const p = cube.current?.project(f);
        if (!alive.current) return;
        if (!p) continue;
        run(Animated.timing(fingerOpacity, { toValue: 1, duration: 200, useNativeDriver: true }));
        await moveFinger(stage.x + stage.offX + p.x, stage.y + stage.offY + p.y);
        tapRipple();
        setState((s) => s.slice(0, f) + MIXED[f] + s.slice(f + 1));
        await wait(260);
      }
      if (!alive.current) return;
      await changeCaption('press');
      await moveFinger(button.x + button.w / 2, button.y + button.h / 2);
      tapRipple();
      await run(Animated.sequence([
        Animated.timing(press, { toValue: 0.94, duration: 110, useNativeDriver: true }),
        Animated.timing(press, { toValue: 1, duration: 140, useNativeDriver: true }),
      ]));
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
        style={styles.bottom}
        onLayout={(e) => {
          const { x, y } = e.nativeEvent.layout;
          setButton((b) => ({ ...b, x: x + GUTTER, y: y + space.md }));
        }}
      >
        <Animated.View style={{ transform: [{ scale: press }] }}>
          <Pressable
            onPress={done ? finish : undefined}
            disabled={!done}
            onLayout={(e) => {
              const { width, height } = e.nativeEvent.layout;
              setButton((b) => ({ ...b, w: width, h: height }));
            }}
            style={({ pressed }) => [styles.button, pressed && { opacity: 0.85 }]}
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>{done ? 'Commencer' : 'Résoudre'}</Text>
          </Pressable>
        </Animated.View>
      </View>

      {/* Le doigt et l'onde du toucher, au-dessus de tout. */}
      <Animated.View
        pointerEvents="none"
        style={[styles.ripple, {
          transform: [...finger.getTranslateTransform(), { scale: ripple.interpolate({ inputRange: [0, 1], outputRange: [0.4, 2.6] }) }],
          opacity: ripple.interpolate({ inputRange: [0, 0.1, 1], outputRange: [0, 1, 0] }),
        }]}
      />
      <Animated.View pointerEvents="none" style={[styles.finger, { opacity: fingerOpacity, transform: [...finger.getTranslateTransform(), { rotate: '-25deg' }] }]}>
        <View style={styles.nail} />
      </Animated.View>
      <StatusBar style="light" />
    </SafeAreaView>
  );
}

const FINGER_W = 30;
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.plate },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: GUTTER + 4, paddingTop: space.md, minHeight: 44 },
  brand: { fontFamily: font.display, fontSize: 22, color: color.onPlate, letterSpacing: -0.4 },
  skip: { fontFamily: font.bodyBold, fontSize: 15, color: color.onPlateSoft },
  caption: { marginTop: space.lg, paddingHorizontal: GUTTER + 4, fontFamily: font.display, fontSize: 26, lineHeight: 32, color: color.onPlate, letterSpacing: -0.4 },
  captionDone: { color: color.go },
  stage: { flex: 1 },
  bottom: { paddingHorizontal: GUTTER, paddingTop: space.md, paddingBottom: space.xl },
  button: { height: 56, borderRadius: radius.plate, backgroundColor: color.go, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontFamily: font.bodyBold, fontSize: 18, color: color.ink },
  finger: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: FINGER_W,
    height: 64,
    borderRadius: FINGER_W / 2,
    backgroundColor: '#F4C9A8',
    borderWidth: 3,
    borderColor: '#000',
    transformOrigin: 'top',
  },
  nail: { marginTop: 4, marginLeft: 5, width: 14, height: 12, borderRadius: 6, backgroundColor: '#FBE3D2' },
  ripple: { position: 'absolute', left: -10, top: -16, width: 20, height: 20, borderRadius: 10, borderWidth: 3, borderColor: '#FF2D95' },
});
