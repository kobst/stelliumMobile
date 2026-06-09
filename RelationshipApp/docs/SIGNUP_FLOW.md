# Relationship App Signup Flow

This document describes the current first-run/signup flow in the relationship app as it exists today.

It covers:
- the implemented entry flow
- the difference between development local UX mode and live auth mode
- the first-run screens and decisions
- simple wireframes for product review

## Summary

The relationship app currently starts with a lightweight onboarding flow:

1. Welcome
2. Create self profile
3. Choose target type
4. Continue into either:
   - real person flow
   - celebrity selection flow

In development, `Get Started` uses a local UX session by default so product flow can be tested without Firebase blocking the front door.

## Modes

### Development Local UX Mode

Current default in dev builds:
- user taps `Get Started`
- app creates a local signed-in state
- app skips Firebase dependency at the front door
- user proceeds directly to self-profile creation

Purpose:
- validate UX quickly
- avoid auth/config friction during product iteration

### Live/Auth-Backed Mode

When local UX mode is disabled:
- `Get Started` attempts Firebase session creation
- self-profile creation uses live romantic self-profile APIs
- subsequent relationship preview/full-analysis calls use live endpoints

## Flow Overview

```text
Welcome
  |
  v
Create Self Profile
  |
  v
Choose Target Type
  |                     \
  v                      v
Someone I Know         Celebrity
  |                      |
  v                      v
Create Partner        Select Celebrity
  |                      |
  \__________  __________/
             \/
      Shared Preview Start
             |
             v
   Relationship Preview
             |
             v
          Unlock
             |
             v
    Full Relationship Analysis
```

## Screen-by-Screen

### 1. Welcome

Purpose:
- establish product framing
- let user enter the app

Current actions:
- `Get Started`
- `Preview The App`

Behavior:
- in dev local UX mode, `Get Started` pushes directly into self-profile creation
- in live mode, `Get Started` attempts auth-backed session setup

Wireframe:

```text
+--------------------------------------------------+
| RELATIONSHIP APP                                |
|                                                  |
| Understand your chemistry before you invest      |
| your heart.                                      |
|                                                  |
| Start with your own profile, then explore        |
| attraction, communication, conflict patterns,    |
| and long-term compatibility.                     |
|                                                  |
| [ Get Started ]                                  |
| [ Preview The App ]                              |
+--------------------------------------------------+
```

### 2. Create Self Profile

Purpose:
- create the persistent “You” profile the app reuses

Current fields:
- first name
- last name
- gender
- date of birth
- birth time / birth time unknown
- birth location

Behavior:
- place field supports Google place suggestions
- in local UX mode, typed place is sufficient to proceed
- in live mode, location is resolved before submitting romantic self-profile creation

Wireframe:

```text
+--------------------------------------------------+
| YOU                                              |
| Create the one profile this app will reuse.      |
|                                                  |
| Identity                                         |
| [ First name                                  ]  |
| [ Last name                                   ]  |
| [ Gender                                      ]  |
|                                                  |
| Birth data                                       |
| [ YYYY-MM-DD                                  ]  |
| ( ) Birth time unknown                           |
| [ HH:MM                                       ]  |
|                                                  |
| Birth location                                   |
| [ Search place...                              ]  |
|   -> place suggestions dropdown                  |
|                                                  |
| [ Save Profile ]                                 |
| [ Back ]                                         |
+--------------------------------------------------+
```

### 3. Choose Target Type

Purpose:
- route the user into the correct target acquisition branch

Current options:
- `Someone I Know`
- `Celebrity`

Wireframe:

```text
+--------------------------------------------------+
| TARGET                                           |
| Choose who you want to analyze.                  |
|                                                  |
| [ Someone I Know ]                               |
| [ Celebrity ]                                    |
+--------------------------------------------------+
```

### 4A. Real Person Branch

Purpose:
- collect a partner’s birth data
- create guest subject
- start shared preview flow

Current steps:
- enter partner identity
- enter partner birth data
- enter partner birth location
- tap `Generate Preview`

Wireframe:

```text
+--------------------------------------------------+
| REAL PERSON                                      |
| Create a partner profile and request the first   |
| live compatibility preview.                      |
|                                                  |
| [ Partner first name                           ] |
| [ Partner last name                            ] |
| [ Gender                                       ] |
| [ YYYY-MM-DD                                   ] |
| [ HH:MM                                        ] |
| [ Search place...                              ] |
|                                                  |
| [ Generate Preview ]                             |
+--------------------------------------------------+
```

### 4B. Celebrity Branch

Purpose:
- fetch and search celebrities from the shared celebrity dataset
- select one celebrity subject
- feed the same preview flow used by the real-person branch

Current steps:
- search celebrities
- tap a celebrity card
- confirm with `Use This Celebrity`
- return to Home
- tap `Start Celebrity Preview`

Wireframe:

```text
+--------------------------------------------------+
| CELEBRITY                                        |
| Choose from the shared celebrity dataset.        |
|                                                  |
| [ Search celebrities...                        ] |
|                                                  |
| + Celebrity Card                               + |
| | Ariana Grande                                | |
| | 1993-06-26                                   | |
| | Boca Raton, Florida, USA                     | |
| +----------------------------------------------+ |
|                                                  |
| [ Use This Celebrity ]                           |
| [ Back ]                                         |
+--------------------------------------------------+
```

### 5. Shared Preview Start

This is now unified.

Only target acquisition differs:
- real person: create guest subject first
- celebrity: use selected celebrity subject directly

After that, both paths do the same thing:
- call `enhancedRelationshipAnalysis(...)`
- store preview result
- navigate to preview screen

### 6. Relationship Preview

Purpose:
- show initial scores and overview
- act as the free preview surface

Current content:
- overall compatibility
- tier/profile
- 5 cluster scores
- dominant/challenge clusters
- initial overview

Wireframe:

```text
+--------------------------------------------------+
| PREVIEW                                          |
| Alex and Ariana                                  |
|                                                  |
| "Initial overview text..."                       |
|                                                  |
| Overall compatibility: 76%                       |
| Tier: Flourishing                                |
|                                                  |
| [ Harmony ] [ Passion ]                          |
| [ Connection ] [ Stability ]                     |
| [ Growth ]                                       |
|                                                  |
| [ See Unlock Flow ]                              |
| [ Start Another Preview ]                        |
+--------------------------------------------------+
```

## Current Product Notes

- The signup/onboarding flow is functional, but still intentionally plain.
- The first-run UX is usable for testing and product review.
- The entry flow is not yet polished as final production onboarding.
- Dev session tools still exist elsewhere in the app for QA/reset, but the front door is more product-like now.

## Current Gaps

- final production auth UX is not done
- celebrity branch currently starts preview from the home shell after selection instead of flowing immediately in one step
- onboarding copy and visual design are still MVP-level
- no dedicated “account creation complete” transition moment yet

## Recommended Next UX Iterations

1. Collapse celebrity selection and preview start into a single continuous flow.
2. Add a stronger post-profile success transition before target selection.
3. Replace placeholder-style onboarding copy with final product copy.
4. Revisit whether `Preview The App` should remain visible on the first screen.
