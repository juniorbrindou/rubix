import { useEffect, useMemo, useRef } from 'react';
import { PanResponder, StyleSheet, View, type GestureResponderEvent } from 'react-native';
import * as THREE from 'three';
import { FACELET_GEOMETRY, faceletAt, moveTurn, type CubeState, type Move, type Vec3 } from '../cube';
import { BODY_COLOR, STICKER_COLOR, cubiesOf, type Cubie } from './cubies';
import { Canvas, useFrame, useThree } from './fiber';

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
  onFaceletPress?: (facelet: number) => void;
  /** Facettes à faire ressortir (cadre blanc). */
  highlight?: readonly number[];
  /** Quand elle change, le cube tourne pour montrer cette facette de face. */
  focus?: number | null;
}

/** Vue de départ : face U au-dessus, F devant, R à droite, comme on tient son cube. */
const INITIAL_ROTATION = new THREE.Quaternion()
  .setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0.5)
  .multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -0.65));

const NONE: readonly number[] = [];

/** Rotation qui amène une face devant (+z) en gardant le haut en haut, avant l'inclinaison de la vue de départ. */
const FACE_TO_FRONT: Record<string, [THREE.Vector3, number]> = {
  '0,0,1': [new THREE.Vector3(0, 1, 0), 0],
  '1,0,0': [new THREE.Vector3(0, 1, 0), -Math.PI / 2],
  '0,0,-1': [new THREE.Vector3(0, 1, 0), Math.PI],
  '-1,0,0': [new THREE.Vector3(0, 1, 0), Math.PI / 2],
  '0,1,0': [new THREE.Vector3(1, 0, 0), Math.PI / 2],
  '0,-1,0': [new THREE.Vector3(1, 0, 0), -Math.PI / 2],
};

/** Orientation qui montre la face de `facelet` comme la vue de départ montre F : de face, un peu de biais. */
function focusRotation(facelet: number): THREE.Quaternion {
  const [axis, angle] = FACE_TO_FRONT[FACELET_GEOMETRY[facelet].normal.join(',')];
  return INITIAL_ROTATION.clone().multiply(new THREE.Quaternion().setFromAxisAngle(axis, angle));
}

const TAP_SLOP = 8;
const DRAG_SPEED = 0.01;
const STICKER_SIZE = 0.84;
const AXES = ['x', 'y', 'z'] as const;

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function StickerMesh({ normal, color, facelet, highlighted }: { normal: Vec3; color: string; facelet: number; highlighted: boolean }) {
  const rotation = useMemo(() => {
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(...normal));
    return new THREE.Euler().setFromQuaternion(q);
  }, [normal]);
  const offset = 0.501;
  return (
    <group position={[normal[0] * offset, normal[1] * offset, normal[2] * offset]} rotation={rotation}>
      {highlighted && (
        <mesh position={[0, 0, 0.001]}>
          <planeGeometry args={[STICKER_SIZE + 0.1, STICKER_SIZE + 0.1]} />
          <meshBasicMaterial color="#FFFFFF" />
        </mesh>
      )}
      <mesh position={[0, 0, 0.002]} userData={{ facelet }}>
        <planeGeometry args={[STICKER_SIZE, STICKER_SIZE]} />
        <meshStandardMaterial color={STICKER_COLOR[color] ?? STICKER_COLOR['?']} roughness={0.5} />
      </mesh>
    </group>
  );
}

