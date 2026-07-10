# Development Setup

## Git Branch vs Environment Configuration

Understanding the difference between Git branches and environment configurations is crucial for proper development workflow.

### Key Concepts

- **Git branch** (`dev` or `main`) = Which version of your code you're working with
- **npm run script** (`start:dev` vs `start:prod`) = Which environment configuration (`.env.dev` vs `.env.prod`) the app uses

These are **independent** - you can run any environment config from any branch, but this can lead to confusion.

### Environment Configurations

**Dev Environment** (`.env.dev`):
- API Endpoint: `https://api.dev.stellium.ai`
- Bundle ID: `com.stelliumapp.dev`
- App Name: "Stellium Dev"
- Commands: `npm run start:dev`, `npm run ios:dev`, `npm run android:dev`

**Prod Environment** (`.env.prod`):
- API Endpoint: `https://api.stellium.ai`
- Bundle ID: `com.stelliumapp`
- App Name: "Stellium"
- Commands: `npm run start:prod`, `npm run ios:prod`, `npm run android:prod`

### Best Practice: Match Branch to Environment

| Git Branch | Recommended Command | Environment | Why |
|------------|-------------------|-------------|-----|
| `dev` | `npm run start:dev`<br>`npm run ios:dev` | Dev API | ✅ Development code against development API |
| `main` | `npm run start:prod`<br>`npm run ios:prod` | Prod API | ✅ Production code against production API |
| `dev` | `npm run start:prod`<br>`npm run ios:prod` | Prod API | ⚠️ Testing dev code against production (risky!) |
| `main` | `npm run start:dev`<br>`npm run ios:dev` | Dev API | ⚠️ Production code against dev API (unusual) |

### Example Workflows

**Daily Development (recommended):**
```bash
git checkout dev
npm run start:dev -- --reset-cache
npm run ios:dev -- --simulator="iPhone 16 Pro"
```

**Testing for Production Release:**
```bash
git checkout main
npm run start:prod -- --reset-cache
npm run ios:prod -- --simulator="iPhone 16 Pro"
```

**Cross-Testing (advanced):**
```bash
# Test dev code against prod API (use with caution!)
git checkout dev
npm run start:prod -- --reset-cache
npm run ios:prod -- --simulator="iPhone 16 Pro"
```

### Common Mistakes to Avoid

❌ **Don't**: Be on `main` branch and run `npm run ios:dev`
- This runs production code against the dev API

❌ **Don't**: Be on `dev` branch and run `npm run ios:prod` without understanding the implications
- This runs development code (possibly with bugs) against the production API

✅ **Do**: Always match your branch to your environment unless you have a specific reason to cross-test

### Quick Reference

When you're about to run the app, ask yourself:
1. **Which code?** Check current branch: `git branch`
2. **Which API?** Choose the matching npm script
3. **Match them up** for predictable behavior