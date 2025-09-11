/**
 * Enhanced Button Component
 * Mobile-responsive button with various styles and states
 */

import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import React from "react";
import {
  ActivityIndicator,
  Text,
  TextStyle,
  TouchableOpacity,
  ViewStyle,
} from "react-native";
import { IconSymbol } from "./IconSymbol";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  icon?: any;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  icon,
  iconPosition = "left",
  fullWidth = false,
  style,
  textStyle,
}: ButtonProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const sizeStyles = {
    sm: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      fontSize: 14,
      minHeight: 36,
    },
    md: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      minHeight: 44,
    },
    lg: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      fontSize: 18,
      minHeight: 52,
    },
  };

  const variantStyles = {
    primary: {
      backgroundColor: colors.tint,
      borderColor: colors.tint,
      textColor: "#FFFFFF",
    },
    secondary: {
      backgroundColor: colors.secondary,
      borderColor: colors.border,
      textColor: colors.text,
    },
    outline: {
      backgroundColor: "transparent",
      borderColor: colors.tint,
      textColor: colors.tint,
    },
    ghost: {
      backgroundColor: "transparent",
      borderColor: "transparent",
      textColor: colors.tint,
    },
  };

  const currentVariant = variantStyles[variant];
  const currentSize = sizeStyles[size];

  const buttonStyle: ViewStyle = {
    backgroundColor: currentVariant.backgroundColor,
    borderColor: currentVariant.borderColor,
    borderWidth: variant === "ghost" ? 0 : 1,
    borderRadius: 12,
    paddingHorizontal: currentSize.paddingHorizontal,
    paddingVertical: currentSize.paddingVertical,
    minHeight: currentSize.minHeight,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    opacity: disabled || loading ? 0.6 : 1,
    ...(fullWidth && { width: "100%" }),
  };

  const textStyles: TextStyle = {
    color: currentVariant.textColor,
    fontSize: currentSize.fontSize,
    fontWeight: "600",
    textAlign: "center",
  };

  const iconSize = {
    sm: 16,
    md: 18,
    lg: 20,
  };

  const renderContent = () => {
    if (loading) {
      return (
        <ActivityIndicator size="small" color={currentVariant.textColor} />
      );
    }

    const textElement = (
      <Text style={[textStyles, textStyle]} numberOfLines={1}>
        {title}
      </Text>
    );

    const iconElement = icon ? (
      <IconSymbol
        name={icon}
        size={iconSize[size]}
        color={currentVariant.textColor}
        style={{
          marginLeft: iconPosition === "right" ? 8 : 0,
          marginRight: iconPosition === "left" ? 8 : 0,
        }}
      />
    ) : null;

    if (iconPosition === "left") {
      return (
        <>
          {iconElement}
          {textElement}
        </>
      );
    } else {
      return (
        <>
          {textElement}
          {iconElement}
        </>
      );
    }
  };

  return (
    <TouchableOpacity
      style={[buttonStyle, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {renderContent()}
    </TouchableOpacity>
  );
}
