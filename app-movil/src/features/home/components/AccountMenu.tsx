import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CaretRight, Key, SignOut, Trash, UserCircle } from 'phosphor-react-native';

import { colors, radius, spacing, typography } from '@/theme';

type AccountMenuProps = {
  onOpenProfile: () => void;
  onOpenPassword: () => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
};

type MenuItemProps = {
  label: string;
  hint: string;
  icon: React.ReactNode;
  onPress: () => void;
  danger?: boolean;
};

function MenuItem({ label, hint, icon, onPress, danger = false }: MenuItemProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      onPress={onPress}
      style={({ pressed }) => [
        styles.item,
        danger ? styles.dangerItem : null,
        pressed ? (danger ? styles.dangerPressed : styles.itemPressed) : null,
      ]}
    >
      <View style={[styles.iconContainer, danger ? styles.dangerIconContainer : null]}>{icon}</View>
      <Text style={[styles.itemLabel, danger ? styles.dangerLabel : null]}>{label}</Text>
      <CaretRight size={22} color={danger ? colors.danger : colors.textMuted} weight="bold" />
    </Pressable>
  );
}

export default function AccountMenu({
  onOpenProfile,
  onOpenPassword,
  onLogout,
  onDeleteAccount,
}: AccountMenuProps) {
  return (
    <View style={styles.container} accessibilityRole="menu">
      <Text style={styles.heading}>Mi cuenta</Text>
      <MenuItem
        label="Mis datos de contacto"
        hint="Abre el formulario para modificar su nombre y correo"
        icon={<UserCircle size={27} color={colors.primaryStrong} weight="bold" />}
        onPress={onOpenProfile}
      />
      <MenuItem
        label="Cambiar contraseña"
        hint="Abre el formulario para cambiar su contraseña"
        icon={<Key size={27} color={colors.primaryStrong} weight="bold" />}
        onPress={onOpenPassword}
      />
      <MenuItem
        label="Cerrar sesión"
        hint="Solicita confirmación antes de cerrar la sesión"
        icon={<SignOut size={27} color={colors.primaryStrong} weight="bold" />}
        onPress={onLogout}
      />
      <View style={styles.separator} />
      <MenuItem
        label="Eliminar mi cuenta"
        hint="Solicita confirmación antes de eliminar permanentemente su cuenta"
        icon={<Trash size={27} color={colors.danger} weight="bold" />}
        onPress={onDeleteAccount}
        danger
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.sm,
    shadowColor: '#101418',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 6,
  },
  heading: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: '700',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  item: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  itemPressed: {
    backgroundColor: colors.primarySoft,
  },
  dangerItem: {
    backgroundColor: '#FFF7F8',
  },
  dangerPressed: {
    backgroundColor: '#FDE8EC',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  dangerIconContainer: {
    backgroundColor: '#FDE8EC',
  },
  itemLabel: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typography.body,
    fontWeight: '700',
  },
  dangerLabel: {
    color: colors.danger,
  },
  separator: {
    height: 1,
    backgroundColor: colors.borderSoft,
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
  },
});
