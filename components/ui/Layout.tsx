/**
 * Enhanced Layout Components
 * Responsive containers and layout utilities for mobile-first design
 */

import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import React from "react";
import {
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";

const { width } = Dimensions.get("window");

// Breakpoints for responsive design
export const breakpoints = {
  xs: 0,
  sm: 480,
  md: 768,
  lg: 1024,
  xl: 1200,
};

export const getDeviceType = () => {
  if (width >= breakpoints.lg) return "desktop";
  if (width >= breakpoints.md) return "tablet";
  return "mobile";
};

export const getColumns = () => {
  const deviceType = getDeviceType();
  switch (deviceType) {
    case "desktop":
      return 4;
    case "tablet":
      return 3;
    default:
      return 2;
  }
};

interface ContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: "none" | "sm" | "md" | "lg";
  maxWidth?: number;
}

export function Container({
  children,
  style,
  padding = "md",
  maxWidth,
}: ContainerProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const paddingStyles = {
    none: 0,
    sm: 8,
    md: 16,
    lg: 24,
  };

  const containerStyle: ViewStyle = {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: paddingStyles[padding],
    ...(maxWidth && width > maxWidth ? { maxWidth, alignSelf: "center" } : {}),
  };

  return <View style={[containerStyle, style]}>{children}</View>;
}

interface ScreenContainerProps {
  children: React.ReactNode;
  scrollable?: boolean;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  showsVerticalScrollIndicator?: boolean;
}

export function ScreenContainer({
  children,
  scrollable = true,
  style,
  contentContainerStyle,
  showsVerticalScrollIndicator = true,
}: ScreenContainerProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const baseStyle: ViewStyle = {
    flex: 1,
    backgroundColor: colors.background,
  };

  if (scrollable) {
    return (
      <ScrollView
        style={[baseStyle, style]}
        contentContainerStyle={[
          styles.scrollContentContainer,
          contentContainerStyle,
        ]}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        bounces={Platform.OS === "ios"}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    );
  }

  return <View style={[baseStyle, style]}>{children}</View>;
}

interface RowProps {
  children: React.ReactNode;
  style?: ViewStyle;
  justify?:
    | "flex-start"
    | "center"
    | "flex-end"
    | "space-between"
    | "space-around"
    | "space-evenly";
  align?: "flex-start" | "center" | "flex-end" | "stretch";
  wrap?: boolean;
  gap?: number;
}

export function Row({
  children,
  style,
  justify = "flex-start",
  align = "center",
  wrap = false,
  gap = 0,
}: RowProps) {
  return (
    <View
      style={[
        {
          flexDirection: "row",
          justifyContent: justify,
          alignItems: align,
          flexWrap: wrap ? "wrap" : "nowrap",
          gap,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

interface ColumnProps {
  children: React.ReactNode;
  style?: ViewStyle;
  justify?:
    | "flex-start"
    | "center"
    | "flex-end"
    | "space-between"
    | "space-around"
    | "space-evenly";
  align?: "flex-start" | "center" | "flex-end" | "stretch";
  gap?: number;
}

export function Column({
  children,
  style,
  justify = "flex-start",
  align = "stretch",
  gap = 0,
}: ColumnProps) {
  return (
    <View
      style={[
        {
          flexDirection: "column",
          justifyContent: justify,
          alignItems: align,
          gap,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

interface GridProps {
  children: React.ReactNode;
  columns?: number;
  gap?: number;
  style?: ViewStyle;
}

export function Grid({ children, columns, gap = 16, style }: GridProps) {
  const cols = columns || getColumns();
  const itemWidth = (width - (32 + (cols - 1) * gap)) / cols; // 32 for padding

  return (
    <View style={[styles.grid, { gap }, style]}>
      {React.Children.map(children, (child, index) => (
        <View key={index} style={{ width: itemWidth }}>
          {child}
        </View>
      ))}
    </View>
  );
}

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: "none" | "sm" | "md" | "lg";
  elevation?: number;
  radius?: number;
}

export function Card({
  children,
  style,
  padding = "md",
  elevation = 2,
  radius = 12,
}: CardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const paddingStyles = {
    none: 0,
    sm: 12,
    md: 16,
    lg: 24,
  };

  return (
    <View
      style={[
        {
          backgroundColor: colors.cardBackground,
          borderRadius: radius,
          padding: paddingStyles[padding],
          elevation,
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: elevation / 2,
          },
          shadowOpacity: 0.1,
          shadowRadius: elevation,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

interface SpacerProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  horizontal?: boolean;
}

export function Spacer({ size = "md", horizontal = false }: SpacerProps) {
  const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  };

  return (
    <View
      style={{
        [horizontal ? "width" : "height"]: spacing[size],
      }}
    />
  );
}

const styles = StyleSheet.create({
  scrollContentContainer: {
    flexGrow: 1,
    paddingBottom: Platform.OS === "ios" ? 100 : 80, // Extra space for tab bar
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
  },
});
