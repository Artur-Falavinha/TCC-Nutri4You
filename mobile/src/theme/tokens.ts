export const colors = {
  brand: '#006f1e',
  brandDark: '#005414',
  brandDeep: '#064e3b',
  brandSoft: '#d1fae5',
  brandButtonText: '#90f08d',
  text: '#2d3335',
  textSecondary: '#64748b',
  textSubtle: '#94a3b8',
  page: '#f9f9f9',
  pageAlt: '#f5f5f5',
  card: '#ffffff',
  subtle: '#f3f3f3',
  border: '#e8e8e8',
  pending: '#006a68',
  pendingBackground: 'rgba(146, 239, 237, 0.2)',
  confirmedBackground: 'rgba(0, 111, 30, 0.1)',
  danger: '#c71603',
  dangerText: '#ba1a1a',
  dangerBackground: '#ffdad6',
  dangerButtonBackground: 'rgba(255, 218, 214, 0.5)',
  overlay: 'rgba(0, 0, 0, 0.5)',
  white: '#ffffff'
} as const;

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  drawer: 32,
  pill: 9999
} as const;

export const fontFamily = {
  regular: 'Manrope-Regular',
  semibold: 'Manrope-SemiBold',
  bold: 'Manrope-Bold',
  extrabold: 'Manrope-ExtraBold'
} as const;

export const shadows = {
  card: {
    shadowColor: '#1a1c1c',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3
  },
  button: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3
  }
} as const;
