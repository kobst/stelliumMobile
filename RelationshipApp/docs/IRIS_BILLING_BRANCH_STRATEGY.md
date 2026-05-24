# Iris Billing Branch Strategy

Status: Active development plan, established May 23, 2026.

## Product Contract

Iris and Stellium share some product concepts, but their billing data and
purchase experiences must remain separate.

| App | Product | Price | Credit Grant |
| --- | --- | --- | --- |
| Iris | Iris Monthly (`IRIS_MONTHLY`) | $20.00 / month | 200 monthly credits |
| Iris | Iris Credit Pack - 100 Credits (`IRIS_CREDITS_100`) | $10.00 one time | 100 non-expiring credits |
| Stellium | Stellium products | Existing catalog | Existing Stellium entitlement logic |

The mobile app presents purchases and reads balances. The Iris backend ledger
remains authoritative for spendable credits and credit-consuming features.

## Branch Model

| Branch | Role |
| --- | --- |
| `feature/iris-billing-foundation` | Provider-neutral Iris catalog, pricing display, and entitlement UI. |
| `feature/iris-stripe-web-checkout` | Stripe-hosted browser checkout and mobile return-link experience. |
| `feature/iris-revenuecat-native` | RevenueCat-driven native in-app purchase experience. |

Provider branches should receive shared pricing and entitlement UI changes from
the foundation. They should not push provider-specific purchase behavior back
into the foundation.

## Frontend Ownership

### Foundation

- The two-product Iris catalog and customer-facing prices.
- Credit balance, membership, and credit history presentation.
- Backend entitlement reads and provider-neutral UI states.
- Removal of deprecated Iris pack options and annual-plan copy.

### Stripe Web Checkout Branch

- Launching Stripe Checkout in Safari.
- Browser completion and cancellation return flow.
- `iris://checkout/*` navigation support and native URL scheme registration.
- Refreshing entitlements after a user returns from browser checkout.

### RevenueCat Native Branch

- Iris-specific RevenueCat SDK configuration.
- Loading the Iris RevenueCat offering and packages.
- Native purchases for monthly membership and the 100-credit pack.
- Native restore and subscription-management behavior.
- Refreshing backend entitlements after validated purchase fulfillment.

## User Experience Difference

The Stripe path leaves the app for hosted checkout and returns through a
browser page with an app-open link. The RevenueCat path purchases inside the
mobile app through the platform payment sheet and should not normally use the
Stripe browser return flow.

The Stripe branch remains useful for future Iris web purchases. The RevenueCat
branch is the planned native mobile release path.

## Environments And Testing

The currently validated development flow is Stripe sandbox checkout. RevenueCat
native development must use an Iris-only Test Store configuration and must not
ship a Test Store key in a production build.

Frontend branches alone do not provide independent end-to-end environments. The
selected frontend branch must point at a backend stage that supports the same
Iris provider path.

## Change Rules

1. Put catalog, pricing copy, and provider-neutral balance display work in
   `feature/iris-billing-foundation` first.
2. Merge foundation updates into both provider branches.
3. Keep Safari checkout, browser return, and URL-scheme behavior in the Stripe
   branch.
4. Keep RevenueCat initialization and native purchase actions in the
   RevenueCat branch until accepted.
5. Do not couple Iris purchase work to Stellium mobile billing configuration.

## RevenueCat Native Configuration

The Test Store catalog configured for this branch is:

| Iris Product | RevenueCat Product ID | Package |
| --- | --- | --- |
| `IRIS_MONTHLY` | `iris_monthly_200_credits` | `$rc_monthly` |
| `IRIS_CREDITS_100` | `iris_credits_100` | `credits_100` |

The configured offering identifier is `iris_default`.

For development builds, set `IRIS_REVENUECAT_API_KEY` in
`RelationshipApp/.env.dev` to the RevenueCat Test Store public API key. Do not
put a Test Store key in a production build.

After purchase, RevenueCat must deliver events to the Iris backend webhook so
the server-side credit ledger is updated; the mobile UI refreshes that ledger
after the native purchase completes.
