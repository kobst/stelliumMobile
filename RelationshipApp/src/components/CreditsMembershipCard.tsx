import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../theme';
import type { CreditsState, SubscriptionState } from '../store';

interface CreditsMembershipCardProps {
  credits: CreditsState | null;
  subscription: SubscriptionState | null;
  onBuyCredits: () => void;
  onManagePlan: () => void;
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
  onManagePlan,
}: CreditsMembershipCardProps) {
  const { colors } = useTheme();
  const renewalShort = formatRenewalDate(credits?.planRenewsAt ?? null);
  const balanceText = credits ? credits.balance.toLocaleString() : '—';
  const renewalLine =
    credits?.planName && credits.planRenewsAt && credits.planPriceLabel
      ? `${credits.planName} renews ${renewalShort ?? credits.planRenewsAt} for ${credits.planPriceLabel}${
          credits.planCreditsPerCycle ? ` · ${credits.planCreditsPerCycle} credits/mo` : ''
        }`
      : null;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.ghostBorder,
        },
      ]}
    >
      <View style={styles.topRow}>
        <View>
          <Text style={[styles.eyebrow, { color: colors.textMuted }]}>Current Balance</Text>
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
          <Text style={[styles.breakdownLabel, { color: colors.textMuted }]}>From plan</Text>
          <Text style={[styles.breakdownValue, { color: colors.text }]}>
            {credits?.fromPlan ?? 0}
          </Text>
          {renewalShort ? (
            <Text style={[styles.breakdownSub, { color: colors.textSubtle }]}>
              resets {renewalShort}
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

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: colors.primary }]}
          onPress={onBuyCredits}
          activeOpacity={0.85}
        >
          <Text style={[styles.primaryButtonText, { color: colors.onPrimary }]}>Buy credits</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.secondaryButton,
            { backgroundColor: colors.surfaceHigh, borderColor: colors.ghostBorder },
          ]}
          onPress={onManagePlan}
          activeOpacity={0.85}
        >
          <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Manage plan</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 20,
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
    fontSize: 38,
    fontWeight: '700',
    lineHeight: 44,
  },
  balanceUnit: {
    fontSize: 15,
    fontWeight: '500',
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
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
