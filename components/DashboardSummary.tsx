import { useAuth } from "@/contexts/AuthContext";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

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
    <ScrollView className="flex-1 bg-neutral-50">
      {/* Header */}
      <View className="bg-primary-500 pt-16 pb-12 px-6">
        <View className="flex-row items-center justify-between mb-8">
          <View className="flex-1 mr-4">
            <Text className="text-white text-3xl font-bold mb-2">
              Krishi Sakhi
            </Text>
            <Text className="text-primary-100 text-base leading-5">
              Agricultural Marketplace & Farm Management Platform
            </Text>
          </View>

          <TouchableOpacity
            className="bg-white/20 px-4 py-2.5 rounded-full border border-white/30 active:opacity-80"
            onPress={signOut}
          >
            <Text className="text-white text-sm font-medium">Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* User Info */}
      {user && (
        <View className="bg-white mx-4 -mt-6 p-6 rounded-2xl shadow-lg border border-neutral-100">
          <View className="flex-row items-center justify-between">
            <View className="flex-1 mr-4">
              <Text className="text-xl font-semibold text-neutral-900 mb-2">
                Welcome back! 👋
              </Text>
              <Text className="text-neutral-600 text-base">{user.email}</Text>
            </View>

            {/* Role badge - simulated for demo */}
            <View className="bg-primary-100/80 px-4 py-2 rounded-full border border-primary-200">
              <Text className="text-primary-700 text-sm font-semibold">
                🌾 Farmer
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Platform Features */}
      <View className="px-4 pt-8 pb-4">
        <Text className="text-2xl font-bold text-neutral-900 mb-6 px-2">
          Platform Features
        </Text>

        <View className="space-y-4">
          {featureCards.map((feature, index) => (
            <TouchableOpacity
              key={index}
              className={`${feature.colors} border-2 rounded-2xl p-5 active:opacity-90 shadow-sm`}
            >
              <Text
                className={`text-lg font-semibold mb-2.5 ${feature.textColor}`}
              >
                {feature.title}
              </Text>
              <Text className="text-neutral-600 leading-5 text-[15px]">
                {feature.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Technology Stack */}
      <View className="px-4 py-6">
        <Text className="text-2xl font-bold text-neutral-900 mb-6 px-2">
          Technology Stack
        </Text>

        <View className="bg-white rounded-2xl p-6 shadow-lg border border-neutral-100">
          <View className="space-y-5">
            <View className="flex-row items-center">
              <View className="w-12 h-12 bg-blue-50 rounded-full items-center justify-center mr-4">
                <Text className="text-2xl">⚛️</Text>
              </View>
              <View>
                <Text className="font-semibold text-neutral-900 text-[16px] mb-0.5">
                  React Native + Expo
                </Text>
                <Text className="text-[14px] text-neutral-600">
                  Cross-platform mobile development
                </Text>
              </View>
            </View>

            <View className="flex-row items-center">
              <View className="w-12 h-12 bg-green-50 rounded-full items-center justify-center mr-4">
                <Text className="text-2xl">🗄️</Text>
              </View>
              <View>
                <Text className="font-semibold text-neutral-900 text-[16px] mb-0.5">
                  Supabase
                </Text>
                <Text className="text-[14px] text-neutral-600">
                  PostgreSQL database with real-time features
                </Text>
              </View>
            </View>

            <View className="flex-row items-center">
              <View className="w-12 h-12 bg-pink-50 rounded-full items-center justify-center mr-4">
                <Text className="text-2xl">🎨</Text>
              </View>
              <View>
                <Text className="font-semibold text-neutral-900 text-[16px] mb-0.5">
                  Tailwind CSS (NativeWind)
                </Text>
                <Text className="text-[14px] text-neutral-600">
                  Utility-first styling framework
                </Text>
              </View>
            </View>

            <View className="flex-row items-center">
              <View className="w-12 h-12 bg-purple-50 rounded-full items-center justify-center mr-4">
                <Text className="text-2xl">🔐</Text>
              </View>
              <View>
                <Text className="font-semibold text-neutral-900 text-[16px] mb-0.5">
                  TypeScript
                </Text>
                <Text className="text-[14px] text-neutral-600">
                  Type-safe development experience
                </Text>
              </View>
            </View>

            <View className="flex-row items-center">
              <View className="w-12 h-12 bg-orange-50 rounded-full items-center justify-center mr-4">
                <Text className="text-2xl">🔗</Text>
              </View>
              <View>
                <Text className="font-semibold text-neutral-900 text-[16px] mb-0.5">
                  Blockchain Integration
                </Text>
                <Text className="text-[14px] text-neutral-600">
                  Transparent transaction tracking
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Database Schema Info */}
      <View className="px-4 py-6">
        <Text className="text-2xl font-bold text-neutral-900 mb-6 px-2">
          Database Schema
        </Text>

        <View className="bg-white rounded-2xl p-6 shadow-lg border border-neutral-100">
          <Text className="text-neutral-800 text-[16px] font-medium mb-5">
            Complete agricultural marketplace schema with:
          </Text>

          <View className="space-y-3.5">
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
              <View key={index} className="flex-row items-center">
                <Text className="text-[15px] text-neutral leading-5">
                  {item}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Footer */}
      <View className="px-4 pb-12 pt-4">
        <View className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl px-6 py-8 items-center shadow-lg">
          <Text className="text-white text-xl font-semibold mb-3">
            Ready to Start Building? 🚀
          </Text>
          <Text className="text-primary-100 text-center text-[15px] leading-6">
            Your Krishi Sakhi platform is fully configured with Supabase,
            Tailwind CSS, and comprehensive TypeScript types.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
