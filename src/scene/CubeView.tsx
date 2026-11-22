import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, Pressable, StyleSheet, Text, View, type GestureResponderEvent } from 'react-native';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { FACELET_GEOMETRY, faceletAt, moveTurn, type CubeState, type Move, type Vec3 } from '../cube';
import { mark, markHealthy } from '../diagnostics';
import { BODY_COLOR, STICKER_COLOR, cubiesOf, type Cubie } from './cubies';
import { Canvas, useFrame, useThree } from './fiber';
import { inPlaneAxes, moveFromSwipe } from './swipe';

export interface CubeAnimation {
  move: Move;
  /** Appelé une fois, quand la couche a fini de tourner. Le parent applique alors le mouvement à `state`. */
  onDone: () => void;
}

export interface CubeViewProps {
  state: CubeState;
  /** Mouvement en cours d'animation, joué sur `state`. */
  animation?: CubeAnimation | null;
  /** Durée d'un quart de tour, en millisecondes. */
  durationMs?: number;
  /**
   * Ce que fait un doigt : `paint` (défaut) — toucher désigne une case, glisser tourne le cube ;
   * `turn` — glisser sur une case tourne la couche qui la porte. Deux doigts tournent toujours le cube.
   */
  mode?: 'paint' | 'turn';
  onFaceletPress?: (facelet: number) => void;
  /** Mode `turn` : l'utilisateur a tourné une couche du doigt. Le parent l'anime puis l'applique. */
  onTurn?: (move: Move) => void;
  /** Facettes à faire ressortir (cadre blanc). */
  highlight?: readonly number[];
  /** Quand elle change, le cube tourne pour montrer cette facette de face. */
  focus?: number | null;
  /** Mouvement à montrer par une flèche sur sa face (aide). */
  hint?: Move | null;
}

// --- Point de vue : orbite (lacet autour de la verticale, tangage borné), jamais de roulis ---

const VIEW = { yaw: -0.65, pitch: 0.5 }; // jaune en haut, vert devant, orange à droite
const PITCH_LIMIT = 1.45;
const DRAG_SPEED = 0.011;
const TAP_SLOP = 8;
const SWIPE_MIN = 14;

/** Point de vue qui montre une face comme la vue de départ montre F. */
function viewFacing(normal: Vec3): { yaw: number; pitch: number } {
  const key = normal.join(',');
  const yawOffset: Record<string, number> = { '0,0,1': 0, '1,0,0': -Math.PI / 2, '0,0,-1': Math.PI, '-1,0,0': Math.PI / 2 };
  if (key in yawOffset) return { yaw: VIEW.yaw + yawOffset[key], pitch: VIEW.pitch };
  return { yaw: VIEW.yaw, pitch: key === '0,1,0' ? PITCH_LIMIT : VIEW.pitch - Math.PI / 2 };
}

const wrapAngle = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
const clampPitch = (p: number) => Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, p));

interface ViewState {
  yaw: number;
  pitch: number;
  target: { yaw: number; pitch: number } | null;
}

// --- Géométries et matériaux partagés ---

const STICKER_SIZE = 0.86;
const AXES = ['x', 'y', 'z'] as const;

function roundedSquare(size: number, radius: number): THREE.ShapeGeometry {
  const h = size / 2;
  const s = new THREE.Shape();
  s.moveTo(-h + radius, -h);
  s.lineTo(h - radius, -h);
  s.quadraticCurveTo(h, -h, h, -h + radius);
  s.lineTo(h, h - radius);
  s.quadraticCurveTo(h, h, h - radius, h);
  s.lineTo(-h + radius, h);
  s.quadraticCurveTo(-h, h, -h, h - radius);
  s.lineTo(-h, -h + radius);
  s.quadraticCurveTo(-h, -h, -h + radius, -h);
  return new THREE.ShapeGeometry(s, 6);
}

const GEOMETRY = {
  body: new RoundedBoxGeometry(0.98, 0.98, 0.98, 3, 0.09),
  sticker: roundedSquare(STICKER_SIZE, 0.13),
  frame: roundedSquare(STICKER_SIZE + 0.12, 0.17),
};

