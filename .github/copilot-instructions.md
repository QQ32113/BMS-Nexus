# Project Guidelines

## Code Style

Use ESLint and Prettier for code formatting. Reference eslint.config.mjs for linting rules and .prettierrc.yaml for formatting preferences. TypeScript configs are separate for main/preload (tsconfig.node.json) and renderer (tsconfig.web.json).

## Architecture

This is an Electron application with a three-process architecture: Main process (Electron backend), Preload script (security bridge), and Renderer process (Vue 3 frontend). Uses Vite for build tooling. Window is fixed at 900×670 with auto-hidden menu bar. Routing uses hash history due to Electron's file:// protocol.

## Build and Test

- npm run dev: Start development with hot reload
- npm run build: Full build with typecheck (required before packaging)
- npm run build:win: Build Windows installer
- npm run typecheck: TypeScript validation
- npm run lint: ESLint check

Agents will run these commands automatically for validation.

## Conventions

- Use path alias @renderer/* for renderer source files
- IPC communication via ipcRenderer.send(), ipcRenderer.on(), ipcRenderer.invoke()
- Custom API exposed via window.api (currently a stub—implement handlers in main and preload)
- Context isolation enabled, sandbox disabled in preload for Node access
- Vue components require <script lang="ts"> and multi-word names are disabled in ESLint
- Auto-updater configured but URL is placeholder (example.com)—update for production

Avoid common pitfalls: Ensure typecheck passes before build, implement IPC handlers properly, and note the fixed window size.