function CubieMesh({ cubie, highlight }: { cubie: Cubie; highlight: readonly number[] }) {
  return (
    <group position={cubie.position as [number, number, number]}>
      <mesh userData={{ cubie: cubie.position }}>
        <boxGeometry args={[0.98, 0.98, 0.98]} />
        <meshStandardMaterial color={BODY_COLOR} roughness={0.8} />
      </mesh>
      {cubie.stickers.map((s) => (
        <StickerMesh key={s.facelet} {...s} highlighted={highlight.includes(s.facelet)} />
      ))}
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
  try {
    return faceletAt(cubie, [Math.round(n.x) + 0, Math.round(n.y) + 0, Math.round(n.z) + 0]);
  } catch {
    return null; // face intérieure : pas de facette
  }
}

interface SceneHandle {
  camera: THREE.Camera;
  root: THREE.Object3D;
}

function Cube({
  state,
  animation,
  durationMs,
  highlight,
  rootRef,
  handleRef,
  focusRef,
}: Required<Pick<CubeViewProps, 'state' | 'durationMs'>> & {
  animation: CubeAnimation | null;
  highlight: readonly number[];
  rootRef: React.RefObject<THREE.Group | null>;
  handleRef: React.RefObject<SceneHandle | null>;
  focusRef: React.RefObject<THREE.Quaternion | null>;
}) {
  const camera = useThree((s) => s.camera);
  const layerRef = useRef<THREE.Group>(null);
  const progress = useRef({ animation: null as CubeAnimation | null, elapsed: 0, done: false });
  const cubies = useMemo(() => cubiesOf(state), [state]);
  const turn = animation ? moveTurn(animation.move) : null;
  const moving = turn ? cubies.filter((c) => c.position[turn.axis] === turn.layer) : [];
  const still = turn ? cubies.filter((c) => c.position[turn.axis] !== turn.layer) : cubies;

  if (progress.current.animation !== animation) progress.current = { animation, elapsed: 0, done: false };

  useFrame((_, delta) => {
    if (rootRef.current) handleRef.current = { camera, root: rootRef.current };
    const target = focusRef.current;
    if (target && rootRef.current) {
      rootRef.current.quaternion.slerp(target, Math.min(1, delta * 6));
      if (rootRef.current.quaternion.angleTo(target) < 0.01) focusRef.current = null;
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
    <group ref={rootRef} quaternion={INITIAL_ROTATION}>
      {still.map((c) => (
        <CubieMesh key={c.position.join(',')} cubie={c} highlight={highlight} />
      ))}
      <group ref={layerRef} key={animation ? animation.move + state : 'idle'}>
        {moving.map((c) => (
          <CubieMesh key={c.position.join(',')} cubie={c} highlight={highlight} />
        ))}
      </group>
    </group>
  );
}

/**
 * Cube 3D. On le fait tourner en glissant le doigt ; un toucher bref sur une facette appelle `onFaceletPress`.
 * Ce qu'il affiche vient toujours de `state` : l'animation ne fait que rejouer un mouvement sur cet état.
 */
export function CubeView({ state, animation = null, durationMs = 300, onFaceletPress, highlight = NONE, focus = null }: CubeViewProps) {
  const rootRef = useRef<THREE.Group>(null);
  const focusRef = useRef<THREE.Quaternion | null>(null);
  useEffect(() => {
    if (focus !== null) focusRef.current = focusRotation(focus);
  }, [focus]);
  const handleRef = useRef<SceneHandle | null>(null);
  const size = useRef({ width: 1, height: 1 });
  const last = useRef({ dx: 0, dy: 0 });

  const pick = (e: GestureResponderEvent) => {
    const handle = handleRef.current;
    if (!handle || !onFaceletPress) return;
    const { locationX, locationY } = e.nativeEvent;
    const ndc = new THREE.Vector2((locationX / size.current.width) * 2 - 1, -(locationY / size.current.height) * 2 + 1);
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(ndc, handle.camera);
    const facelet = faceletOfHit(raycaster.intersectObject(handle.root, true)[0]);
    if (facelet !== null) onFaceletPress(facelet);
  };

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponderCapture: () => true,
        onMoveShouldSetPanResponderCapture: () => true,
        onPanResponderGrant: () => {
          last.current = { dx: 0, dy: 0 };
          focusRef.current = null;
        },
        onPanResponderMove: (_, g) => {
          const root = rootRef.current;
          if (!root) return;
          const yaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), (g.dx - last.current.dx) * DRAG_SPEED);
          const pitch = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), (g.dy - last.current.dy) * DRAG_SPEED);
          root.quaternion.premultiply(yaw).premultiply(pitch);
          last.current = { dx: g.dx, dy: g.dy };
        },
        onPanResponderRelease: (e, g) => {
          if (Math.abs(g.dx) + Math.abs(g.dy) < TAP_SLOP) pick(e);
        },
      }),
    // pick lit onFaceletPress via la fermeture : on recrée le répondeur quand il change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onFaceletPress],
  );

  return (
    <View
      style={styles.container}
      onLayout={(e) => (size.current = { width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}
      {...responder.panHandlers}
    >
      <Canvas camera={{ position: [0, 0, 7.5], fov: 40 }} style={styles.canvas}>
        <ambientLight intensity={1.6} />
        <directionalLight position={[3, 5, 6]} intensity={1.4} />
        <Cube
          state={state}
          animation={animation}
          durationMs={durationMs}
          highlight={highlight}
          rootRef={rootRef}
          handleRef={handleRef}
          focusRef={focusRef}
        />
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', aspectRatio: 1 },
  canvas: { flex: 1 },
});
