import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../theme';
import { SERIF_FONT } from '../theme/typography';
import type { CreditsState, SubscriptionState } from '../store';

interface CreditsMembershipCardProps {
  credits: CreditsState | null;
  subscription: SubscriptionState | null;
  onBuyCredits: () => void;
}

function formatRenewalDate(iso: string | null): string | null {
  if (!iso) {
    return null;
  }
  const parts = iso.split('-');
  if (parts.length !== 3) {
    return null;
  }
  const monthIndex = Number(parts[1]) - 1;
  const day = Number(parts[2]);
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  if (monthIndex < 0 || monthIndex > 11 || Number.isNaN(day)) {
    return null;
  }
  return `${months[monthIndex]} ${day}`;
}

export function CreditsMembershipCard({
  credits,
  subscription,
  onBuyCredits,
}: CreditsMembershipCardProps) {
  const { colors } = useTheme();
  const renewalShort = formatRenewalDate(credits?.planRenewsAt ?? null);
  const balanceText = credits ? credits.balance.toLocaleString() : '—';
  const renewalLine =
    credits?.planName && credits.planRenewsAt && credits.planPriceLabel
      ? `${credits.planName} renews ${renewalShort ?? credits.planRenewsAt} for ${credits.planPriceLabel}${
          credits.fullAnalysesLimit ? ` · ${credits.fullAnalysesLimit} full analyses/mo` : ''
        }`
      : null;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surfaceLow },
      ]}
    >
      <View style={styles.topRow}>
        <View>
          <Text style={[styles.eyebrow, { color: colors.textMuted }]}>Purchased Credits</Text>
          <Text style={[styles.balance, { color: colors.text }]}>
            {balanceText}
            <Text style={[styles.balanceUnit, { color: colors.textMuted }]}> credits</Text>
          </Text>
        </View>
        {subscription && subscription.tier !== 'free' ? (
          <View style={[styles.subBadge, { backgroundColor: colors.primary }]}>
            <Text style={[styles.subBadgeText, { color: colors.onPrimary }]}>
              ✦ {subscription.label}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.breakdown}>
        <View style={[styles.breakdownItem, { backgroundColor: colors.surfaceHigh }]}>
          <Text style={[styles.breakdownLabel, { color: colors.textMuted }]}>Full analyses</Text>
          <Text style={[styles.breakdownValue, { color: colors.text }]}>
            {credits?.fullAnalysesRemaining ?? 0}
          </Text>
          {renewalShort ? (
            <Text style={[styles.breakdownSub, { color: colors.textSubtle }]}>
              of {credits?.fullAnalysesLimit ?? 0} left until {renewalShort}
            </Text>
          ) : null}
        </View>
        <View style={[styles.breakdownItem, { backgroundColor: colors.surfaceHigh }]}>
          <Text style={[styles.breakdownLabel, { color: colors.textMuted }]}>Purchased</Text>
          <Text style={[styles.breakdownValue, { color: colors.text }]}>
            {credits?.purchased ?? 0}
          </Text>
          <Text style={[styles.breakdownSub, { color: colors.textSubtle }]}>never expire</Text>
        </View>
      </View>

      {renewalLine ? (
        <Text style={[styles.renewalLine, { color: colors.textSubtle }]}>{renewalLine}</Text>
      ) : null}

      <TouchableOpacity
        style={[styles.primaryButton, { backgroundColor: colors.primary }]}
        onPress={onBuyCredits}
        activeOpacity={0.85}
      >
        <Text style={[styles.primaryButtonText, { color: colors.onPrimary }]}>Buy credits</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 22,
    gap: 16,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  balance: {
    fontFamily: SERIF_FONT,
    fontSize: 44,
    fontWeight: '500',
    fontStyle: 'italic',
    letterSpacing: -0.6,
    lineHeight: 48,
  },
  balanceUnit: {
    fontFamily: SERIF_FONT,
    fontSize: 16,
    fontStyle: 'italic',
    fontWeight: '400',
  },
  subBadge: {
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  subBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  breakdown: {
    flexDirection: 'row',
    gap: 8,
  },
  breakdownItem: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 2,
  },
  breakdownLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  breakdownValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  breakdownSub: {
    fontSize: 11,
  },
  renewalLine: {
    fontSize: 12,
    lineHeight: 16,
  },
  primaryButton: {
    borderRadius: 18,
    paddingVertical: 16,
  },
  primaryButtonText: {
    fontFamily: SERIF_FONT,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.05,
  },
});
