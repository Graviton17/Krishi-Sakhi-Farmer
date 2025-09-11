/**
 * Custom useColorScheme hook that forces light mode
 * This ensures the app always uses light theme regardless of device settings
 */

import { ColorSchemeName } from "react-native";

export function useColorScheme(): ColorSchemeName {
  // Always return 'light' to force light mode
  return "light";
}