const MATERIAL = {
  body: new THREE.MeshStandardMaterial({ color: BODY_COLOR, roughness: 0.55, metalness: 0.1 }),
  frame: new THREE.MeshBasicMaterial({ color: '#FFFFFF' }),
  hint: new THREE.MeshBasicMaterial({ color: '#FF2D95' }),
  sticker: Object.fromEntries(
    Object.entries(STICKER_COLOR).map(([k, c]) => [
      k,
      // Une part d'émission garde les couleurs franches sur les faces peu éclairées (le blanc ne vire pas au gris).
      new THREE.MeshStandardMaterial({ color: c, roughness: 0.35, emissive: c, emissiveIntensity: 0.28 }),
    ]),
  ) as Record<string, THREE.MeshStandardMaterial>,
};

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function faceRotation(normal: Vec3): THREE.Euler {
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(...normal));
  return new THREE.Euler().setFromQuaternion(q);
}

function StickerMesh({ normal, color, facelet, highlighted }: { normal: Vec3; color: string; facelet: number; highlighted: boolean }) {
  const rotation = useMemo(() => faceRotation(normal), [normal]);
  const o = 0.492;
  return (
    <group position={[normal[0] * o, normal[1] * o, normal[2] * o]} rotation={rotation}>
      {highlighted && <mesh geometry={GEOMETRY.frame} material={MATERIAL.frame} position={[0, 0, 0.004]} />}
      <mesh
        geometry={GEOMETRY.sticker}
        material={MATERIAL.sticker[color] ?? MATERIAL.sticker['?']}
        position={[0, 0, 0.008]}
        userData={{ facelet }}
      />
    </group>
  );
}

function CubieMesh({ cubie, highlight }: { cubie: Cubie; highlight: readonly number[] }) {
  return (
    <group position={cubie.position as [number, number, number]}>
      <mesh geometry={GEOMETRY.body} material={MATERIAL.body} userData={{ cubie: cubie.position }} />
      {cubie.stickers.map((s) => (
        <StickerMesh key={s.facelet} {...s} highlighted={highlight.includes(s.facelet)} />
      ))}
    </group>
  );
}

