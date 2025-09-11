import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAuth } from '@/lib';
import { 
  farmTaskService, 
  productListingService, 
  orderService, 
  messagesService,
  FarmTask,
  ProductListing,
  Order,
  Message
} from '@/lib';

interface DashboardStats {
  totalTasks: number;
  pendingTasks: number;
  activeListings: number;
  pendingOrders: number;
  unreadMessages: number;
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalTasks: 0,
    pendingTasks: 0,
    activeListings: 0,
    pendingOrders: 0,
    unreadMessages: 0,
  });
  const [recentTasks, setRecentTasks] = useState<FarmTask[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardData = async () => {
    try {
      if (!user?.id) return;

      // Load farm tasks
      const tasksResponse = await farmTaskService.getByFarmer(user.id);

      if (tasksResponse.success) {
        setRecentTasks(tasksResponse.data || []);
        const totalTasks = await farmTaskService.count([
          { column: 'farmer_id', operator: 'eq', value: user.id }
        ]);
        const pendingTasks = await farmTaskService.count([
          { column: 'farmer_id', operator: 'eq', value: user.id },
          { column: 'status', operator: 'eq', value: 'pending' }
        ]);
        
        setStats(prev => ({
          ...prev,
          totalTasks: totalTasks.success ? totalTasks.data || 0 : 0,
          pendingTasks: pendingTasks.success ? pendingTasks.data || 0 : 0,
        }));
      }

      // Load product listings
      const listingsResponse = await productListingService.getAll({
        filters: [{ column: 'farmer_id', operator: 'eq', value: user.id }],
        pagination: { page: 1, limit: 5 },
        sorts: [{ column: 'created_at', ascending: false }]
      });

      if (listingsResponse.success) {
        const activeListings = await productListingService.count([
          { column: 'farmer_id', operator: 'eq', value: user.id },
          { column: 'status', operator: 'eq', value: 'available' }
        ]);
        
        setStats(prev => ({
          ...prev,
          activeListings: activeListings.success ? activeListings.data || 0 : 0,
        }));
      }

      // Load orders
      const ordersResponse = await orderService.getAll({
        filters: [{ column: 'farmer_id', operator: 'eq', value: user.id }],
        pagination: { page: 1, limit: 5 },
        sorts: [{ column: 'created_at', ascending: false }]
      });

      if (ordersResponse.success) {
        setRecentOrders(ordersResponse.data || []);
        const pendingOrders = await orderService.count([
          { column: 'farmer_id', operator: 'eq', value: user.id },
          { column: 'status', operator: 'eq', value: 'pending' }
        ]);
        
        setStats(prev => ({
          ...prev,
          pendingOrders: pendingOrders.success ? pendingOrders.data || 0 : 0,
        }));
      }

      // Load messages
      const messagesResponse = await messagesService.getAll({
        filters: [{ column: 'receiver_id', operator: 'eq', value: user.id }],
        pagination: { page: 1, limit: 5 },
        sorts: [{ column: 'created_at', ascending: false }]
      });

      if (messagesResponse.success) {
        const unreadMessages = await messagesService.count([
          { column: 'receiver_id', operator: 'eq', value: user.id },
          { column: 'is_read', operator: 'eq', value: false }
        ]);
        
        setStats(prev => ({
          ...prev,
          unreadMessages: unreadMessages.success ? unreadMessages.data || 0 : 0,
        }));
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const StatCard = ({ title, value, icon, color }: { title: string; value: number; icon: any; color: string }) => (
    <ThemedView style={[styles.statCard, { borderLeftColor: color }]}>
      <IconSymbol name={icon} size={24} color={color} />
      <ThemedText type="subtitle" style={styles.statValue}>{value}</ThemedText>
      <ThemedText style={styles.statTitle}>{title}</ThemedText>
    </ThemedView>
  );

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <ThemedView style={styles.header}>
        <ThemedText type="title">Dashboard</ThemedText>
        <ThemedText style={styles.welcomeText}>
          Welcome back, {user?.email || 'Farmer'}!
        </ThemedText>
      </ThemedView>

      {/* Stats Grid */}
      <ThemedView style={styles.statsGrid}>
        <StatCard 
          title="Total Tasks" 
          value={stats.totalTasks} 
          icon="checklist" 
          color="#4CAF50" 
        />
        <StatCard 
          title="Pending Tasks" 
          value={stats.pendingTasks} 
          icon="clock.fill" 
          color="#FF9800" 
        />
        <StatCard 
          title="Active Listings" 
          value={stats.activeListings} 
          icon="cart.fill" 
          color="#2196F3" 
        />
        <StatCard 
          title="Pending Orders" 
          value={stats.pendingOrders} 
          icon="bag.fill" 
          color="#9C27B0" 
        />
        <StatCard 
          title="Unread Messages" 
          value={stats.unreadMessages} 
          icon="message.fill" 
          color="#F44336" 
        />
      </ThemedView>

      {/* Recent Tasks */}
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>Recent Tasks</ThemedText>
        {recentTasks.length > 0 ? (
          recentTasks.map((task) => (
            <ThemedView key={task.id} style={styles.taskItem}>
              <ThemedText style={styles.taskTitle}>{task.title}</ThemedText>
              <ThemedText style={styles.taskDescription}>{task.description}</ThemedText>
              <ThemedText style={[styles.taskStatus, { color: task.status === 'completed' ? '#4CAF50' : '#FF9800' }]}>
                {task.status}
              </ThemedText>
            </ThemedView>
          ))
        ) : (
          <ThemedText style={styles.emptyText}>No recent tasks</ThemedText>
        )}
      </ThemedView>

      {/* Recent Orders */}
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>Recent Orders</ThemedText>
        {recentOrders.length > 0 ? (
          recentOrders.map((order) => (
            <ThemedView key={order.id} style={styles.orderItem}>
              <ThemedText style={styles.orderId}>Order #{order.id}</ThemedText>
              <ThemedText style={styles.orderTotal}>₹{order.total_amount}</ThemedText>
              <ThemedText style={[styles.orderStatus, { color: order.status === 'delivered' ? '#4CAF50' : '#FF9800' }]}>
                {order.status}
              </ThemedText>
            </ThemedView>
          ))
        ) : (
          <ThemedText style={styles.emptyText}>No recent orders</ThemedText>
        )}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  welcomeText: {
    marginTop: 8,
    opacity: 0.7,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statTitle: {
    fontSize: 12,
    opacity: 0.7,
    textAlign: 'center',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  taskItem: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 8,
  },
  taskTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  taskDescription: {
    opacity: 0.7,
    marginBottom: 8,
  },
  taskStatus: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  orderItem: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderId: {
    fontWeight: '600',
  },
  orderTotal: {
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  orderStatus: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.5,
    fontStyle: 'italic',
    padding: 20,
  },
});
