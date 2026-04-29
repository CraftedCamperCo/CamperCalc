const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Native-only packages that must be stubbed out for web builds.
// The stub returns no-op functions; call sites that actually run on web
// must guard with Platform.OS === 'web' so they do not invoke these.
const NATIVE_ONLY_PACKAGES = [
  '@stripe/stripe-react-native',
  'lottie-react-native',
  '@sentry/react-native',
  'expo-print',
  'expo-sharing',
  'expo-mail-composer',
  'expo-haptics',
  'expo-secure-store',
  'react-native-view-shot',
];

const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && NATIVE_ONLY_PACKAGES.includes(moduleName)) {
    return {
      filePath: require.resolve('./stripe-web-mock.js'),
      type: 'sourceFile',
    };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;