/** Flèche courbe posée sur la face du mouvement, dans son sens de rotation (deux pointes pour un demi-tour). */
function HintArrow({ move }: { move: Move }) {
  const { axis, layer, angle } = moveTurn(move);
  const normal = [0, 0, 0].map((_, i) => (i === axis ? layer : 0)) as unknown as Vec3;
  const rotation = useMemo(() => faceRotation(normal), [normal.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps
  const half = Math.abs(angle) > Math.PI / 2;
  const counterClockwise = angle * layer > 0; // vu de l'extérieur de la face
  // Arc de trois quarts de tour, centré sur la face, ouvert vers le bas.
  const arc = Math.PI * 1.5;
  const start = -Math.PI / 2 + (2 * Math.PI - arc) / 2;
  const radius = 0.95;
  const head = (theta: number, forward: boolean) => {
    const tangent = forward ? [-Math.sin(theta), Math.cos(theta)] : [Math.sin(theta), -Math.cos(theta)];
    return (
      <mesh
        key={`${theta}${forward}`}
        position={[radius * Math.cos(theta), radius * Math.sin(theta), 0]}
        rotation={[0, 0, Math.atan2(tangent[1], tangent[0]) - Math.PI / 2]}
        material={MATERIAL.hint}
      >
        <coneGeometry args={[0.2, 0.36, 16]} />
      </mesh>
    );
  };
  const o = 1.56;
  return (
    <group position={[normal[0] * o, normal[1] * o, normal[2] * o]} rotation={rotation}>
      <mesh rotation={[0, 0, start]} material={MATERIAL.hint}>
        <torusGeometry args={[radius, 0.075, 8, 48, arc]} />
      </mesh>
      {(counterClockwise || half) && head(start + arc, true)}
      {(!counterClockwise || half) && head(start, false)}
    </group>
  );
}

/**
 * Facette désignée par le premier objet touché. Un doigt tombe souvent dans le joint noir entre deux cases :
 * on prend alors la case de la face du corps touchée.
 */
function faceletOfHit(hit: THREE.Intersection | undefined): number | null {
  if (!hit) return null;
  const { facelet, cubie } = hit.object.userData as { facelet?: number; cubie?: Vec3 };
  if (facelet !== undefined) return facelet;
  if (!cubie || !hit.face) return null;
  const n = hit.face.normal;
  const normal: Vec3 = [Math.round(n.x) + 0, Math.round(n.y) + 0, Math.round(n.z) + 0];
  if (Math.abs(normal[0]) + Math.abs(normal[1]) + Math.abs(normal[2]) !== 1) return null; // arrondi du coin
  try {
    return faceletAt(cubie, normal);
  } catch {
    return null; // face intérieure : pas de facette
  }
}

interface SceneHandle {
  camera: THREE.Camera;
  root: THREE.Object3D;
  /** Demande une image : la scène se redessine même si la boucle d'affichage s'est arrêtée. */
  invalidate: () => void;
}

const VIEW_EULER = new THREE.Euler(0, 0, 0, 'XYZ');

/** Tangage puis lacet : le haut du cube reste en haut, sans roulis accumulé. */
function applyView(root: THREE.Object3D, view: ViewState) {
  VIEW_EULER.set(view.pitch, view.yaw, 0, 'XYZ');
  root.quaternion.setFromEuler(VIEW_EULER);
}

function Cube({
  state,
  animation,
  durationMs,
  highlight,
  hint,
  rootRef,
  handleRef,
  viewRef,
}: {
  state: CubeState;
  animation: CubeAnimation | null;
  durationMs: number;
  highlight: readonly number[];
  hint: Move | null;
  rootRef: React.RefObject<THREE.Group | null>;
  handleRef: React.RefObject<SceneHandle | null>;
  viewRef: React.RefObject<ViewState>;
}) {
  const camera = useThree((s) => s.camera);
  const invalidate = useThree((s) => s.invalidate);
  // La poignée de la scène existe dès le montage, sans attendre une image de la boucle d'affichage.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    applyView(root, viewRef.current);
    handleRef.current = { camera, root, invalidate };
    invalidate();
  }, [camera, invalidate, rootRef, handleRef, viewRef]);
  const layerRef = useRef<THREE.Group>(null);
  const progress = useRef({ animation: null as CubeAnimation | null, elapsed: 0, done: false });
  const cubies = useMemo(() => cubiesOf(state), [state]);
  const turn = animation ? moveTurn(animation.move) : null;
  const moving = turn ? cubies.filter((c) => c.position[turn.axis] === turn.layer) : [];
  const still = turn ? cubies.filter((c) => c.position[turn.axis] !== turn.layer) : cubies;

  if (progress.current.animation !== animation) progress.current = { animation, elapsed: 0, done: false };

  const frames = useRef(0);
  useFrame((_, delta) => {
    frames.current++;
    if (frames.current === 1) mark('3D : première image');
    if (frames.current === 60) markHealthy();

    const view = viewRef.current;
    if (view.target) {
      const k = Math.min(1, delta * 7);
      const dYaw = wrapAngle(view.target.yaw - view.yaw);
      const dPitch = view.target.pitch - view.pitch;
      view.yaw += dYaw * k;
      view.pitch += dPitch * k;
      if (Math.abs(dYaw) + Math.abs(dPitch) < 0.002) view.target = null;
    }
    const root = rootRef.current;
    if (root) {
      applyView(root, view);
      handleRef.current = { camera, root, invalidate };
    }

    const p = progress.current;
    const layer = layerRef.current;
    if (!layer || !turn || !p.animation) return;
    p.elapsed += delta * 1000;
    const duration = durationMs * (Math.abs(turn.angle) > Math.PI / 2 ? 1.5 : 1);
    const t = Math.min(1, p.elapsed / duration);
    layer.rotation.set(0, 0, 0);
    layer.rotation[AXES[turn.axis]] = turn.angle * ease(t);
    if (t >= 1 && !p.done) {
      p.done = true;
      p.animation.onDone();
    }
  });

  return (
    <group ref={rootRef}>
      {still.map((c) => (
        <CubieMesh key={c.position.join(',')} cubie={c} highlight={highlight} />
      ))}
      <group ref={layerRef} key={animation ? animation.move + state : 'idle'}>
        {moving.map((c) => (
          <CubieMesh key={c.position.join(',')} cubie={c} highlight={highlight} />
        ))}
      </group>
      {hint && !animation && <HintArrow move={hint} />}
    </group>
  );
}

