#!/usr/bin/env bash
set -euo pipefail

if ! npm exec eas -- --version >/dev/null 2>&1; then
  echo "EAS CLI not found. Run: npm install"
  exit 1
fi

MODE="${1:-}"
if [ -z "${MODE}" ]; then
  echo "Usage:"
  echo "  scripts/release/ios-release.sh testflight"
  echo "  scripts/release/ios-release.sh appstore"
  exit 1
fi

echo "== CamperPlan iOS Release =="
echo "Mode: ${MODE}"
echo

if [ "${MODE}" = "testflight" ]; then
  npm exec eas -- build --platform ios --profile preview
  echo
  echo "Build queued for TestFlight preview profile."
  echo "After build completes, enable Public Link in App Store Connect -> TestFlight."
  exit 0
fi

if [ "${MODE}" = "appstore" ]; then
  npm exec eas -- build --platform ios --profile production
  npm exec eas -- submit --platform ios --profile production
  echo
  echo "Production build submitted to App Store Connect."
  echo "Complete final release in App Store Connect after review passes."
  exit 0
fi

echo "Unknown mode: ${MODE}"
exit 1
