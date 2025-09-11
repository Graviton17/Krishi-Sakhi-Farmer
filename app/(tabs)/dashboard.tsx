import DashboardSummary from '@/components/DashboardSummary';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import SectionCard from '@/components/ui/SectionCard';
import { useDashboard } from '@/hooks/useDashboard';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

export default function DashboardScreen() {
  // Use the static user ID for now
  const { loading, error, data } = useDashboard('static-user-id-123');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <ThemedView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedView style={styles.header}>
          <ThemedText type="title">Dashboard</ThemedText>
          <ThemedText>Your farm at a glance</ThemedText>
        </ThemedView>

        <SectionCard title="Summary">
          <DashboardSummary />
        </SectionCard>

        <View style={styles.row}>
          <SectionCard title="Revenue (30d)" style={styles.flexItem}>
            <ThemedText type="title">{formatCurrency(data?.revenueLastMonth ?? 0)}</ThemedText>
            <ThemedText>
              {data?.revenueGrowth ? (
                <>
                  {data.revenueGrowth > 0 ? '↑' : '↓'} {Math.abs(data.revenueGrowth).toFixed(1)}% vs last month
                </>
              ) : 'No previous data'}
            </ThemedText>
          </SectionCard>
          <SectionCard title="Orders in Progress" style={styles.flexItem}>
            <ThemedText type="title">{data?.activeOrders ?? 0}</ThemedText>
            <ThemedText>{data?.pendingShipments ?? 0} pending shipment</ThemedText>
          </SectionCard>
        </View>

        <SectionCard title="Next actions">
          {loading ? (
            <ThemedText>Loading tasks...</ThemedText>
          ) : error ? (
            <ThemedText style={styles.errorText}>Failed to load tasks</ThemedText>
          ) : data?.pendingTasks.length === 0 ? (
            <ThemedText>No pending tasks</ThemedText>
          ) : (
            data?.pendingTasks.map(task => (
              <ThemedText key={task.id}>• {task.title}</ThemedText>
            ))
          )}
        </SectionCard>

        <SectionCard title="Inventory Alerts">
          {loading ? (
            <ThemedText>Loading alerts...</ThemedText>
          ) : error ? (
            <ThemedText style={styles.errorText}>Failed to load inventory alerts</ThemedText>
          ) : data?.inventoryAlerts.length === 0 ? (
            <ThemedText>No inventory alerts</ThemedText>
          ) : (
            data?.inventoryAlerts.map(alert => (
              <ThemedText key={alert.productId}>
                • Low stock: {alert.productName} ({alert.currentStock} {alert.unit})
              </ThemedText>
            ))
          )}
        </SectionCard>

        <SectionCard title="Tips">
          <ThemedText>• Add certifications to increase buyer trust</ThemedText>
          <ThemedText>• Enable reminders for time-sensitive tasks</ThemedText>
          <ThemedText>• Check daily price trends before listing</ThemedText>
        </SectionCard>

        <SectionCard title="Insights">
          {loading ? (
            <ThemedText>Loading insights...</ThemedText>
          ) : (
            <View>
              <ThemedText>Revenue Growth: {data?.revenueGrowth.toFixed(1)}%</ThemedText>
              <ThemedText>Active Orders: {data?.activeOrders}</ThemedText>
              <ThemedText>Tasks Due: {data?.pendingTasks.length}</ThemedText>
            </View>
          )}
        </SectionCard>
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
    gap: 4,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flexItem: {
    flex: 1,
  },
  errorText: {
    color: '#ff4444'
  }
}); 