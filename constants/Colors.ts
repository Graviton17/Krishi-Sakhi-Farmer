/**
 * Enhanced color palette optimized for light mode
 * Modern, clean design with good contrast and accessibility
 */

const tintColorLight = "#2E7D32"; // Modern green for agriculture theme
const tintColorDark = "#fff";

export const Colors = {
  light: {
    text: "#1A1A1A",
    background: "#FFFFFF",
    tint: tintColorLight,
    icon: "#616161",
    tabIconDefault: "#9E9E9E",
    tabIconSelected: tintColorLight,
    cardBackground: "#F8F9FA",
    border: "#E0E0E0",
    success: "#4CAF50",
    warning: "#FF9800",
    error: "#F44336",
    info: "#2196F3",
    secondary: "#F5F5F5",
    accent: "#81C784",
  },
  dark: {
    text: "#ECEDEE",
    background: "#151718",
    tint: tintColorDark,
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: tintColorDark,
    cardBackground: "#1E1E1E",
    border: "#333333",
    success: "#4CAF50",
    warning: "#FF9800",
    error: "#F44336",
    info: "#2196F3",
    secondary: "#2A2A2A",
    accent: "#81C784",
  },
};
