/**
 * Home Tab - Enhanced Dashboard
 * Main landing screen with farm overview and quick actions
 */

import { AuthTestComponent } from "@/components/AuthTestComponent";
import DashboardSummary from "@/components/DashboardSummary";
import { DatabaseDebugComponent } from "@/components/DatabaseDebugComponent";
import { DatabaseTest } from "@/components/DatabaseTest";
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import {
  Card,
  Column,
  Container,
  Grid,
  Row,
  ScreenContainer,
  Spacer,
} from "@/components/ui/Layout";
import { Colors } from "@/constants/Colors";
import { useAuth } from "@/contexts/AuthContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useDashboard } from "@/hooks/useDashboard";
import { router } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function HomeScreen() {
  const { user } = useAuth();
  const { loading, data } = useDashboard(user?.id || null);
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
      onPress: () => router.push("/(tabs)/marketplace"),
    },
    {
      title: "View Tasks",
      icon: "checklist",
      color: colors.info,
      onPress: () => router.push("/(tabs)/tasks"),
    },
    {
      title: "Messages",
      icon: "message.fill",
      color: colors.warning,
      onPress: () => router.push("/(tabs)/messages"),
    },
    {
      title: "Quality Check",
      icon: "camera.fill",
      color: "#9C27B0",
      onPress: () => router.push("/(tabs)/quality-assessment"),
    },
  ];

  const renderQuickActionCard = (action: any, index: number) => (
    <TouchableOpacity
      key={index}
      onPress={action.onPress}
      activeOpacity={0.7}
      style={{ flex: 1 }}
    >
      <Card style={styles.quickActionCard}>
        <Column align="center" gap={8}>
          <View
            style={[styles.quickActionIcon, { backgroundColor: action.color }]}
          >
            <IconSymbol name={action.icon} size={24} color="white" />
          </View>
          <Text style={[styles.quickActionText, { color: colors.text }]}>
            {action.title}
          </Text>
        </Column>
      </Card>
    </TouchableOpacity>
  );

  const renderStatsCard = (
    title: string,
    value: string,
    icon: any,
    color: string
  ) => (
    <Card style={styles.statsCard}>
      <Row justify="space-between" align="center">
        <Column gap={4}>
          <Text style={[styles.statsTitle, { color: colors.icon }]}>
            {title}
          </Text>
          <Text style={[styles.statsValue, { color: colors.text }]}>
            {value}
          </Text>
        </Column>
        <View style={[styles.statsIcon, { backgroundColor: color }]}>
          <IconSymbol name={icon} size={20} color="white" />
        </View>
      </Row>
    </Card>
  );

  if (loading) {
    return (
      <ScreenContainer>
        <Container style={styles.loadingContainer}>
          <ThemedText>Loading dashboard...</ThemedText>
        </Container>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Container>
        {/* Welcome Section */}
        <Card padding="lg">
          <Column gap={8}>
            <Text style={[styles.welcomeTitle, { color: colors.text }]}>
              Good Morning! 🌱
            </Text>
            <Text style={[styles.welcomeSubtitle, { color: colors.icon }]}>
              Your farm at a glance
            </Text>
            {!user && (
              <Text style={[styles.debugNote, { color: colors.error }]}>
                Not authenticated - showing demo data
              </Text>
            )}
          </Column>
        </Card>

        <Spacer size="lg" />

        {/* Stats Grid */}
        <Grid columns={2} gap={16}>
          {renderStatsCard(
            "Total Products",
            (data as any)?.totalProducts?.toString() || "12",
            "cube.box.fill" as any,
            colors.success
          )}
          {renderStatsCard(
            "Active Orders",
            data?.activeOrders?.toString() || "8",
            "bag.fill" as any,
            colors.info
          )}
          {renderStatsCard(
            "Revenue",
            formatCurrency((data as any)?.totalRevenue || 25000),
            "indianrupeesign.circle.fill" as any,
            colors.warning
          )}
          {renderStatsCard(
            "Pending Tasks",
            data?.pendingTasks?.toString() || "5",
            "clock.fill" as any,
            "#9C27B0"
          )}
        </Grid>

        <Spacer size="lg" />

        {/* Quick Actions */}
        <Card padding="lg">
          <Column gap={16}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Quick Actions
            </Text>
            <Grid columns={2} gap={12}>
              {quickActions.map(renderQuickActionCard)}
            </Grid>
          </Column>
        </Card>

        <Spacer size="lg" />

        {/* Dashboard Summary */}
        {data && (
          <Card padding="none">
            <DashboardSummary />
          </Card>
        )}

        <Spacer size="lg" />

        {/* Debug Section */}
        <Card padding="md">
          <Column gap={12}>
            <Row justify="space-between" align="center">
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Debug Tools
              </Text>
              <TouchableOpacity
                onPress={() => setShowDebug(!showDebug)}
                style={[
                  styles.debugToggle,
                  { backgroundColor: colors.secondary },
                ]}
              >
                <Text style={[styles.debugToggleText, { color: colors.text }]}>
                  {showDebug ? "Hide" : "Show"}
                </Text>
              </TouchableOpacity>
            </Row>

            {showDebug && (
              <Column gap={16}>
                <AuthTestComponent />
                <DatabaseTest />
                <DatabaseDebugComponent />
              </Column>
            )}
          </Column>
        </Card>

        <Spacer size="xl" />
      </Container>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  welcomeSubtitle: {
    fontSize: 16,
    fontWeight: "500",
  },
  debugNote: {
    fontSize: 14,
    fontStyle: "italic",
    marginTop: 8,
  },
  statsCard: {
    minHeight: 80,
  },
  statsTitle: {
    fontSize: 14,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statsValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  statsIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  quickActionCard: {
    minHeight: 100,
    justifyContent: "center",
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  debugToggle: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  debugToggleText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
