// ─── ADO-inspired dark theme ───────────────────────────────────────────────
export const COLORS = {
  // Backgrounds
  bg:         '#0e1117',
  surface:    '#161b22',
  surfaceAlt: '#1c2128',
  border:     '#30363d',

  // Brand
  accent:     '#0078d4',
  accentDark: '#005a9e',

  // Text
  textPrimary:   '#e6edf3',
  textSecondary: '#8b949e',
  textMuted:     '#484f58',

  // State colours
  stateNew:      '#6e7681',
  stateActive:   '#1f6feb',
  stateResolved: '#238636',
  stateClosed:   '#484f58',

  // Work item type colours
  typeEpic:      '#9c27b0',
  typeFeature:   '#0078d4',
  typeStory:     '#00b4a2',
  typeTask:      '#f8a131',
  typeBug:       '#e53935',

  // Priority colours
  priCritical:   '#da3633',
  priHigh:       '#f85149',
  priMedium:     '#d29922',
  priLow:        '#3fb950',

  // UI feedback
  success:       '#238636',
  warning:       '#d29922',
  error:         '#da3633',
  info:          '#1f6feb',

  white:         '#ffffff',
  black:         '#000000',
};

export const TYPOGRAPHY = {
  sizeXs:   10,
  sizeSm:   12,
  sizeMd:   14,
  sizeLg:   16,
  sizeXl:   20,
  size2xl:  24,
  size3xl:  30,

  weightNormal:   '400',
  weightMedium:   '500',
  weightSemibold: '600',
  weightBold:     '700',

  fontMono: 'Courier',
};

export const SPACING = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  24,
  xxl: 32,
};

export const RADIUS = {
  sm:   4,
  md:   8,
  lg:   12,
  full: 999,
};

export const SHADOW = {
  card: {
    shadowColor:   '#000',
    shadowOffset:  { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius:  4,
    elevation:     3,
  },
};