function centroid(e: GestureResponderEvent): { x: number; y: number; count: number } {
  const touches = e.nativeEvent.touches?.length ? e.nativeEvent.touches : [e.nativeEvent];
  const x = touches.reduce((s, t) => s + t.pageX, 0) / touches.length;
  const y = touches.reduce((s, t) => s + t.pageY, 0) / touches.length;
  return { x, y, count: touches.length };
}

/**
 * Cube 3D. Deux doigts (ou un doigt hors du cube) le font tourner ; un toucher bref sur une case appelle
 * `onFaceletPress` ; en mode `turn`, glisser sur une case tourne sa couche. Ce qu'il affiche vient toujours de
 * `state` : l'animation ne fait que rejouer un mouvement sur cet état.
 */
export function CubeView({
  state,
  animation = null,
  durationMs = 300,
  mode = 'paint',
  onFaceletPress,
  onTurn,
  highlight = NONE,
  focus = null,
  hint = null,
}: CubeViewProps) {
  const rootRef = useRef<THREE.Group>(null);
  const handleRef = useRef<SceneHandle | null>(null);
  const viewRef = useRef<ViewState>({ ...VIEW, target: null });
  const size = useRef({ width: 1, height: 1 });
  const gesture = useRef({
    last: { x: 0, y: 0, count: 0 },
    start: { x: 0, y: 0 },
    facelet: null as number | null,
    twoFingers: false,
    turned: false,
    moved: 0,
  });

  useEffect(() => {
    if (focus !== null) aimAt(viewFacing(FACELET_GEOMETRY[focus].normal));
  }, [focus]);
  useEffect(() => {
    if (hint) aimAt(viewFacing(FACELET_GEOMETRY[faceCenterOf(hint)].normal));
  }, [hint]);
  useEffect(() => mark('3D : vue montée, avant le canevas'), []);

  const raycast = (x: number, y: number): number | null => {
    const handle = handleRef.current;
    if (!handle) return null;
    const ndc = new THREE.Vector2((x / size.current.width) * 2 - 1, -(y / size.current.height) * 2 + 1);
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(ndc, handle.camera);
    return faceletOfHit(raycaster.intersectObject(handle.root, true)[0]);
  };

  /** Sens du glissement exprimé dans le modèle : l'axe de la face dont la projection à l'écran suit le mieux le doigt. */
  const swipeMove = (facelet: number, dx: number, dy: number): Move | null => {
    const handle = handleRef.current;
    if (!handle) return null;
    const { position, normal } = FACELET_GEOMETRY[facelet];
    const toScreen = (p: THREE.Vector3) => {
      const v = handle.root.localToWorld(p.clone()).project(handle.camera);
      return new THREE.Vector2(((v.x + 1) / 2) * size.current.width, ((1 - v.y) / 2) * size.current.height);
    };
    const center = new THREE.Vector3(...position).addScaledVector(new THREE.Vector3(...normal), 0.5);
    const origin = toScreen(center);
    const drag = new THREE.Vector2(dx, dy).normalize();
    let best: { axis: Vec3; score: number } | null = null;
    for (const axis of inPlaneAxes(normal)) {
      const s = toScreen(center.clone().addScaledVector(new THREE.Vector3(...axis), 0.5)).sub(origin).normalize();
      const score = s.dot(drag);
      if (!best || Math.abs(score) > Math.abs(best.score)) best = { axis, score };
    }
    if (!best) return null;
    const direction = best.axis.map((v) => v * Math.sign(best!.score) + 0) as unknown as Vec3;
    return moveFromSwipe(facelet, direction);
  };

  const rotateBy = (dx: number, dy: number) => {
    const view = viewRef.current;
    view.target = null;
    view.yaw += dx * DRAG_SPEED;
    view.pitch = clampPitch(view.pitch + dy * DRAG_SPEED);
    // On tourne tout de suite et on demande une image : la rotation ne dépend pas de la boucle d'affichage.
    const handle = handleRef.current;
    if (handle) {
      applyView(handle.root, view);
      handle.invalidate();
    }
  };

  /** Lance une rotation douce vers un point de vue (focus, aide, recentrer). */
  const aimAt = (target: { yaw: number; pitch: number }) => {
    viewRef.current.target = target;
    handleRef.current?.invalidate();
  };

  // Sur Android, l'écran qu'on quitte perd sa surface 3D native : au retour, le canevas est recréé à neuf
  // (l'état du cube et le point de vue, gardés hors du canevas, sont conservés).
  const [canvasKey, setCanvasKey] = useState(0);
  const blurred = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (blurred.current) {
        blurred.current = false;
        handleRef.current = null;
        setCanvasKey((k) => k + 1);
      }
      return () => {
        blurred.current = true;
      };
    }, []),
  );

  // Les gestionnaires lisent les props à jour via une référence : le répondeur n'est créé qu'une fois.
  const props = useRef({ mode, onFaceletPress, onTurn, busy: !!animation });
  props.current = { mode, onFaceletPress, onTurn, busy: !!animation };

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponderCapture: () => true,
        onMoveShouldSetPanResponderCapture: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (e) => {
          const c = centroid(e);
          const g = gesture.current;
          g.last = c;
          g.start = { x: e.nativeEvent.locationX, y: e.nativeEvent.locationY };
          g.twoFingers = c.count > 1;
          g.turned = false;
          g.moved = 0;
          g.facelet = props.current.mode === 'turn' && !g.twoFingers ? raycast(g.start.x, g.start.y) : null;
          viewRef.current.target = null;
        },
        onPanResponderMove: (e, gs) => {
          const g = gesture.current;
          const c = centroid(e);
          if (c.count !== g.last.count) {
            // Un doigt arrive ou part : on repart de la nouvelle position, sans saut.
            if (c.count > 1) g.twoFingers = true;
            g.last = c;
            return;
          }
          const dx = c.x - g.last.x;
          const dy = c.y - g.last.y;
          g.last = c;
          g.moved += Math.abs(dx) + Math.abs(dy);
          if (g.twoFingers || g.facelet === null) return rotateBy(dx, dy);
          // Un doigt posé sur une case, en mode `turn` : un seul quart de tour par glissement.
          if (g.turned || Math.hypot(gs.dx, gs.dy) < SWIPE_MIN) return;
          g.turned = true;
          if (props.current.busy) return;
          const move = swipeMove(g.facelet, gs.dx, gs.dy);
          if (move) props.current.onTurn?.(move);
        },
        onPanResponderRelease: (e) => {
          const g = gesture.current;
          if (g.twoFingers || g.turned || g.moved > TAP_SLOP) return;
          const facelet = raycast(e.nativeEvent.locationX, e.nativeEvent.locationY);
          if (facelet !== null) props.current.onFaceletPress?.(facelet);
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <View
      style={styles.container}
      onLayout={(e) => (size.current = { width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}
    >
      <View style={styles.fill} {...responder.panHandlers}>
        <Canvas
          key={canvasKey}
          flat
          camera={{ position: [0, 0, 7.5], fov: 40 }}
          style={styles.fill}
          onCreated={() => mark('3D : contexte GL créé')}
        >
          <hemisphereLight args={['#FFFFFF', '#8A8A8A', 1.1]} />
          <directionalLight position={[3, 5, 6]} intensity={1.5} />
          <directionalLight position={[-4, -2, 3]} intensity={0.35} />
          <Cube
            state={state}
            animation={animation}
            durationMs={durationMs}
            highlight={highlight}
            hint={hint}
            rootRef={rootRef}
            handleRef={handleRef}
            viewRef={viewRef}
          />
        </Canvas>
      </View>
      <Pressable
        onPress={() => aimAt({ ...VIEW })}
        style={({ pressed }) => [styles.recenter, pressed && { opacity: 0.6 }]}
        accessibilityLabel="Revenir à la vue de départ"
        hitSlop={8}
      >
        <Text style={styles.recenterText}>⟲</Text>
      </Pressable>
    </View>
  );
}

const NONE: readonly number[] = [];

/** Facette centrale de la face d'un mouvement. */
function faceCenterOf(move: Move): number {
  return 'URFDLB'.indexOf(move[0]) * 9 + 4;
}

const styles = StyleSheet.create({
  container: { width: '100%', aspectRatio: 1 },
  fill: { flex: 1 },
  recenter: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  recenterText: { fontSize: 22, color: '#222', lineHeight: 26 },
});
