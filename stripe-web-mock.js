// Web stub for native-only packages (@stripe/stripe-react-native, lottie-react-native, @sentry/react-native)
// Returns no-op functions that pass through component arguments (e.g. Sentry.wrap(App) returns App)
module.exports = new Proxy({}, {
    get: (target, prop) => {
          if (prop === '__esModule') return true;
          if (typeof prop === 'symbol') return undefined;
          const mock = (...args) => {
                  // If first arg is a function (component), pass it through — critical for Sentry.wrap(App)
                  if (args.length > 0 && typeof args[0] === 'function') return args[0];
                  // If first arg is an object, pass it through
                  if (args.length > 0 && typeof args[0] === 'object' && args[0] !== null) return args[0];
                  return null;
          };
          mock.displayName = 'MockNative';
          return mock;
    },
});
