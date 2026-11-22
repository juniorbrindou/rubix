import { File, Paths } from 'expo-file-system';

/** La présentation de bienvenue ne s'affiche qu'une fois : un fichier (ou, sur le web, le stockage local) s'en souvient. */

const KEY = 'bienvenue-vue';
let file: File | null = null;
try {
  file = new File(Paths.document, `${KEY}.txt`);
} catch {
  file = null;
}

function webStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

let seen: boolean = (() => {
  try {
    if (file?.exists) return true;
  } catch {
    // ignoré : on considère la présentation comme non vue
  }
  return webStorage()?.getItem(KEY) === '1';
})();

export function welcomeSeen(): boolean {
  return seen;
}

export function markWelcomeSeen() {
  seen = true;
  try {
    file?.writeSync('1');
  } catch {
    // sans fichier, la présentation reviendra au prochain lancement : sans gravité
  }
  try {
    webStorage()?.setItem(KEY, '1');
  } catch {
    // idem
  }
}
