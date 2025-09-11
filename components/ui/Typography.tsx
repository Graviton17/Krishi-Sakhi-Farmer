/**
 * Typography System
 * Responsive text components for consistent mobile-first design
 */

import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import React from "react";
import { Dimensions, Text, TextStyle } from "react-native";

const { width } = Dimensions.get("window");

interface ResponsiveTextProps {
  children: React.ReactNode;
  variant?: "h1" | "h2" | "h3" | "h4" | "body" | "caption" | "button";
  color?: string;
  align?: "left" | "center" | "right";
  weight?: "normal" | "medium" | "semibold" | "bold";
  style?: TextStyle;
  numberOfLines?: number;
}

export function ResponsiveText({
  children,
  variant = "body",
  color,
  align = "left",
  weight = "normal",
  style,
  numberOfLines,
}: ResponsiveTextProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  // Responsive font sizes based on screen width
  const getResponsiveFontSize = (baseSize: number) => {
    if (width < 350) return baseSize * 0.9; // Small phones
    if (width > 414) return baseSize * 1.1; // Large phones/tablets
    return baseSize;
  };

  const variantStyles: Record<string, TextStyle> = {
    h1: {
      fontSize: getResponsiveFontSize(32),
      lineHeight: getResponsiveFontSize(40),
      fontWeight: "700",
    },
    h2: {
      fontSize: getResponsiveFontSize(24),
      lineHeight: getResponsiveFontSize(32),
      fontWeight: "600",
    },
    h3: {
      fontSize: getResponsiveFontSize(20),
      lineHeight: getResponsiveFontSize(28),
      fontWeight: "600",
    },
    h4: {
      fontSize: getResponsiveFontSize(18),
      lineHeight: getResponsiveFontSize(24),
      fontWeight: "500",
    },
    body: {
      fontSize: getResponsiveFontSize(16),
      lineHeight: getResponsiveFontSize(24),
      fontWeight: "400",
    },
    caption: {
      fontSize: getResponsiveFontSize(14),
      lineHeight: getResponsiveFontSize(20),
      fontWeight: "400",
    },
    button: {
      fontSize: getResponsiveFontSize(16),
      lineHeight: getResponsiveFontSize(20),
      fontWeight: "600",
    },
  };

  const weightStyles: Record<string, TextStyle> = {
    normal: { fontWeight: "400" },
    medium: { fontWeight: "500" },
    semibold: { fontWeight: "600" },
    bold: { fontWeight: "700" },
  };

  const textStyle: TextStyle = {
    ...variantStyles[variant],
    ...weightStyles[weight],
    color: color || colors.text,
    textAlign: align,
  };

  return (
    <Text style={[textStyle, style]} numberOfLines={numberOfLines}>
      {children}
    </Text>
  );
}

// Predefined text components for common use cases
export function Heading1(props: Omit<ResponsiveTextProps, "variant">) {
  return <ResponsiveText {...props} variant="h1" />;
}

export function Heading2(props: Omit<ResponsiveTextProps, "variant">) {
  return <ResponsiveText {...props} variant="h2" />;
}

export function Heading3(props: Omit<ResponsiveTextProps, "variant">) {
  return <ResponsiveText {...props} variant="h3" />;
}

export function Heading4(props: Omit<ResponsiveTextProps, "variant">) {
  return <ResponsiveText {...props} variant="h4" />;
}

export function BodyText(props: Omit<ResponsiveTextProps, "variant">) {
  return <ResponsiveText {...props} variant="body" />;
}

export function Caption(props: Omit<ResponsiveTextProps, "variant">) {
  return <ResponsiveText {...props} variant="caption" />;
}

export function ButtonText(props: Omit<ResponsiveTextProps, "variant">) {
  return <ResponsiveText {...props} variant="button" />;
}
