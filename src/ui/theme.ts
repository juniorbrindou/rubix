import { BODY_COLOR, STICKER_COLOR } from '../scene/cubies';

/**
 * Système visuel de Rubix : le cube lui-même. Les commandes sont des « plaques » noires (le plastique du cube)
 * qui portent des « autocollants » de couleur, posées sur un tapis gris-bleu clair. Le jaune (face du haut,
 * celle qu'on finit en dernier) est la couleur de l'action principale.
 *
 * Un futur volet (comme « Apprendre ») réutilise les mêmes briques : `ScreenHeader`, `Dock`, `ActionButton`,
 * `CubeStage`, et ces jetons. Aucun écran ne fixe de couleur ou de police en dur.
 */
export const color = {
  /** Fond de tous les écrans : un tapis de speedcubing, clair et froid. */
  mat: '#E3E8EE',
  /** Surface posée sur le tapis (puces, cartes). */
  card: '#F7F9FB',
  line: '#C5CDD8',
  ink: BODY_COLOR,
  inkSoft: '#465061',
  inkMute: '#6B7586',
  /** Le plastique noir du cube : dock, barre de mouvements, bouton principal éteint. */
  plate: BODY_COLOR,
  plateRaised: '#262B33',
  onPlate: '#FFFFFF',
  onPlateSoft: '#9AA4B2',
  /** Action principale et pas en cours. */
  go: STICKER_COLOR.U,
  error: '#C21F1F',
  ok: '#0B7A3E',
  sticker: STICKER_COLOR,
} as const;

/** Familles chargées par `useAppFonts` (web, iOS) ou embarquées dans l'APK (plugin expo-font d'app.json). */
export const font = {
  /** Titres et notation des mouvements. Large et trapue, comme un cube ; à doser. */
  display: 'Unbounded_700Bold',
  displayMedium: 'Unbounded_500Medium',
  /** Consignes et messages : lisible en un coup d'œil, cube en main. */
  body: 'AtkinsonHyperlegibleNext_400Regular',
  bodyBold: 'AtkinsonHyperlegibleNext_700Bold',
  mono: 'monospace',
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 } as const;

export const radius = { sticker: 6, chip: 10, plate: 16, dock: 22 } as const;

/** Largeur d'écran de référence : tout se vérifie à 360 dp. */
export const GUTTER = space.lg;
