/**
 * More Tab - Navigation Hub
 * Provides access to all secondary features and tools
 */

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { router } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

interface NavigationItem {
  title: string;
  description: string;
  icon: string;
  route: string;
  color?: string;
}

const navigationItems: NavigationItem[] = [
  {
    title: "Farm Tasks",
    description: "Manage daily farming activities",
    icon: "checklist",
    route: "/(tabs)/tasks",
    color: "#4CAF50",
  },
  {
    title: "Messages",
    description: "Chat with buyers and suppliers",
    icon: "message.fill",
    route: "/(tabs)/messages",
    color: "#2196F3",
  },
  {
    title: "Quality Assessment",
    description: "AI-powered crop quality analysis",
    icon: "camera.fill",
    route: "/(tabs)/quality-assessment",
    color: "#FF9800",
  },
  {
    title: "Explore",
    description: "Discover new opportunities",
    icon: "safari.fill",
    route: "/(tabs)/explore",
    color: "#9C27B0",
  },
  {
    title: "Dashboard (Detailed)",
    description: "View detailed farm dashboard",
    icon: "chart.bar.fill",
    route: "/(tabs)/dashboard",
    color: "#607D8B",
  },
  {
    title: "Settings",
    description: "App preferences and configuration",
    icon: "gear",
    route: "/settings",
    color: "#795548",
  },
];

export default function MoreScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const handleNavigate = (route: string) => {
    router.push(route as any);
  };

  const renderNavigationItem = (item: NavigationItem, index: number) => (
    <TouchableOpacity
      key={index}
      style={[styles.navigationItem, { borderColor: colors.border }]}
      onPress={() => handleNavigate(item.route)}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: item.color || colors.tint },
        ]}
      >
        <IconSymbol name={item.icon as any} size={24} color="white" />
      </View>
      <View style={styles.textContainer}>
        <ThemedText style={styles.itemTitle}>{item.title}</ThemedText>
        <ThemedText style={[styles.itemDescription, { color: colors.icon }]}>
          {item.description}
        </ThemedText>
      </View>
      <IconSymbol name="chevron.right" size={16} color={colors.icon} />
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.headerTitle}>
            More Features
          </ThemedText>
          <ThemedText style={[styles.headerSubtitle, { color: colors.icon }]}>
            Access all tools and features
          </ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
            Farm Management
          </ThemedText>
          {navigationItems
            .slice(0, 3)
            .map((item, index) => renderNavigationItem(item, index))}
        </View>

        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
            Tools & Settings
          </ThemedText>
          {navigationItems
            .slice(3)
            .map((item, index) => renderNavigationItem(item, index + 3))}
        </View>

        <View
          style={[
            styles.helpSection,
            { backgroundColor: colors.cardBackground },
          ]}
        >
          <IconSymbol
            name="questionmark.circle.fill"
            size={24}
            color={colors.tint}
          />
          <View style={styles.helpTextContainer}>
            <ThemedText style={styles.helpTitle}>Need Help?</ThemedText>
            <ThemedText style={[styles.helpText, { color: colors.icon }]}>
              Contact our support team for assistance
            </ThemedText>
          </View>
          <TouchableOpacity
            style={[styles.helpButton, { backgroundColor: colors.tint }]}
            onPress={() => handleNavigate("/support")}
          >
            <ThemedText style={styles.helpButtonText}>Contact</ThemedText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  navigationItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  itemDescription: {
    fontSize: 14,
  },
  helpSection: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  helpTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  helpText: {
    fontSize: 14,
  },
  helpButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  helpButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
});
