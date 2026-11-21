#!/usr/bin/env bash
# Construit l'APK et la publie sur https://brindoujunior.com/rubix-v<version>.apk.
# La version vient de app.json (expo.version et expo.android.versionCode) : l'augmenter avant chaque publication.
# Usage : scripts/publier-apk.sh "Ce qui change, en une phrase"
set -euo pipefail
cd "$(dirname "$0")/.."

NOTES=${1:?Donne en argument ce qui change dans cette version}
VERSION=$(node -p 'require("./app.json").expo.version')
CODE=$(node -p 'require("./app.json").expo.android.versionCode')
DEST=/var/www/rubix-releases
NAME="rubix-v$VERSION.apk"
URL="https://brindoujunior.com/$NAME"

if [ -e "$DEST/$NAME" ]; then
  echo "La version $VERSION est déjà publiée : augmente expo.version et expo.android.versionCode dans app.json." >&2
  exit 1
fi

npm test --silent
CI=1 npx expo prebuild --platform android --no-install >/dev/null
(
  cd android
  echo "sdk.dir=/opt/android-sdk" > local.properties
  ANDROID_HOME=/opt/android-sdk ./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a,armeabi-v7a --no-daemon -q
)
APK=android/app/build/outputs/apk/release/app-release.apk
/opt/android-sdk/build-tools/36.0.0/apksigner verify "$APK"

mkdir -p "$DEST"
cp "$APK" "$DEST/$NAME"
# Fichier lu par l'app pour proposer la mise à jour.
VERSION="$VERSION" CODE="$CODE" URL="$URL" NOTES="$NOTES" node -e '
  const { VERSION, CODE, URL, NOTES } = process.env;
  process.stdout.write(JSON.stringify({ version: VERSION, versionCode: Number(CODE), url: URL, notes: NOTES, date: new Date().toISOString().slice(0, 10) }, null, 2) + "\n");
' > "$DEST/rubix-latest.json"

# Ne dire « en ligne » qu'après avoir téléchargé ce qui est servi.
TMP=$(mktemp)
curl -sfL -o "$TMP" "$URL"
cmp "$TMP" "$APK"
rm -f "$TMP"
curl -sf "https://brindoujunior.com/rubix-latest.json" >/dev/null
echo "Publiée et vérifiée : $URL"
