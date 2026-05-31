import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../theme';
import { CREDIT_PACKAGES, getBillingProducts, type CreditPackage } from '../api/credits';

interface PurchaseCreditsSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelectPackage: (pkg: CreditPackage) => void;
  isPurchasing?: boolean;
}

export function PurchaseCreditsSheet({
  visible,
  onClose,
  onSelectPackage,
  isPurchasing = false,
}: PurchaseCreditsSheetProps) {
  const { colors } = useTheme();
  const [creditPackages, setCreditPackages] = useState(CREDIT_PACKAGES);

  useEffect(() => {
    if (!visible) {
      return;
    }
    let active = true;
    getBillingProducts()
      .then((products) => {
        if (active) {
          setCreditPackages(products.creditPacks);
        }
      })
      .catch(() => {
        // Keep the Iris-only fallback catalog when product discovery is unavailable.
      });
    return () => {
      active = false;
    };
  }, [visible]);

  // Queue the selected package and run the purchase only once the sheet's
  // native view controller is gone. Kicking off RevenueCat's StoreKit / Test
  // Store purchase while this RN <Modal> (RCTModalHostViewController) is still
  // mounted makes UIKit try to present the purchase alert on a view that is no
  // longer in the window hierarchy — the alert is dropped and the SDK promise
  // hangs. Deferring guarantees the purchase presents on the underlying
  // screen's view controller instead.
  const pendingPackageRef = useRef<CreditPackage | null>(null);

  const flushPendingPurchase = useCallback(() => {
    const pkg = pendingPackageRef.current;
    pendingPackageRef.current = null;
    if (pkg) {
      onSelectPackage(pkg);
    }
  }, [onSelectPackage]);

  const handlePackagePress = useCallback(
    (pkg: CreditPackage) => {
      if (isPurchasing || pendingPackageRef.current) {
        return;
      }
      pendingPackageRef.current = pkg;
      onClose();
      // Android has no UIKit presentation constraint, so the dismissal does not
      // need to settle first. iOS waits for the modal to finish dismissing.
      if (Platform.OS !== 'ios') {
        flushPendingPurchase();
      }
    },
    [flushPendingPurchase, isPurchasing, onClose]
  );

  // Fallback: Modal.onDismiss is not guaranteed to fire for transparent modals
  // on every RN version. Once the sheet is hidden, flush any still-queued
  // purchase after the slide-out animation. flushPendingPurchase no-ops if
  // onDismiss already handled it (the ref is cleared on first run).
  useEffect(() => {
    if (visible || Platform.OS !== 'ios' || !pendingPackageRef.current) {
      return;
    }
    const timeout = setTimeout(flushPendingPurchase, 400);
    return () => clearTimeout(timeout);
  }, [visible, flushPendingPurchase]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      onDismiss={Platform.OS === 'ios' ? flushPendingPurchase : undefined}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface,
              borderColor: colors.ghostBorder,
            },
          ]}
          onPress={(event) => event.stopPropagation()}
        >
          <View
            style={[
              styles.grabber,
              { backgroundColor: colors.surfaceHighest },
            ]}
          />
          <Text style={[styles.title, { color: colors.text }]}>Buy credits</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Purchased credits never expire.
          </Text>

          <View style={styles.packageList}>
            {creditPackages.map((pkg) => (
              <TouchableOpacity
                key={pkg.id}
                activeOpacity={0.85}
                disabled={isPurchasing}
                onPress={() => handlePackagePress(pkg)}
                style={[
                  styles.packageRow,
                  {
                    backgroundColor: colors.surfaceHigh,
                    borderColor: colors.ghostBorder,
                    opacity: isPurchasing ? 0.55 : 1,
                  },
                ]}
              >
                <View style={styles.packageTextBlock}>
                  <Text style={[styles.packageCredits, { color: colors.text }]}>
                    ◆ {pkg.credits} credits
                  </Text>
                  {pkg.bonusLabel ? (
                    <Text style={[styles.packageBonus, { color: colors.primary }]}>
                      {pkg.bonusLabel}
                    </Text>
                  ) : null}
                </View>
                <Text style={[styles.packagePrice, { color: colors.text }]}>{pkg.priceLabel}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.dismiss, { borderColor: colors.ghostBorder }]}
            onPress={onClose}
            disabled={isPurchasing}
            activeOpacity={0.8}
          >
            <Text style={[styles.dismissText, { color: colors.textMuted }]}>
              {isPurchasing ? 'Completing purchase...' : 'Close'}
            </Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    gap: 16,
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  packageList: {
    gap: 10,
  },
  packageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
  },
  packageTextBlock: {
    gap: 2,
  },
  packageCredits: {
    fontSize: 16,
    fontWeight: '700',
  },
  packageBonus: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  packagePrice: {
    fontSize: 16,
    fontWeight: '700',
  },
  dismiss: {
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 100,
    borderWidth: 1,
  },
  dismissText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
