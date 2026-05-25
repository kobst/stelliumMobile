# Iris Billing Branch Strategy

Status: Superseded for release direction on May 25, 2026. Iris mobile launch
is now planned around worldwide Apple In-App Purchase, with RevenueCat as the
integration layer. Stripe checkout remains parked for possible future
U.S.-only external checkout optimization.

## Product Contract

Iris and Stellium share some product concepts, but their billing data and
purchase experiences must remain separate.

| App | Product | Price | Credit Grant |
| --- | --- | --- | --- |
| Iris | Target IAP products and entitlements | See backend canonical product spec | See backend canonical product spec |
| Stellium | Stellium products | Existing catalog | Existing Stellium entitlement logic |

The mobile app presents purchases and reads balances. The Iris backend ledger
remains authoritative for spendable credits and credit-consuming features.
The canonical target contract is maintained in backend
`docs/IRIS_CREDIT_PRICING_PRODUCT_SPEC.md`; the current mobile billing screens
still represent the prior catalog until the IAP migration is implemented.

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

### Stripe Web Checkout Branch - Parked

- Launching Stripe Checkout in Safari.
- Browser completion and cancellation return flow.
- `iris://checkout/*` navigation support and native URL scheme registration.
- Refreshing entitlements after a user returns from browser checkout.

### RevenueCat Native Branch - Intended Mobile Release Path

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

The RevenueCat branch is the intended mobile release path. The Stripe branch
preserves a possible U.S.-only alternative, but is parked for the worldwide
IAP-first release.

## Environments And Testing

The currently validated development flow remains Stripe sandbox checkout until
the RevenueCat/IAP branch is configured and deployed for development.
RevenueCat Test Store configuration must not ship in a production build.

Frontend branches alone do not provide independent end-to-end environments. The
selected frontend branch must point at a backend stage that supports the same
Iris provider path.

## Change Rules

1. Put catalog, pricing copy, and provider-neutral balance display work in
   `feature/iris-billing-foundation` first.
2. Merge foundation updates into both provider branches.
3. Keep Safari checkout, browser return, and URL-scheme behavior in the parked
   Stripe branch.
4. Build the intended worldwide mobile release through RevenueCat and Apple
   IAP on the RevenueCat branch.
5. Do not couple Iris purchase work to Stellium mobile billing configuration.

## Parked Stripe Work

- Retain the external checkout code for possible future U.S.-only margin
  optimization.
- Do not ship external Stripe purchase controls as part of the worldwide
  IAP-first mobile release.

## Active RevenueCat/IAP Work

Update the RevenueCat branch catalog and entitlement behavior to the canonical
backend product spec, then configure matching App Store Connect products and
RevenueCat offerings.

## Existing RevenueCat Test Configuration

The Test Store catalog configured for this branch reflects the earlier product
proposal and must be updated before release:

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
after the native purchase completes. The product mapping and grant behavior
must be migrated to the canonical IAP product spec.
