# Workspace Agent Guidelines & Operational Protocols

## 1. File Descriptor Exhaustion (`EMFILE: pipe: too many open files`)
- **Protocol**: If the tool runner encounters `EMFILE: pipe: too many open files` due to process handle accumulation in prolonged sessions:
  - You have explicit user authorization to stop and cleanly transition to a new conversation without waiting.
  - Summarize the current state, modified files, and remaining tasks in a clear checklist before terminating the turn so the next conversation can resume seamlessly.

## 2. Environment & Execution
- **Next.js CLI**: The binary is located at `./apps/storefront/node_modules/.bin/next`.
- **Dev Server**: Run via `./apps/storefront/node_modules/.bin/next dev -p 3000` inside `apps/storefront` or at workspace root.
- **Production Package**: Only run `./scripts/build-hostinger-zip.sh` when explicitly requested by the user. Do not build zip packages automatically.
- **Git Push Policy**: Automatically commit and push to GitHub (`git push origin main`) whenever updates/features are tested and ready.
- **Sandbox Boundary**: Git commits and writes to `.git/` require `BypassSandbox: true` to avoid macOS sandbox permission blocks.
