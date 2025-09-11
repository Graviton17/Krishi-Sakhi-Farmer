/**
 * Home Tab - Enhanced Dashboard
 * Main landing screen with farm overview and quick actions
 */

import DashboardSummary from "@/components/DashboardSummary";
import { DatabaseDebugComponent } from "@/components/DatabaseDebugComponent";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import SectionCard from "@/components/ui/SectionCard";
import { Colors } from "@/constants/Colors";
import { useAuth } from "@/contexts/AuthContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useDashboard } from "@/hooks/useDashboard";
import { router } from "expo-router";
import React, { useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

export default function HomeScreen() {
  const { user } = useAuth();
  const { loading, error, data } = useDashboard(user?.id || null);
  const [showDebug, setShowDebug] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const quickActions = [
    {
      title: "Add Product",
      icon: "plus.circle.fill",
      color: colors.success,
      onPress: () => router.push("/marketplace"),
    },
    {
      title: "View Tasks",
      icon: "checklist",
      color: colors.info,
      onPress: () => router.push("/tasks"),
    },
    {
      title: "Messages",
      icon: "message.fill",
      color: colors.warning,
      onPress: () => router.push("/messages"),
    },
    {
      title: "Quality Check",
      icon: "camera.fill",
      color: "#9C27B0",
      onPress: () => router.push("/quality-assessment"),
    },
  ];

  const renderQuickAction = (action: any, index: number) => (
    <TouchableOpacity
      key={index}
      style={[styles.quickActionItem, { borderColor: colors.border }]}
      onPress={action.onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.quickActionIcon, { backgroundColor: action.color }]}>
        <IconSymbol name={action.icon} size={24} color="white" />
      </View>
      <ThemedText style={styles.quickActionText}>{action.title}</ThemedText>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedView style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <ThemedText type="title" style={styles.welcome}>
                Good Morning! 🌱
              </ThemedText>
              <ThemedText style={[styles.subtitle, { color: colors.icon }]}>
                Your farm at a glance
              </ThemedText>
            </View>
            <TouchableOpacity
              style={[
                styles.notificationButton,
                { backgroundColor: colors.cardBackground },
              ]}
              onPress={() => router.push("/messages")}
            >
              <IconSymbol name="bell.fill" size={20} color={colors.icon} />
            </TouchableOpacity>
          </View>
        </ThemedView>

        {/* Quick Actions */}
        <SectionCard title="Quick Actions" style={styles.quickActionsCard}>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, index) =>
              renderQuickAction(action, index)
            )}
          </View>
        </SectionCard>

        {/* Dashboard Summary */}
        <SectionCard title="Farm Overview">
          <DashboardSummary />
        </SectionCard>

        {/* Statistics Row */}
        <View style={styles.row}>
          <SectionCard title="Revenue (30d)" style={styles.flexItem}>
            <View style={styles.statContent}>
              <ThemedText
                type="title"
                style={[styles.statValue, { color: colors.success }]}
              >
                {formatCurrency(data?.revenueLastMonth ?? 0)}
              </ThemedText>
              <ThemedText style={[styles.statChange, { color: colors.icon }]}>
                {data?.revenueGrowth ? (
                  <>
                    {data.revenueGrowth > 0 ? "↑" : "↓"}{" "}
                    {Math.abs(data.revenueGrowth).toFixed(1)}%
                  </>
                ) : (
                  "No change"
                )}
              </ThemedText>
            </View>
          </SectionCard>

          <SectionCard title="Active Orders" style={styles.flexItem}>
            <View style={styles.statContent}>
              <ThemedText
                type="title"
                style={[styles.statValue, { color: colors.info }]}
              >
                {data?.activeOrders ?? 0}
              </ThemedText>
              <ThemedText style={[styles.statChange, { color: colors.icon }]}>
                {data?.pendingShipments ?? 0} pending
              </ThemedText>
            </View>
          </SectionCard>
        </View>

        {/* Recent Activity */}
        <SectionCard title="Recent Activity">
          {loading ? (
            <ThemedText style={[styles.loadingText, { color: colors.icon }]}>
              Loading recent activity...
            </ThemedText>
          ) : error ? (
            <ThemedText style={[styles.errorText, { color: colors.error }]}>
              Failed to load recent activity
            </ThemedText>
          ) : (
            <View style={styles.activityList}>
              <View style={styles.activityItem}>
                <IconSymbol name="cart.fill" size={16} color={colors.success} />
                <ThemedText style={styles.activityText}>
                  New order from Green Grocers
                </ThemedText>
                <ThemedText
                  style={[styles.activityTime, { color: colors.icon }]}
                >
                  2h ago
                </ThemedText>
              </View>
              <View style={styles.activityItem}>
                <IconSymbol
                  name="checkmark.circle.fill"
                  size={16}
                  color={colors.info}
                />
                <ThemedText style={styles.activityText}>
                  Harvest task completed
                </ThemedText>
                <ThemedText
                  style={[styles.activityTime, { color: colors.icon }]}
                >
                  4h ago
                </ThemedText>
              </View>
              <View style={styles.activityItem}>
                <IconSymbol
                  name="message.fill"
                  size={16}
                  color={colors.warning}
                />
                <ThemedText style={styles.activityText}>
                  Message from supplier
                </ThemedText>
                <ThemedText
                  style={[styles.activityTime, { color: colors.icon }]}
                >
                  1d ago
                </ThemedText>
              </View>
            </View>
          )}
        </SectionCard>

        {/* Debug Section - Development Only */}
        {__DEV__ && (
          <SectionCard title="Debug (Dev Only)">
            <TouchableOpacity
              style={[styles.debugToggle, { backgroundColor: colors.tint }]}
              onPress={() => setShowDebug(!showDebug)}
            >
              <ThemedText style={styles.debugToggleText}>
                {showDebug ? "Hide" : "Show"} Database Debug Info
              </ThemedText>
            </TouchableOpacity>

            {showDebug && <DatabaseDebugComponent />}
          </SectionCard>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 12,
  },
  header: {
    marginBottom: 8,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  welcome: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  quickActionsCard: {
    marginBottom: 8,
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  quickActionItem: {
    flex: 1,
    minWidth: "45%",
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: "white",
  },
  quickActionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  flexItem: {
    flex: 1,
  },
  statContent: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  statChange: {
    fontSize: 14,
  },
  loadingText: {
    textAlign: "center",
    fontStyle: "italic",
  },
  errorText: {
    textAlign: "center",
  },
  activityList: {
    gap: 12,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  activityText: {
    flex: 1,
    fontSize: 14,
  },
  activityTime: {
    fontSize: 12,
  },
  debugToggle: {
    padding: 8,
    borderRadius: 4,
    alignItems: "center",
    marginBottom: 10,
  },
  debugToggleText: {
    color: "white",
    fontWeight: "bold",
  },
});
