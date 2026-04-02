# RelationshipApp

This directory is the new relationship-first mobile app scaffold.

It is intentionally isolated from the current `StelliumApp` shell so we can:

- reuse backend integrations
- define a new product surface
- avoid leaking horoscope-first navigation and state into the new app

Current status:

- app shell scaffolded
- shared API bridge modules added under `shared/`
- screens are placeholders for the onboarding-to-preview vertical slice

Implementation should proceed in this order:

1. shared module hardening
2. onboarding-to-preview flow
3. unlock flow
4. full report
5. Ask Stellium
