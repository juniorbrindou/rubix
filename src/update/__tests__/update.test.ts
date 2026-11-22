import { isNewer, parseLatest } from '../update';

const ok = { version: '0.7.1', versionCode: 701, url: 'https://brindoujunior.com/rubix-v0.7.1.apk', notes: 'Bandeau de mise à jour.' };

describe('mise à jour', () => {
  test('lit un fichier de version valide', () => {
    expect(parseLatest(ok)).toEqual(ok);
  });

  test('refuse un fichier mal formé ou une APK venue d’ailleurs', () => {
    expect(parseLatest(null)).toBeNull();
    expect(parseLatest({ ...ok, versionCode: '701' })).toBeNull();
    expect(parseLatest({ ...ok, url: 'https://exemple.com/rubix-v0.7.1.apk' })).toBeNull();
    expect(parseLatest({ ...ok, url: 'https://brindoujunior.com/autre.apk' })).toBeNull();
  });

  test('ne propose que plus récent que l’app installée', () => {
    const latest = parseLatest(ok)!;
    expect(isNewer(latest, 700)).toBe(true);
    expect(isNewer(latest, 701)).toBe(false);
    expect(isNewer(latest, 702)).toBe(false);
    expect(isNewer(latest, undefined)).toBe(false);
  });
});
