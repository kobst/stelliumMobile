# Iris (RelationshipApp) — Comprehensive Application Audit

**Date:** 2026-07-06
**Scope:** `StelliumApp` repo (live app = `RelationshipApp/` + `shared/` + root native projects), cross-checked against `../stellium-backend` for API contracts and endpoint auth.
**Method:** Five parallel deep audits (production readiness, security, product/UX, dead code, API contracts), each verified against actual code with file:line evidence. Read-only — nothing was modified.

---

## Executive summary

**Overall verdict: NOT production-ready yet — but closer than it looks.** The application layer is genuinely solid: thoughtful API client (per-endpoint timeouts/retries, no-retry on billed endpoints), server-authoritative payments via RevenueCat webhooks, clean value-before-signup onboarding, and no live endpoint that 404s or mis-parses against the backend. What fails is release infrastructure and two critical security items:

| Dimension | Verdict |
|---|---|
| Production readiness | **iOS: nearly ready** (short punch list). **Android: not shippable** (debug-keystore signing, iOS-only RevenueCat key, versionCode 1) |
| Security | **1 CRITICAL backend IDOR/billing-fraud vector reachable today** + debug keystore; payments and auth token flow otherwise sound |
| Product/UX | Strong core; **zero retention infrastructure** (no push, no daily content) and **zero virality surface** (no share, no invite) |
| Dead code | **~204 files / ~46,800 LOC safely deletable (~half the repo's source)** + 3+ removable native-heavy deps |
| API contracts | Healthy. 2 dormant functions would 404; a few silent-drift fields; credit costs fully aligned |

**The five most urgent items across all dimensions:**

1. **[SECURITY-CRITICAL] IDOR + billing fraud in `enhanced-relationship-analysis`** — backend trusts client-supplied `ownerUserId`/`userIdA`/`userIdB` with no ownership check; one route variant is fully unauthenticated. Attacker can pull victims' birth-derived data AND drain victims' credit balances. Fix in `stellium-backend` first.
2. **[BLOCKER] Android release builds signed with the public debug keystore** (`android/app/build.gradle:127`, password `android`, keystore committed to git).
3. **[BLOCKER] No crash reporting anywhere** (no Crashlytics/Sentry) and no global ErrorBoundary — a paid app flying blind.
4. **[COMPLIANCE] Account deletion, profile edits, and notification prefs are client-side stubs** that fake success (`RelationshipApp/src/api/profile.ts`) — non-functional account deletion is a known Apple rejection; users also see literal "Placeholder copy until backend interpretations are wired."
5. **[GROWTH] No push notifications and no share/invite mechanics** in an app whose content refreshes weekly — retention depends on users remembering Mondays, and nothing a user creates can leave the app.

---

## 1. Production readiness

**Verdict: NOT READY overall. iOS nearly ready; Android not shippable.**

### Blockers

| # | Finding | Evidence |
|---|---|---|
| 1 | Android release signed with debug keystore, hardcoded `storePassword 'android'`, keystore tracked in git; no release signing config exists | `android/app/build.gradle:112-131`, `android/app/debug.keystore` |
| 2 | Zero crash reporting/observability (no Crashlytics, Sentry, or Bugsnag anywhere) | `package.json`; grep across live code: 0 hits |
| 3 | Prod RevenueCat key is Apple-only (`appl_...`) — Android purchases cannot work; Android `versionCode` still 1 | `RelationshipApp/.env.prod:9`, `src/config/env.ts:11`, `build.gradle:96` |

### High

- **No global ErrorBoundary** — any uncaught render error white-screens the app, silently (no crash reporter). `RelationshipApp/App.tsx:9-21`.
- **Tests fail on main; no CI.** 3 of 7 Jest suites fail (2 real assertion failures in `__tests__/relationshipApp.historySelection.test.ts:33`; 2 suites can't parse — Jest transform not configured for `react-native-config`). No `.github/workflows`. 7 test files for ~40 screens.
- **TypeScript doesn't compile: 362 errors**, of which 5 are in live code — including `FullRelationshipAnalysisScreen.tsx:120` (`clusterData.composite` possibly undefined — real crash candidate). The 357 legacy-tree errors drown the signal (see §4 — deleting the dead tree fixes this).
- **ESLint: 241 errors / 2,415 warnings**, incl. 4 `react-hooks/rules-of-hooks` violations; unenforceable as a gate in this state.
- **Prod GCP service-account private keys sitting in the mobile repo working tree** (`RelationshipApp/secrets/relationship-app-backend-prod.json`) — gitignored and never committed, but a prod backend credential doesn't belong in a client repo. Relocate + rotate as hygiene.

### Medium

- No R8/ProGuard on release (`enableProguardInReleaseBuilds = false`, `build.gradle:71`).
- **Facebook SDK embedded and configured but 100% unused** — FB SDK auto-initializes and transmits device data, which conflicts with the privacy manifest declaring `NSPrivacyTracking=false` and empty `NSPrivacyCollectedDataTypes` (`ios/StelliumApp/PrivacyInfo.xcprivacy`). App Review risk. Remove the SDK (see §4) or declare the collection.
- **Empty `NSLocationWhenInUseUsageDescription`** in `ios/StelliumApp/Info.plist:71-72` — Apple rejects empty purpose strings; nothing uses location. Remove the key.
- Prod Google Sign-In web client ID "currently mirrors the iOS client" per its own comment (`src/config/firebase.ts:26-29`) — verify before launch.
- ~10 un-gated `console.log` in production paths (e.g. `ProfileRevealScreen.tsx:400-440` logs full API responses); no `transform-remove-console` in babel config.
- No offline story: no NetInfo, no store persistence — onboarding drafts and all state lost on process death.
- `npm audit`: 28 vulns (5 critical) — mostly dev tooling; `npm audit fix` is nearly free.

### Low

- Version drift: iOS 1.1 (build 9) vs Android 1.0 (versionCode 1).
- API timeout races the fetch but never aborts it (`shared/api/baseClient.ts:174-185`, no `AbortController`) — timed-out requests can still mutate server state.
- `poll()` uses `setInterval` with an async callback — overlapping requests possible (`baseClient.ts:253`).

### What's in good shape

Per-endpoint timeout/retry matrix with explicit no-retry on billed `/ask-iris`; RevenueCat purchase flow handles cancel/timeout/entitlement-polling correctly; bootstrap distinguishes stale sessions vs 404s vs entitlement failures; ATS not disabled; `allowBackup=false`; dev/prod Firebase projects and bundle IDs cleanly separated; React 19 + RN 0.79.2 is the correct pairing; Hermes + New Architecture enabled.

### Minimum path to ship (iOS-first)

1. Fix the backend IDOR (§2 #1) — precondition for shipping anything.
2. Add Crashlytics (Firebase already integrated — small lift) + root ErrorBoundary.
3. Fix 2 failing tests + Jest transform; add a GitHub Actions workflow (tsc scoped to live code, lint, jest).
4. Fix the 5 live-code TS errors (esp. `FullRelationshipAnalysisScreen.tsx:120`).
5. Wire real account deletion (backend `/account/delete` exists at `indexRoutes.ts:457` but is unwired) and remove placeholder interpretation copy.
6. Remove FB SDK; delete empty location purpose string; verify prod Google web client ID.
7. Android track: release keystore, `goog_` RevenueCat key, R8 on, bump versionCode.

---

## 2. Security

### CRITICAL

**1. IDOR + billing fraud + PII exposure in relationship-analysis generation (backend, live today).**
`RelationshipApp/src/api/relationships.ts:16-61` posts client-supplied `userIdA`, `userIdB`, `ownerUserId` to `/relationship-app/enhanced-relationship-analysis`. Backend (`stellium-backend/routes/indexRoutes.ts:332-334`):
- `/relationship-app/...` variant has `requireAuth` but **no ownership check** — `req.userId` is never referenced anywhere in `enhancedRelationshipController.ts` (verified, zero hits).
- Un-prefixed `/enhanced-relationship-analysis` variant has **no auth at all** (only an IP rate limiter).
- `getUserSingle(userIdA/B)` fetches any Mongo `_id` unfiltered (`dbService.ts:984-993`); `billingUserId = ownerUserId || ...` (controller :152-154) means **credits are deducted from an attacker-chosen account** (:380-407); full synastry/composite data + names returned in the creation response before any ACL runs (:410-455).

**Exploit:** anyone (no account needed on the public variant) can pull two victims' birth-derived compatibility data and bill it to a victim's credit balance. **Fix:** add `requireAuthenticatedOwnerUserIdBodyMatch` (already used on the sibling route at `indexRoutes.ts:288`), verify subject ownership in the controller, and remove/auth-gate the public variant. **Do this before anything else in this report.**

**2. Release APK signed with the public debug keystore** — same as §1 blocker #1. Anyone with repo access (incl. forks/history) can produce an APK Android treats as authentically signed. If this signature ever shipped, plan a key migration in Play Console.

### HIGH

**3. Real keys recoverable from git history.** `.env.dev`/`.env.prod` were tracked from 2025-09-30 until `bbb56af` (2026-04-03) and never scrubbed — `git show 931a136:.env.dev` still works. Recoverable: `GOOGLE_API_KEY=AIzaSyA0Km17...`, RevenueCat `appl_...` keys (dev+prod), Superwall `pk_...`. Mitigating: RevenueCat/Superwall client keys are public-by-design; the Google key is meant to ship in clients **but verify it has API + package/bundle restrictions in GCP console, and rotate if not**. Flagged HIGH as process, low as actual secrecy impact. (No private-key material anywhere in history — verified.)

**4. Firebase Admin service-account keys on disk in the mobile repo** (`RelationshipApp/secrets/*.json`, gitignored, never committed, referenced by no app code). These can impersonate the backend's Firebase Admin SDK. Move to the backend's secret manager; delete local copies.

### MEDIUM

- **Inconsistent ownership-check pattern** backend-side: some `:userId` routes rely on ad-hoc in-controller checks instead of `requireAuthenticatedUserParamMatch` middleware (e.g. `indexRoutes.ts:377-380` ask-iris routes — controller checks verified correct, but this inconsistency is exactly how #1 slipped through). Standardize on middleware.
- **Unauthenticated `/createCeleb` + `/createCelebUnknownTime`** (`indexRoutes.ts:323-324`) — no auth, no rate limit; data pollution + LLM-cost exhaustion vector.
- No R8/ProGuard (overlaps §1).
- **`deleteAccount()` fakes success client-side** (`profile.ts:48-53`) — GDPR/CCPA + store-policy gap.

### Clean bills of health

Auth token flow sound (fresh Firebase ID token per request; backend verifies via `admin.auth().verifyIdToken()`, no bypass found). Payments correctly server-authoritative (grants only via RevenueCat webhook with `crypto.timingSafeEqual` header check + idempotency — a modified client cannot self-grant). No WebView (no XSS surface), no unencrypted local PII storage, ATS correct, `allowBackup=false`, `__DEV__`-gated logs stripped from release bundles. Recommend adding `network_security_config.xml` with `cleartextTrafficPermitted="false"` for API 24-27 defense-in-depth.

---

## 3. Product & UX

### Top 5 highest-impact improvements

**1. Build a re-engagement channel.** Zero push infrastructure exists (no messaging/notifee/FCM code anywhere; only Firebase `app`+`auth` packages). Every dynamic surface refreshes weekly on Mondays (`RelationshipHoroscopeTab.tsx:204`, `celebThemes/rotation.ts:29-66`) with no way to tell users — no push, no badges, no "new" dots. `NotificationsScreen.tsx` shows toggles for a channel that doesn't exist, backed by a hardcoded stub (`profile.ts:32-46`). Minimum: push on weekly refresh + a daily surface (the disabled "Coming soon" transit-alerts toggle at `NotificationsScreen.tsx:80-86` is the natural candidate; the API already supports `'monthly'` horoscopes but the UI never surfaces it, and there's no `'daily'` period at all).

**2. Add viral/share surfaces.** Zero Share/invite/referral/deep-link code; no `iris://` scheme registered. Partners are one-sided data records (`shared/api/relationshipUsers.ts:163,306`) — never invited, never install. The two-sided partner graph (invite partner → both see the match) is the category's core growth loop (Co-Star/Hint) and it's entirely absent. Shareable result cards (compatibility score, celeb match) are the cheapest first step. Also missing: in-app review prompt — the post-full-analysis reveal is the obvious trigger.

**3. Fix the pay-before-value gate + the 60-vs-50 price bug.** First relationship overview costs 10 credits (`paywall.ts:19`) with no client-side starter grant found — verify the backend seeds new accounts, or first meaningful action = paywall. **Confirmed bug:** button says "Unlock Full Analysis · ◆ 60" (`RelationshipPreviewScreen.tsx:58,670`) but the real price is 50 — the hook (`useRelationshipAnalysisWorkflow.ts:11`) and the backend (`stellium-backend/constants/irisBilling.ts`) both say 50. The label is wrong. Also: displayed prices are hardcoded fallbacks ($14.99/$9.99/$24.99 in `credits.ts:17-20,92`); RevenueCat's localized `priceString` is fetched but only logged (`irisRevenueCatService.ts:96`) — App Store review + intl-pricing risk.

**4. Remove shipped placeholder/stub content (App Review risk).** Users see literal "Placeholder copy until backend interpretations are wired." (`src/utils/placements.ts:47-54` → `PlacementRow.tsx:133-134`). Name/gender edits and account deletion fake success (`profile.ts`). `app.json` still says "Relationship App" while the UI says "Iris"; visible version string is `'Iris v0.1 (dev)'` (`ProfileSettingsScreen.tsx:41`). Terms & Privacy on the Welcome screen look like links but aren't tappable (`WelcomeScreen.tsx:46-49`).

**5. Stop swallowing errors; give failures a retry path.** Bootstrap error = dead end with no retry button (`BootstrapStatusScreen.tsx:11-25`) — user must force-quit. Discover swallows three parallel load failures to `console.log` (`DiscoverScreen.tsx:342,374,408`) and renders failed search as "No results" (`:447`). ProfileReveal's celeb-match polling has no timeout/max-poll cap (`ProfileRevealScreen.tsx:405-448`) — skeleton can spin forever. `FullRelationshipAnalysisScreen.tsx:50` can't distinguish loading from failure. AskScreen's inline error bubble (`AskScreen.tsx:352-356`) is the good pattern — standardize it.

### Other notable findings

- **Onboarding is genuinely well-sequenced** (value before signup: Welcome → 8-step wizard → ProfileReveal → only then CreateAccount; skippable birth time with honest copy; `claimPreview` failure correctly rolls back the half-created Firebase user). Edge fixes: DOB defaults to `1995-01-01`/12:00 and passes validation untouched — silent wrong charts for fast tappers (`CreateSelfProfileScreen.tsx:111-112`); full birth data logged to console in the onboarding path (compliance flag); a hardcoded Timothée Chalamet/Zendaya demo block lives in the production submit handler (`:358-444`).
- **Monetization UX:** gating is inconsistent (some flows pre-check affordability, others fail at submit); out-of-credits mid-chat leaves an orphaned user bubble (`AskScreen.tsx:312,339-341`); `credit_deduction_failed` copy leaks internal billing mechanics to users; a fully built "Welcome to Iris" upsell paywall is never rendered (`SubscriptionPitch.tsx:12,93-99`). First-week-free horoscope framing is well done.
- **UX quality:** only ProfileReveal has a skeleton; HomeScreen has no pull-to-refresh; the two longest AI-text screens render raw `<Text>` so any `**markdown**` shows as literal characters (`FullRelationshipAnalysisScreen.tsx:90-119`, `WeeklyArticleDetailScreen.tsx:64`). Accessibility is thin: 24 `accessibilityLabel`s app-wide vs many icon-only glyph buttons ("←", "✦") with likely sub-44pt targets. Dark-only theme is a defensible aesthetic choice.
- **Copy:** "synastry", "composite", "house placements" appear unglossed with no tooltip/glossary mechanism — the only way to learn a term is to spend an Ask-Iris credit. The chemistry-chip pattern ("Venus-Mars conjunction · magnetic chemistry") is the plain-language model to extend.
- **Marketability — real differentiators to lean on:** celebrity compatibility as a first-class synastry engine; AI chat grounded in user-selected aspects (`AskScreen.tsx:309-329` sends `selectedAspects` — a genuine edge over Co-Star's generic voice); composite "third entity" framing; à-la-carte credit pricing. All currently invisible outside the app.

---

## 4. Dead code & inefficiencies

Verified via a full import-closure trace from `index.js` (221 live files). Key correction to the obvious assumption: **root `src/` is NOT fully dead** — 8 files (2,555 LOC: `src/api/{celebrities,client,external,relationships,users}.ts`, `src/config/firebase.ts`, `src/types/index.ts`, `src/utils/imageHelpers.ts`) plus root `utils/astrologyIcons.tsx` are live via `shared/api/*` shims and direct imports.

### Safe to delete (verified absent from import closure + tests): ~204 files / ~46,800 LOC (~half of repo source)

| Item | Files | LOC |
|---|---|---|
| Root `src/` dead subset (all screens/navigation/hooks/components/services/store/theme/transformers + dead api files) | 193 | ~44,600 |
| `AuthScreen.tsx`, `constants.ts`, `SVGTestComponent.tsx` (zero importers) | 3 | 1,051 |
| `examples/` | 2 | 712 |
| `RelationshipApp/src` dead files: `CountedFilterPills`, `PlaceholderScreen`, `PulsingHeroIcon`, `shape/ShapeBadge`, `shape/ShapePatternCard` (+ orphaned `SelfProfileSuccessScreen` per §3) | 5-6 | ~465 |
| Stale legacy docs (`STELLIUM_WEB_MIGRATION_GUIDE.md` alone is 120KB; `PAYMENT_SYSTEM_ARCHITECTURE.md`, `BACKEND_SUBSCRIPTION_API_SPEC.md`, `CREDIT_*`, `API_AUDIT_REPORT.md`, `API_GUIDE.md`, etc.) | 10 | ~270KB text |
| Dead frontend API functions confirmed 404 against backend: `chatForUserRelationship` (`relationships.ts:175`), `updateProfile` (`relationshipUsers.ts:155`) | — | — |

### Dependencies

- **Zero imports anywhere (remove now):** `react-native-dotenv` (not even in babel config — inert), `react-native-gifted-chat`, `react-native-tab-view`.
- **Used only by dead code (remove after the tree deletion; each has native pods → `pod install` + rebuild):** `react-native-fbsdk-next` (FB pods + AppID ship in today's prod binary — see §1/§2 privacy issue), `@superwall/react-native-superwall`, `@react-native-async-storage/async-storage`, `@react-native-community/datetimepicker`.
- `react-native-reanimated`: zero imports AND its mandatory babel plugin isn't configured (so it can't currently work) — verify no transitive peer need, then remove.

### Needs confirmation

- `RelationshipApp/{android,ios,android-prod,ios-prod}/` are NOT duplicate native projects — each holds one 4KB Firebase config referenced by nothing (builds verifiably use root `android/`+`ios/` configs). Confirm they're not someone's manual source of truth, then delete.
- **Root `CLAUDE.md` is stale** — documents the legacy app (`AuthScreen.tsx`, a root `api.ts` that no longer exists). Rewrite for Iris/RelationshipApp. Same for `RelationshipApp/docs/SIGNUP_FLOW.md` and `README.md` ("Ask Stellium").

### Structural recommendation: collapse the 3-hop API layering

Live code threads root `src/api/*` → `shared/api/*` 1-line re-export shims → `RelationshipApp/src/api/index.ts`. There are **two live HTTP clients** with near-identical methods (`src/api/client.ts` 352 LOC vs `shared/api/baseClient.ts` 280 LOC), three files named `relationships.ts`, and two different modules named `astrologyIcons.tsx` (root 170 LOC vs shared 76 LOC — forked content, both live). Moving the 8 live root-src files into `shared/` lets root `src/` be deleted wholesale, kills the `../../src` back-imports, and takes `tsc` from 362 errors to ~5.

### Inefficiencies

- `FullAnalysisSection.tsx` is **2,264 lines**; 8 more screens exceed 800 (RelationshipPreview 1,473; Discover 1,348; AddConnection 1,302; CreateSelfProfile 1,034; …).
- `DiscoverScreen.tsx` renders every list via `.map()` inside ScrollViews — 11 maps across 7 ScrollViews (e.g. :834, :946, :989, :994); celebrity/subject lists grow unbounded → convert long ones to `FlatList`. Milder in `HistoryScreen.tsx`.
- 300 LOC of demo mock data (`mocks/demoData.ts`) ships in the release bundle behind a compile-time-false flag.
- Polling loops are clean (proper cleanup); minor: `baseClient.poll()` has no external cancellation, so an unmounted caller's poll runs to timeout.
- Local disk: `android/` holds 2.7GB of build artifacts (`gradle clean` reclaims).

---

## 5. API contract verification (vs `../stellium-backend`)

**Bottom line: healthy.** Every endpoint the live app exercises exists, matches method/path, and returns shapes the app parses correctly. Credit costs fully aligned both sides (ask 1, guest 1, overview 10, full analysis 50, weekly horoscope 2). Error contract holds end-to-end (`ApiError.code` ↔ backend `code`; 402 `INSUFFICIENT_CREDITS`, 429 `LIMIT_REACHED`, 404-as-data for horoscope/weekly-article all correct).

### Confirmed broken (dormant today — delete or fix before wiring)

1. `POST /chatForUserRelationship` (`relationships.ts:175`) → backend removed it ("legacy chat endpoints removed", `indexRoutes.ts:342`). Delete.
2. `PUT /users/:userId` (`relationshipUsers.ts:155` `updateProfile`) → backend only has `PUT /users/:userId/profile`. **This is the function someone will reach for when wiring the profile-edit TODOs — it will 404.**

### Drift (works today, fragile)

- **Workflow status enums don't line up:** backend emits `paused`/`not_started`/`pending`; frontend declares `paused_after_scores`/`unknown` (never emitted) and its terminal set misses `paused` → **a paused workflow would poll forever at 3s intervals.** Only mitigated because the app always starts with `immediate: true`. (`stepFunctionsWorkflowController.ts:833-886` vs `src/api/relationships.ts:495-507`, `useRelationshipAnalysisWorkflow.ts:13-18`.)
- **`clusterScoring` never present** on `/getUserCompositeCharts` rows — 6 consumers read it, all silently fall through to the `relationshipAnalysisStatus` fallback; first lookup branch is dead weight.
- **`compositeChart` never present** on `/getCelebRelationships` rows (backend stores `compositeBirthChart`, never maps it) — celebrity pairs silently render without composite placements/aspects. Likely an unnoticed feature regression.
- Chat-history `limit` means message *pairs* server-side → app asking for 20 gets up to 40. Harmless over-fetch.
- Envelope inconsistency by design (3 bare-array endpoints, 1 bare-object) — tolerated because the client keys off HTTP status, but any new code checking `response.success` on those endpoints would misbehave.
- `clientProduct` is sent on every relationshipUsers call and read by nothing backend-side; entitlements `credits.total === credits.purchased` always (distinction is illusory).
- The Nov-2025 spec docs (`BACKEND_SUBSCRIPTION_API_SPEC.md`, `CREDIT_GATING_INTEGRATION.md`) describe an older design — the docs are stale, not the code (also listed for deletion in §4).

---

## 6. Recommended action plan

**Phase 0 — this week (security-critical):**
1. Backend: fix the enhanced-relationship-analysis IDOR (ownership middleware + controller check; kill the unauthenticated route variant).
2. Backend: auth/rate-limit `/createCeleb*`.
3. Verify GCP restrictions on the git-history-exposed Google API key; rotate if unrestricted. Move service-account JSONs out of the mobile repo.

**Phase 1 — ship-readiness (1-2 weeks):**
4. Crashlytics + root ErrorBoundary; fix 2 failing tests + Jest transform; add CI (tsc/lint/jest).
5. Fix live-code TS errors (esp. `FullRelationshipAnalysisScreen.tsx:120`), the 60→50 price label, and the workflow terminal-status set.
6. Wire real account deletion + profile edits (backend endpoint exists, unwired); remove placeholder interpretation copy; make Terms/Privacy tappable; fix empty location purpose string; remove FB SDK.
7. Android track (if shipping Android): release keystore, `goog_` RevenueCat key, R8, versionCode.

**Phase 2 — repo health (1 week, huge leverage):**
8. Move the 8 live root-`src` files into `shared/`, then delete the ~204 dead files (~47K LOC), 3+ unused deps, and 10 stale docs; rewrite `CLAUDE.md`. This takes `tsc` from 362 errors to ~5 and makes lint/type gates enforceable.
9. Consolidate the two HTTP clients and two `astrologyIcons` modules.

**Phase 3 — growth (the product bets):**
10. Push notifications (weekly refresh first, then a daily transit surface).
11. Shareable result cards + partner invite deep link; in-app review prompt after full-analysis reveal.
12. Use RevenueCat `priceString` for localized prices; standardize credit gating (pre-check affordability everywhere); render markdown on long AI-text screens; add retry to bootstrap; glossary tooltips for astrology jargon.

---

*Full per-dimension detail with additional file:line citations available in the audit session transcripts. Nothing in this audit modified any file in either repo.*
