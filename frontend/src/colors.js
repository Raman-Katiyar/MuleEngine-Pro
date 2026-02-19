// 4-Color Risk-Based Palette
export const colors = {
  // Primary / Background
  softCream: '#F7F3E9',
  
  // Success / No Risk / Green
  emeraldGreen: '#10B981',
  emeraldGreenBright: '#34D399',
  
  // Warning / Low Risk / Yellow
  amberYellow: '#F59E0B',
  amberYellowBright: '#FBBF24',
  
  // Danger / High Risk / Red
  crimsonRed: '#DC2626',
  crimsonRedBright: '#EF4444',
  
  // Secondary / Interactive / Normal (keeping for compatibility)
  mutedBlue: '#5A7D9A',
  mutedBlueBright: '#6A8DBA',
  
  // Alert / Suspicious / Critical (keeping for compatibility)
  mutedCoral: '#E07A5F',
  mutedCoralBright: '#F28C7F',
  
  // Text & Supporting Colors
  darkSlateGray: '#3B3B3B',
  lightGray: '#E8E8E8',
  white: '#FFFFFF',
};

// Tailwind-compatible class names for quick usage
export const tailwindColors = {
  primary: colors.mutedBlue,
  primaryBright: colors.mutedBlueBright,
  alert: colors.mutedCoral,
  alertBright: colors.mutedCoralBright,
  background: colors.softCream,
  text: colors.darkSlateGray,
};

// Risk level color mapping
export const getRiskColor = (score) => {
  if (score >= 70) return colors.crimsonRed;      // High Risk (70+) = Red
  if (score >= 35) return colors.amberYellow;     // Low-Medium Risk (35-69) = Yellow
  return colors.emeraldGreen;                      // No/Low Risk (<35) = Green
};
