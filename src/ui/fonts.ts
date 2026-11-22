import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_800ExtraBold } from '@expo-google-fonts/inter/800ExtraBold';
import { useFonts } from 'expo-font';

/**
 * Web et iOS : les polices se chargent au lancement. Sur Android, elles sont embarquées dans l'APK par le plugin
 * expo-font (`app.json`) et `fonts.android.ts` remplace ce fichier : aucun appel natif au démarrage.
 * On n'attend pas le chargement : en attendant, le texte s'affiche dans la police du système.
 */
export function useAppFonts() {
  useFonts({ Inter_400Regular, Inter_600SemiBold, Inter_800ExtraBold });
}
