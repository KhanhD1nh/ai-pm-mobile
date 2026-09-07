# AI-PM Mobile

React Native / Expo SDK 57 client for AI-PM. The mobile app uses the same backend, authentication, RBAC, projects, issues and notification contracts as the web client.

## Implemented MVP

- Authentication, initial System Owner setup, session restore and workspace switching
- Home dashboard, Projects and project overview
- Board with search/filter, create issue and quick status transitions
- Full issue workflow: status, priority, assignee, cycle, milestone, tags, due date, focus schedule, Markdown description, participants, relations, comments and archive
- My Work
- Cycles, Milestones and Schedule overview/creation
- Wiki list/read/create/edit
- Project Members and Workflow statuses
- Agents and AI Action revert
- Global search
- Profile/password, Organization members, System Users and AI Budget
- Notification Inbox, unread state and realtime SSE
- Expo Push device registration, badge sync, deep linking and cross-workspace routing
- Persisted query cache for basic offline read access
- Biometric app lock

## Requirements

- Node.js 22.x (the repository pins 22.23.2 in `.node-version`)
- AI-PM backend reachable from the device
- Expo/EAS project for real push notifications

Copy `.env.example` to `.env` and configure:

```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.10:4000/api/v1
EXPO_PUBLIC_EAS_PROJECT_ID=your-eas-project-id
```

`localhost` only works when the backend is reachable from the same runtime. On a physical phone use the machine's LAN address or the deployed API URL. Android Emulator commonly reaches the host at `10.0.2.2`.

## Run

```bash
pnpm install
pnpm run dev
```

For a physical development client over an Expo tunnel:

```bash
pnpm run dev:tunnel
```

Validation commands used by the project:

```bash
pnpm run verify
pnpm run verify:release
```

## EAS builds

After logging into Expo and linking the project, set `EXPO_PUBLIC_EAS_PROJECT_ID` and use the profiles in `eas.json`:

```bash
pnpm exec eas build --profile development --platform android
pnpm exec eas build --profile preview --platform ios
pnpm exec eas build --profile production --platform all
```

Push notification receipt on a real device requires valid Expo/EAS credentials and platform push credentials. The app does not hard-code those credentials.
