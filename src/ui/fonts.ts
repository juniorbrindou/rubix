import { AtkinsonHyperlegibleNext_400Regular } from '@expo-google-fonts/atkinson-hyperlegible-next/400Regular';
import { AtkinsonHyperlegibleNext_700Bold } from '@expo-google-fonts/atkinson-hyperlegible-next/700Bold';
import { Unbounded_500Medium } from '@expo-google-fonts/unbounded/500Medium';
import { Unbounded_700Bold } from '@expo-google-fonts/unbounded/700Bold';
import { useFonts } from 'expo-font';

/**
 * Web et iOS : les polices se chargent au lancement. Sur Android, elles sont embarquées dans l'APK par le plugin
 * expo-font (`app.json`) et `fonts.android.ts` remplace ce fichier : aucun appel natif au démarrage.
 * On n'attend pas le chargement : en attendant, le texte s'affiche dans la police du système.
 */
export function useAppFonts() {
  useFonts({ Unbounded_700Bold, Unbounded_500Medium, AtkinsonHyperlegibleNext_400Regular, AtkinsonHyperlegibleNext_700Bold });
}
