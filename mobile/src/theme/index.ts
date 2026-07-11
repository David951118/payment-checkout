export const colors = {
  background: '#F6F7FB',
  surface: '#FFFFFF',
  primary: '#4F46E5',
  primaryDark: '#4338CA',
  text: '#111827',
  muted: '#6B7280',
  border: '#E5E7EB',
  success: '#16A34A',
  danger: '#DC2626',
  warning: '#D97706',
  scrim: 'rgba(17, 24, 39, 0.55)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

export const typography = {
  title: { fontSize: 22, fontWeight: '700' as const, color: colors.text },
  subtitle: { fontSize: 16, fontWeight: '600' as const, color: colors.text },
  body: { fontSize: 14, color: colors.text },
  caption: { fontSize: 12, color: colors.muted },
};

export const shadow = {
  card: {
    shadowColor: '#111827',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
};
