const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// O zustand v5 usa import.meta nos builds ESM (.mjs), que o bundle web clássico
// do Metro não suporta. Preferir os builds CommonJS resolve.
config.resolver.unstable_conditionNames = ['require', 'react-native', 'default'];

module.exports = config;
