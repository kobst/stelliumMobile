import React, { useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../theme';
import { useRelationshipAppStore } from '../store';
import { CREDIT_PACKAGES, getBillingProducts } from '../api/credits';

export type SubscriptionPitchMode = 'settings' | 'paywall' | 'upsell';

export interface SubscriptionPitchPendingAction {
  label: string;
  missingCredits?: number;
  onComplete?: () => void;
}

interface SubscriptionPitchProps {
  mode: SubscriptionPitchMode;
  pendingAction?: SubscriptionPitchPendingAction;
  onPressPack?: (packageId: string) => void;
  onPressSubscribe?: () => void;
}

const PERKS: readonly string[] = [
  'Ask Iris, scores, and weekly forecasts included',
  '4 full relationship analyses each month',
  'Purchased credit packs never expire',
];

function formatDayMonth(iso: string | null): string | null {
  if (!iso) {
    return null;
  }
  const parts = iso.split('-');
  if (parts.length !== 3) {
    return null;
  }
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  const monthIndex = Number(parts[1]) - 1;
  const day = Number(parts[2]);
  if (monthIndex < 0 || monthIndex > 11 || Number.isNaN(day)) {
    return null;
  }
  return `${months[monthIndex]} ${day}`;
}

export function SubscriptionPitch({
  mode,
  pendingAction,
  onPressPack,
  onPressSubscribe,
}: SubscriptionPitchProps) {
  const { colors } = useTheme();
  const credits = useRelationshipAppStore((state) => state.credits);
  const subscription = useRelationshipAppStore((state) => state.subscription);
  const [creditPackages, setCreditPackages] = useState(CREDIT_PACKAGES);
  const [monthlyPriceLabel, setMonthlyPriceLabel] = useState('$14.99');

  useEffect(() => {
    let active = true;
    getBillingProducts()
      .then((products) => {
        if (!active) {
          return;
        }
        setCreditPackages(products.creditPacks);
        const monthly = products.plans.find((plan) => plan.productKey === 'IRIS_SUB_MONTHLY');
        setMonthlyPriceLabel(monthly?.priceLabel ?? '$14.99');
      })
      .catch(() => {
        // Keep the Iris-only fallback catalog when product discovery is unavailable.
      });
    return () => {
      active = false;
    };
  }, []);

  const isSubscribed = subscription ? subscription.tier !== 'free' : false;

  const header = useMemo(() => {
    if (mode === 'paywall') {
      const missing = pendingAction?.missingCredits ?? null;
      const title = missing
        ? `You need ${missing} more credit${missing === 1 ? '' : 's'}`
        : 'Keep exploring with Iris Monthly';
      const subtitle = pendingAction?.label
        ? `to ${pendingAction.label.toLowerCase()}.`
        : 'Subscribe for included everyday features and four full analyses each month.';
      return { title, subtitle, centered: false };
    }
    if (mode === 'upsell') {
      return {
        title: 'Welcome to Iris',
        subtitle:
          'Unlock everyday relationship guidance and four full analyses each month.',
        centered: true,
      };
    }
    return {
      title: 'Iris Monthly',
      subtitle: 'Everyday guidance included, plus four full relationship analyses each month.',
      centered: true,
    };
  }, [mode, pendingAction]);

  const handlePackPress = (packageId: string) => {
    if (onPressPack) {
      onPressPack(packageId);
    }
  };

  const handleSubscribePress = () => {
    if (onPressSubscribe) {
      onPressSubscribe();
    }
  };

  const renewalShort = formatDayMonth(credits?.planRenewsAt ?? null);
  const planCreditsTotal = credits?.fullAnalysesLimit ?? 4;
  const planCreditsUsed = credits
    ? Math.max(planCreditsTotal - credits.fullAnalysesRemaining, 0)
    : null;
  const planProgress =
    planCreditsUsed !== null && planCreditsTotal > 0
      ? Math.min(Math.max(planCreditsUsed / planCreditsTotal, 0), 1)
      : 0;

  return (
    <View style={styles.wrap}>
      <View style={header.centered ? styles.centeredHeader : styles.header}>
        {mode === 'paywall' ? (
          <Text style={[styles.eyebrow, { color: colors.accent }]}>
            {pendingAction?.label ? 'To continue' : 'Iris Monthly'}
          </Text>
        ) : null}
        {mode === 'upsell' ? <Text style={styles.upsellGlyph}>✦</Text> : null}
        <Text
          style={[
            styles.title,
            { color: colors.text },
            header.centered ? styles.centeredText : null,
          ]}
        >
          {header.title}
        </Text>
        <Text
          style={[
            styles.subtitle,
            { color: colors.textMuted },
            header.centered ? styles.centeredText : null,
          ]}
        >
          {header.subtitle}
        </Text>
      </View>

      {isSubscribed && mode === 'settings' ? (
        <View
          style={[
            styles.planCard,
            { backgroundColor: colors.surface, borderColor: colors.ghostBorder },
          ]}
        >
          <View style={[styles.activeBadge, { backgroundColor: colors.primary }]}>
            <Text style={[styles.activeBadgeText, { color: colors.onPrimary }]}>
              ✦ Active
            </Text>
          </View>
          <Text style={[styles.planName, { color: colors.text }]}>
            {credits?.planName ?? 'Iris Monthly'}
          </Text>

          <View style={styles.statRow}>
            <StatCell label="Analyses/mo" value={`${planCreditsTotal}`} />
            <StatCell label="Price" value={credits?.planPriceLabel ?? '—'} />
            <StatCell label="Renews" value={renewalShort ?? '—'} />
          </View>

          <View style={styles.splitRow}>
            <View style={[styles.splitCard, { backgroundColor: colors.surfaceHigh }]}>
              <Text style={[styles.splitLabel, { color: colors.textSubtle }]}>Full analyses</Text>
              <Text style={[styles.splitValue, { color: colors.text }]}>
                {credits?.fullAnalysesRemaining ?? 0}
                <Text style={[styles.splitUnit, { color: colors.textSubtle }]}>  remaining</Text>
              </Text>
              {renewalShort ? (
                <Text style={[styles.splitCaption, { color: colors.textSubtle }]}>
                  Resets {renewalShort}
                </Text>
              ) : null}
              <View style={[styles.progressTrack, { backgroundColor: colors.ghostBorder }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.round(planProgress * 100)}%`,
                      backgroundColor: colors.primary,
                    },
                  ]}
                />
              </View>
            </View>
            <View style={[styles.splitCard, { backgroundColor: colors.surfaceHigh }]}>
              <Text style={[styles.splitLabel, { color: colors.textSubtle }]}>Purchased</Text>
              <Text style={[styles.splitValue, { color: colors.text }]}>
                {credits?.purchased ?? 0}
                <Text style={[styles.splitUnit, { color: colors.textSubtle }]}>  credits</Text>
              </Text>
              <Text style={[styles.splitCaption, { color: colors.success }]}>Never expire</Text>
            </View>
          </View>
        </View>
      ) : (
        <View
          style={[
            styles.perksCard,
            { backgroundColor: colors.surface, borderColor: colors.ghostBorder },
          ]}
        >
          {PERKS.map((perk) => (
            <View key={perk} style={styles.perkRow}>
              <Text style={[styles.perkGlyph, { color: colors.success }]}>✓</Text>
              <Text style={[styles.perkText, { color: colors.text }]}>{perk}</Text>
            </View>
          ))}
        </View>
      )}

      <Text style={[styles.sectionLabel, { color: colors.accent }]}>
        {isSubscribed && mode === 'settings' ? 'Buy More Credits' : 'Or buy a credit pack'}
      </Text>
      <View style={styles.packRow}>
        {creditPackages.map((pkg) => {
          const isBest = pkg.bonusLabel === 'Most popular' || pkg.bonusLabel === 'Best value';
          return (
            <TouchableOpacity
              key={pkg.id}
              onPress={() => handlePackPress(pkg.id)}
              activeOpacity={0.85}
              style={[
                styles.packTile,
                {
                  backgroundColor: colors.surface,
                  borderColor: isBest
                    ? 'rgba(202, 190, 255, 0.3)'
                    : colors.ghostBorder,
                },
              ]}
            >
              {isBest ? (
                <View style={[styles.packRibbon, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.packRibbonText, { color: colors.onPrimary }]}>
                    {pkg.bonusLabel}
                  </Text>
                </View>
              ) : null}
              <Text style={[styles.packAmount, { color: colors.text }]}>{pkg.credits}</Text>
              <Text style={[styles.packUnit, { color: colors.textMuted }]}>credits</Text>
              <Text style={[styles.packPrice, { color: colors.text }]}>{pkg.priceLabel}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {!isSubscribed || mode !== 'settings' ? (
        <>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleSubscribePress}
            style={[styles.subscribeButton, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.subscribeText, { color: colors.onPrimary }]}>
              Subscribe · {credits?.planPriceLabel ?? monthlyPriceLabel}/month
            </Text>
          </TouchableOpacity>
          <Text style={[styles.cancelCaption, { color: colors.textSubtle }]}>Cancel anytime</Text>
        </>
      ) : null}
    </View>
  );
}

interface StatCellProps {
  label: string;
  value: string;
}

function StatCell({ label, value }: StatCellProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.statCell, { backgroundColor: 'rgba(255,255,255,0.03)' }]}>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textSubtle }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 14,
  },
  header: {
    gap: 8,
  },
  centeredHeader: {
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
  },
  upsellGlyph: {
    fontSize: 34,
    marginBottom: 4,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  centeredText: {
    textAlign: 'center',
  },
  planCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 20,
    gap: 14,
  },
  activeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  planName: {
    fontSize: 24,
    fontWeight: '700',
  },
  statRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCell: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  splitRow: {
    flexDirection: 'row',
    gap: 10,
  },
  splitCard: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  splitLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  splitValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  splitUnit: {
    fontSize: 11,
    fontWeight: '400',
  },
  splitCaption: {
    fontSize: 11,
  },
  progressTrack: {
    height: 4,
    borderRadius: 4,
    marginTop: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  perksCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 20,
    gap: 12,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  perkGlyph: {
    fontSize: 13,
  },
  perkText: {
    fontSize: 14,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: 10,
  },
  packRow: {
    flexDirection: 'row',
    gap: 10,
  },
  packTile: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 2,
    position: 'relative',
  },
  packRibbon: {
    position: 'absolute',
    top: -10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 100,
  },
  packRibbonText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  packAmount: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 2,
  },
  packUnit: {
    fontSize: 11,
    marginBottom: 6,
  },
  packPrice: {
    fontSize: 14,
    fontWeight: '700',
  },
  manageFooter: {
    borderTopWidth: 1,
    paddingTop: 16,
    marginTop: 6,
    gap: 10,
  },
  manageFooterBody: {
    fontSize: 13,
    lineHeight: 19,
  },
  manageFooterAction: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  subscribeButton: {
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 6,
  },
  subscribeText: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  cancelCaption: {
    fontSize: 12,
    textAlign: 'center',
  },
});
