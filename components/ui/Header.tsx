/**
 * Enhanced Header Component
 * Responsive header with user profile, notifications, and branding
 */

import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useAuth } from "@/contexts/AuthContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { router } from "expo-router";
import React from "react";
import {
  Dimensions,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface HeaderProps {
  title?: string;
  showBackButton?: boolean;
  showProfile?: boolean;
  showNotifications?: boolean;
  onBackPress?: () => void;
  rightComponent?: React.ReactNode;
}

const { width } = Dimensions.get("window");
const isTablet = width >= 768;

export default function Header({
  title,
  showBackButton = false,
  showProfile = true,
  showNotifications = true,
  onBackPress,
  rightComponent,
}: HeaderProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { user } = useAuth();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  const handleProfilePress = () => {
    router.push("/(tabs)/profile");
  };

  const handleNotificationPress = () => {
    // TODO: Navigate to notifications screen
    console.log("Navigate to notifications");
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const getUserDisplayName = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name.split(" ")[0];
    }
    if (user?.email) {
      return user.email.split("@")[0];
    }
    return "Farmer";
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
      />
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={styles.leftSection}>
          {showBackButton ? (
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: colors.secondary }]}
              onPress={handleBackPress}
              activeOpacity={0.7}
            >
              <IconSymbol name="chevron.left" size={20} color={colors.text} />
            </TouchableOpacity>
          ) : (
            <View style={styles.brandSection}>
              <View style={[styles.logo, { backgroundColor: colors.tint }]}>
                <IconSymbol name="leaf.fill" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.brandText}>
                <Text style={[styles.appName, { color: colors.text }]}>
                  Krishi Sakhi
                </Text>
                <Text style={[styles.tagline, { color: colors.icon }]}>
                  Smart Farming
                </Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.centerSection}>
          {title ? (
            <Text
              style={[styles.headerTitle, { color: colors.text }]}
              numberOfLines={1}
            >
              {title}
            </Text>
          ) : (
            <View style={styles.greetingSection}>
              <Text style={[styles.greeting, { color: colors.icon }]}>
                {getGreeting()}
              </Text>
              <Text
                style={[styles.userName, { color: colors.text }]}
                numberOfLines={1}
              >
                {getUserDisplayName()}!
              </Text>
            </View>
          )}
        </View>

        <View style={styles.rightSection}>
          {rightComponent ? (
            rightComponent
          ) : (
            <View style={styles.actionButtons}>
              {showNotifications && (
                <TouchableOpacity
                  style={[
                    styles.iconButton,
                    { backgroundColor: colors.secondary },
                  ]}
                  onPress={handleNotificationPress}
                  activeOpacity={0.7}
                >
                  <IconSymbol name="bell.fill" size={20} color={colors.icon} />
                  {/* Notification badge */}
                  <View
                    style={[
                      styles.notificationBadge,
                      { backgroundColor: colors.error },
                    ]}
                  >
                    <Text style={styles.badgeText}>3</Text>
                  </View>
                </TouchableOpacity>
              )}

              {showProfile && (
                <TouchableOpacity
                  style={[
                    styles.profileButton,
                    { backgroundColor: colors.tint },
                  ]}
                  onPress={handleProfilePress}
                  activeOpacity={0.7}
                >
                  <IconSymbol
                    name="person.crop.circle.fill"
                    size={24}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    zIndex: 1000,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  leftSection: {
    flex: 1,
    alignItems: "flex-start",
  },
  centerSection: {
    flex: isTablet ? 2 : 1,
    alignItems: "center",
    paddingHorizontal: 8,
  },
  rightSection: {
    flex: 1,
    alignItems: "flex-end",
  },
  brandSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  brandText: {
    ...Platform.select({
      web: {
        display: isTablet ? "flex" : "none",
      },
      default: {
        display: width > 400 ? "flex" : "none",
      },
    }),
  },
  appName: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: -2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
  },
  greetingSection: {
    alignItems: "center",
  },
  greeting: {
    fontSize: 14,
    fontWeight: "500",
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  notificationBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
  },
});
