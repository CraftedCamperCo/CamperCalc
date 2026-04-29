// Web stub for native-only packages stubbed in metro.config.js for the web bundle.
// Handles three calling patterns gracefully:
//   1. HOC wrap (e.g. Sentry.wrap(App)) — pass the component through unchanged.
//   2. JSX usage (e.g. <ViewShot>{children}</ViewShot>) — render children as a fragment.
//   3. Method call (e.g. Print.printToFileAsync({ html })) — return null. Call sites
//      that genuinely need to run on web must guard with Platform.OS === 'web' so
//      they never invoke these in the first place.
module.exports = new Proxy({}, {
    get: (target, prop) => {
          if (prop === '__esModule') return true;
          if (typeof prop === 'symbol') return undefined;
          const mock = (...args) => {
                  // HOC pattern: first arg is a function (component), pass it through.
                  if (args.length > 0 && typeof args[0] === 'function') return args[0];
                  // React component pattern: first arg is a props object. If it has
                  // children, render them transparently; otherwise return null.
                  if (args.length > 0 && typeof args[0] === 'object' && args[0] !== null) {
                          return args[0].children ?? null;
                  }
                  return null;
          };
          mock.displayName = 'MockNative';
          return mock;
    },
});
