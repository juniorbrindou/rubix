// three.js ne publie plus qu'un module ES : son entrée CommonJS (`three.cjs`, choisie quand on fait `require('three')`,
// comme @react-three/fiber/native) appelle `process.emitWarning`, absent sur téléphone, et l'app plante au démarrage.
// On renvoie donc toute demande de `three` vers le module ES, ce qui garde aussi une seule copie de three dans le bundle.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);
const threeModule = path.join(__dirname, 'node_modules/three/build/three.module.js');

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'three') return { type: 'sourceFile', filePath: threeModule };
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
