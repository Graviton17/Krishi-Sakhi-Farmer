import { useAuth } from "@/contexts/AuthContext";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function DashboardSummary() {
  const { user, signOut } = useAuth();

  const featureCards = [
    {
      title: "🌱 Product Listings",
      description: "Manage your farm produce listings with AI quality reports",
      colors: "bg-primary-50 border-primary-200",
      textColor: "text-primary-800",
    },
    {
      title: "📋 Farm Tasks",
      description: "Track and manage your daily farming activities",
      colors: "bg-warning-50 border-warning-200",
      textColor: "text-warning-800",
    },
    {
      title: "🛒 Marketplace",
      description: "Browse and purchase fresh produce from verified farmers",
      colors: "bg-success-50 border-success-200",
      textColor: "text-success-800",
    },
    {
      title: "💬 Communication",
      description: "Real-time messaging with buyers and sellers",
      colors: "bg-secondary-50 border-secondary-200",
      textColor: "text-secondary-800",
    },
    {
      title: "🔒 Blockchain Integration",
      description: "Transparent and secure transaction tracking",
      colors: "bg-neutral-50 border-neutral-200",
      textColor: "text-neutral-800",
    },
    {
      title: "📊 Analytics",
      description: "Monitor your sales, reviews, and performance metrics",
      colors: "bg-error-50 border-error-200",
      textColor: "text-error-800",
    },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Krishi Sakhi</Text>
            <Text style={styles.headerSubtitle}>
              Agricultural Marketplace & Farm Management Platform
            </Text>
          </View>

          <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* User Info */}
      {user && (
        <View style={styles.userCard}>
          <View style={styles.userCardContent}>
            <View style={styles.userInfo}>
              <Text style={styles.welcomeText}>Welcome back! 👋</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
            </View>

            {/* Role badge - simulated for demo */}
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>🌾 Farmer</Text>
            </View>
          </View>
        </View>
      )}

      {/* Platform Features */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Platform Features</Text>

        <View style={styles.featureList}>
          {featureCards.map((feature, index) => (
            <TouchableOpacity key={index} style={styles.featureCard}>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDescription}>
                {feature.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Technology Stack */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Technology Stack</Text>

        <View style={styles.technologyCard}>
          <View style={styles.technologyList}>
            <View style={styles.technologyItem}>
              <View style={styles.technologyIcon}>
                <Text style={styles.emoji}>⚛️</Text>
              </View>
              <View>
                <Text style={styles.technologyName}>React Native + Expo</Text>
                <Text style={styles.technologyDescription}>
                  Cross-platform mobile development
                </Text>
              </View>
            </View>

            <View style={styles.technologyItem}>
              <View style={styles.technologyIcon}>
                <Text style={styles.emoji}>🗄️</Text>
              </View>
              <View>
                <Text style={styles.technologyName}>Supabase</Text>
                <Text style={styles.technologyDescription}>
                  PostgreSQL database with real-time features
                </Text>
              </View>
            </View>

            <View style={styles.technologyItem}>
              <View style={styles.technologyIcon}>
                <Text style={styles.emoji}>🎨</Text>
              </View>
              <View>
                <Text style={styles.technologyName}>
                  Tailwind CSS (NativeWind)
                </Text>
                <Text style={styles.technologyDescription}>
                  Utility-first styling framework
                </Text>
              </View>
            </View>

            <View style={styles.technologyItem}>
              <View style={styles.technologyIcon}>
                <Text style={styles.emoji}>🔐</Text>
              </View>
              <View>
                <Text style={styles.technologyName}>TypeScript</Text>
                <Text style={styles.technologyDescription}>
                  Type-safe development experience
                </Text>
              </View>
            </View>

            <View style={styles.technologyItem}>
              <View style={styles.technologyIcon}>
                <Text style={styles.emoji}>🔗</Text>
              </View>
              <View>
                <Text style={styles.technologyName}>
                  Blockchain Integration
                </Text>
                <Text style={styles.technologyDescription}>
                  Transparent transaction tracking
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Database Schema Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Database Schema</Text>

        <View style={styles.schemaCard}>
          <Text style={styles.schemaIntro}>
            Complete agricultural marketplace schema with:
          </Text>

          <View style={styles.schemaList}>
            {[
              "👥 User profiles with role-based access",
              "🥕 Product catalog with GTIN support",
              "📦 Product listings with quality reports",
              "🛒 Order management system",
              "💳 Payment processing integration",
              "⭐ Review and rating system",
              "📜 Certification tracking with IPFS",
              "💬 Real-time messaging system",
              "🚚 Shipment and logistics tracking",
              "🌡️ Cold chain monitoring",
              "🤝 Negotiation system",
              "⚖️ Dispute resolution",
              "📋 Farm task management",
            ].map((item, index) => (
              <View key={index} style={styles.schemaItem}>
                <Text style={styles.schemaItemText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerCard}>
          <Text style={styles.footerTitle}>Ready to Start Building? 🚀</Text>
          <Text style={styles.footerText}>
            Your Krishi Sakhi platform is fully configured with Supabase,
            Tailwind CSS, and comprehensive TypeScript types.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  header: {
    backgroundColor: "#3b82f6",
    paddingTop: 64,
    paddingBottom: 48,
    paddingHorizontal: 24,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  headerText: {
    flex: 1,
    marginRight: 16,
  },
  headerTitle: {
    color: "white",
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 8,
  },
  headerSubtitle: {
    color: "#dbeafe",
    fontSize: 16,
    lineHeight: 20,
  },
  signOutButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  signOutText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
  userCard: {
    backgroundColor: "white",
    marginHorizontal: 16,
    marginTop: -24,
    padding: 24,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  userCardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  userInfo: {
    flex: 1,
    marginRight: 16,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },
  userEmail: {
    color: "#6b7280",
    fontSize: 16,
  },
  roleBadge: {
    backgroundColor: "#eff6ff",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  roleBadgeText: {
    color: "#1d4ed8",
    fontSize: 14,
    fontWeight: "600",
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 32,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  featureList: {
    gap: 16,
  },
  featureCard: {
    backgroundColor: "#f3f4f6",
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
    color: "#374151",
  },
  featureDescription: {
    color: "#6b7280",
    lineHeight: 20,
    fontSize: 15,
  },
  technologyCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  technologyList: {
    gap: 20,
  },
  technologyItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  technologyIcon: {
    width: 48,
    height: 48,
    backgroundColor: "#f8fafc",
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  emoji: {
    fontSize: 24,
  },
  technologyName: {
    fontWeight: "600",
    color: "#111827",
    fontSize: 16,
    marginBottom: 2,
  },
  technologyDescription: {
    fontSize: 14,
    color: "#6b7280",
  },
  schemaCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  schemaIntro: {
    color: "#374151",
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 20,
  },
  schemaList: {
    gap: 14,
  },
  schemaItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  schemaItemText: {
    fontSize: 15,
    color: "#374151",
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 48,
    paddingTop: 16,
  },
  footerCard: {
    backgroundColor: "#3b82f6",
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  footerTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 12,
  },
  footerText: {
    color: "#dbeafe",
    textAlign: "center",
    fontSize: 15,
    lineHeight: 24,
  },
});
