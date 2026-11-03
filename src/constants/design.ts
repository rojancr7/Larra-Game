/**
 * Larra Game — Design System Tokens
 * Colors (C), Font Sizes (F), Border Radii (R)
 */

export const C = {
  // Core backgrounds
  bg: '#0F172A',
  bgDeep: '#0B1120',
  surface: '#1E293B',
  surfaceHover: '#263548',
  surfaceLight: '#334155',
  surfaceCard: '#192336',

  // Emerald accent
  emerald: '#10B981',
  emeraldDark: '#059669',
  emeraldLight: '#34D399',
  emeraldGlow: 'rgba(16, 185, 129, 0.12)',
  emeraldBorder: 'rgba(16, 185, 129, 0.3)',

  // Royal gold accent
  gold: '#F59E0B',
  goldDark: '#D97706',
  goldLight: '#FBBF24',
  goldGlow: 'rgba(245, 158, 11, 0.12)',
  goldBorder: 'rgba(245, 158, 11, 0.25)',

  // Text hierarchy
  text: '#F8FAFC',
  textSec: '#CBD5E1',
  textMuted: '#94A3B8',
  textDim: '#64748B',

  // Borders
  border: 'rgba(148, 163, 184, 0.12)',
  borderLight: 'rgba(148, 163, 184, 0.06)',

  // Semantic colors
  red: '#EF4444',
  redGlow: 'rgba(239, 68, 68, 0.12)',
  green: '#22C55E',
  greenGlow: 'rgba(34, 197, 94, 0.1)',
  blue: '#3B82F6',
  blueGlow: 'rgba(59, 130, 246, 0.12)',
  purple: '#A855F7',
  purpleGlow: 'rgba(168, 85, 247, 0.12)',
  cyan: '#06B6D4',
  cyanGlow: 'rgba(6, 182, 212, 0.12)',

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.6)',
  overlayLight: 'rgba(0, 0, 0, 0.4)',

  // Game table
  tableGreen: '#092514',
  tableGreenDark: '#05190d',
} as const;

/** Font size scale */
export const F = {
  xxs: 9,
  xs: 10,
  sm: 11,
  md: 13,
  lg: 15,
  xl: 18,
  xxl: 22,
  xxxl: 28,
  hero: 36,
} as const;

/** Border radius scale */
export const R = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  xxl: 28,
  full: 999,
} as const;

