export const colors = {
  // Fondos
  bgPrimary: '#111116',
  bgSecondary: '#1a1a22',
  bgNavbar: '#0d0d12',

  // Acento (usar con criterio — solo botones, íconos activos, barras, badges clave)
  accent: '#00CFCF',
  accentDim: 'rgba(0,207,207,0.12)',
  accentMuted: 'rgba(0,207,207,0.25)',

  // Texto
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.45)',
  textTertiary: 'rgba(255,255,255,0.25)',

  // Bordes y superficies
  border: 'rgba(255,255,255,0.07)',
  borderLight: 'rgba(255,255,255,0.12)',
  surface: 'rgba(255,255,255,0.05)',

  // Estados
  error: '#FF5252',
  success: '#4CAF50',
  warning: '#FFC107',
} as const;

export type Colors = typeof colors;
