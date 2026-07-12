/**
 * Gateway-checkout inspired palette: deep navy surfaces and CTAs with a
 * vivid mint-green accent, white cards on a cool light background.
 */
export const colors = {
  background: '#F2F4FA',
  surface: '#FFFFFF',
  primary: '#161D4E',
  primaryDark: '#0E1338',
  accent: '#00D48A',
  accentSoft: '#E1FAF0',
  text: '#12173B',
  muted: '#68708F',
  border: '#E2E6F1',
  success: '#00A870',
  danger: '#DC2626',
  warning: '#D97706',
  scrim: 'rgba(18, 23, 59, 0.6)',
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
