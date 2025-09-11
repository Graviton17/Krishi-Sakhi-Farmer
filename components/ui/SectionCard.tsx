import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import React, { PropsWithChildren } from "react";
import { Dimensions, StyleSheet, ViewStyle } from "react-native";

const { width } = Dimensions.get("window");

type SectionCardProps = PropsWithChildren<{
  title?: string;
  style?: ViewStyle;
  size?: "sm" | "md" | "lg";
  padding?: "none" | "sm" | "md" | "lg";
  elevation?: number;
}>;

export default function SectionCard({
  title,
  style,
  children,
  size = "md",
  padding = "md",
  elevation = 2,
}: SectionCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const isDark = colorScheme === "dark";

  const sizeStyles = {
    sm: { maxWidth: width * 0.4, minHeight: 80 },
    md: { maxWidth: width * 0.9, minHeight: 100 },
    lg: { maxWidth: width * 0.95, minHeight: 120 },
  };

  const paddingStyles = {
    none: 0,
    sm: 12,
    md: 16,
    lg: 24,
  };

  return (
    <ThemedView
      lightColor={colors.cardBackground}
      darkColor="#1c1f22"
      style={[
        styles.card,
        sizeStyles[size],
        {
          borderColor: colors.border,
          padding: paddingStyles[padding],
          elevation,
          shadowColor: isDark ? "#000" : "#000",
          shadowOpacity: isDark ? 0.3 : 0.1,
          shadowRadius: elevation + 2,
        },
        style,
      ]}
    >
      {title ? (
        <ThemedText
          type="subtitle"
          style={[styles.title, { color: colors.text }]}
        >
          {title}
        </ThemedText>
      ) : null}
      {children}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    gap: 8,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    alignSelf: "stretch",
  },
  title: {
    marginBottom: 8,
    fontSize: 18,
    fontWeight: "600",
  },
});
