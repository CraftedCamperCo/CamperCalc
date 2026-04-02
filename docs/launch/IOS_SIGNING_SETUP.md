# iOS Signing Setup (EAS Managed)

This project is configured for EAS managed signing.

## One-time steps

1. Log into Expo:

```bash
npm run eas:whoami
```

2. Initialize EAS project metadata if not already linked:

```bash
npm run eas:init
```

3. Start preview build and let EAS create/select certificates/profiles:

```bash
npm run build:ios:preview
```

4. In prompts, choose managed credentials for iOS.

## Config already in repository

- `app.json`
  - `expo.ios.bundleIdentifier = com.camperplan.crafted`
  - `expo.ios.buildNumber = 1`
- `eas.json`
  - `preview` and `production` iOS build profiles
- `package.json`
  - scripted iOS build and submit commands
