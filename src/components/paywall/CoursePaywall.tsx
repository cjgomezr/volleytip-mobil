import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { Text } from '../ui';
import { RCProduct } from '../../lib/revenuecat';
import { useAuthStore } from '../../store/auth.store';
import { usePurchasesStore } from '../../store/purchases.store';
import { colors, fontFamily, fontSize, radius, spacing } from '../../theme';

interface Props {
  visible:     boolean;
  courseId:    string;
  courseTitle: string;
  priceUsd:    number;
  onClose:     () => void;
  onSuccess:   () => void;
}

const BENEFITS = [
  'Acceso permanente al programa completo',
  'Todos los videos y ejercicios sin restricciones',
  'Seguimiento de progreso incluido',
  'Actualizaciones futuras sin costo adicional',
];

export function CoursePaywall({
  visible,
  courseId,
  courseTitle,
  priceUsd,
  onClose,
  onSuccess,
}: Props) {
  const session        = useAuthStore((s) => s.session);
  const buyCourse      = usePurchasesStore((s) => s.buyCourse);
  const restorePurch   = usePurchasesStore((s) => s.restorePurchases);
  const buyLoading     = usePurchasesStore((s) => s.buyLoading);
  const getProductInfo = usePurchasesStore((s) => s.getProductInfo);

  const [product,   setProduct]   = useState<RCProduct | null>(null);
  const [errMsg,    setErrMsg]    = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);

  // Fetch App Store price whenever modal opens
  useEffect(() => {
    if (!visible) return;
    setErrMsg(null);
    getProductInfo(courseId, priceUsd).then(setProduct);
  }, [visible, courseId, priceUsd]);

  async function handleBuy() {
    setErrMsg(null);
    const result = await buyCourse(courseId, priceUsd);
    if (result === null) {
      onSuccess();
    } else if (result !== 'cancelled') {
      setErrMsg(result);
    }
  }

  async function handleRestore() {
    if (!session) return;
    setRestoring(true);
    setErrMsg(null);
    await restorePurch(session.user.id);
    setRestoring(false);
    const nowOwned = usePurchasesStore.getState().ownedCourseIds.has(courseId);
    if (nowOwned) onSuccess();
  }

  const priceLabel = product?.priceString ?? `$${priceUsd.toFixed(2)}`;
  const isBusy     = buyLoading || restoring;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.wrapper}>
        {/* Tap-outside to dismiss */}
        <Pressable style={styles.backdrop} onPress={onClose} />

        {/* Sheet — inner Pressable blocks tap-through to backdrop */}
        <Pressable onPress={() => {}} style={styles.sheet}>

          {/* Handle */}
          <View style={styles.handle} />

          {/* Close button */}
          <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={20} color={colors.textSecondary} />
          </Pressable>

          {/* Icon */}
          <View style={styles.iconWrap}>
            <Ionicons name="lock-open-outline" size={40} color={colors.accent} />
          </View>

          {/* Heading */}
          <Text style={styles.heading}>Desbloquear curso</Text>
          <Text style={styles.courseTitle} numberOfLines={2}>{courseTitle}</Text>

          {/* Benefits list */}
          <View style={styles.benefits}>
            {BENEFITS.map((b) => (
              <View key={b} style={styles.benefitRow}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                <Text style={styles.benefitText}>{b}</Text>
              </View>
            ))}
          </View>

          {/* Error message */}
          {errMsg ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={14} color={colors.error} />
              <Text style={styles.errorText}>{errMsg}</Text>
            </View>
          ) : null}

          {/* Buy CTA */}
          <Pressable
            style={({ pressed }) => [
              styles.buyBtn,
              pressed  && { opacity: 0.85 },
              isBusy   && { opacity: 0.6 },
            ]}
            onPress={handleBuy}
            disabled={isBusy}
          >
            {buyLoading
              ? <ActivityIndicator color={colors.bgPrimary} />
              : <Text style={styles.buyBtnText}>Comprar — {priceLabel}</Text>
            }
          </Pressable>

          {/* Restore link */}
          <Pressable onPress={handleRestore} disabled={isBusy} style={styles.restoreBtn}>
            {restoring
              ? <ActivityIndicator size="small" color={colors.textTertiary} />
              : <Text style={styles.restoreText}>Restaurar compras</Text>
            }
          </Pressable>

          <Text style={styles.legal}>
            Pago único · Sin suscripción · Acceso permanente
          </Text>

        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },

  // ── Sheet ─────────────────────────────────────────────────────────────────
  sheet: {
    backgroundColor: colors.bgSecondary,
    borderTopLeftRadius:  24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing['4xl'],
    paddingTop: spacing.md,
    alignItems: 'center',
    gap: 0,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    marginBottom: spacing.lg,
  },
  closeBtn: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.screen,
  },

  // ── Content ───────────────────────────────────────────────────────────────
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: colors.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  heading: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  courseTitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },

  // ── Benefits ──────────────────────────────────────────────────────────────
  benefits: {
    alignSelf: 'stretch',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  benefitText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    flex: 1,
  },

  // ── Error ─────────────────────────────────────────────────────────────────
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: `${colors.error}18`,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignSelf: 'stretch',
    marginBottom: spacing.md,
  },
  errorText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.error,
    flex: 1,
  },

  // ── CTA ───────────────────────────────────────────────────────────────────
  buyBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    height: 52,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  buyBtnText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: colors.bgPrimary,
  },
  restoreBtn: {
    paddingVertical: spacing.sm,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  restoreText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    textDecorationLine: 'underline',
  },
  legal: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    textAlign: 'center',
  },
});
