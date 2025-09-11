import {
  farmTaskService,
  orderService,
  paymentService,
  productListingService,
  productService,
} from "@/services/entities";
import { useEffect, useState } from "react";

interface DashboardTask {
  id: string;
  title: string;
  dueDate: Date;
}

interface InventoryAlert {
  productId: string;
  productName: string;
  currentStock: number;
  unit: string;
}

interface DashboardData {
  revenueLastMonth: number;
  revenueGrowth: number;
  activeOrders: number;
  pendingShipments: number;
  pendingTasks: DashboardTask[];
  inventoryAlerts: InventoryAlert[];
}

export function useDashboard(farmerId: string | null) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      // Don't load data if farmerId is null
      if (!farmerId) {
        setLoading(false);
        setError("No farmer ID available");
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Get all active orders
        const ordersResponse = await orderService.getAll({
          filters: [
            { column: "seller_id", operator: "eq", value: farmerId },
            {
              column: "status",
              operator: "in",
              value: ["pending", "processing", "shipping"],
            },
          ],
        });

        // Get all payments from last 60 days to calculate revenue growth
        const now = new Date();
        const thirtyDaysAgo = new Date(
          now.getTime() - 30 * 24 * 60 * 60 * 1000
        );
        const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

        const paymentsResponse = await paymentService.getAll({
          filters: [
            { column: "seller_id", operator: "eq", value: farmerId },
            { column: "status", operator: "eq", value: "completed" },
            {
              column: "created_at",
              operator: "gte",
              value: sixtyDaysAgo.toISOString(),
            },
          ],
        });

        // Calculate revenue
        let lastMonthRevenue = 0;
        let previousMonthRevenue = 0;

        if (paymentsResponse.success && paymentsResponse.data) {
          paymentsResponse.data.forEach((payment) => {
            const paymentDate = new Date(payment.created_at);
            if (paymentDate >= thirtyDaysAgo) {
              lastMonthRevenue += payment.amount;
            } else {
              previousMonthRevenue += payment.amount;
            }
          });
        }

        const revenueGrowth = previousMonthRevenue
          ? ((lastMonthRevenue - previousMonthRevenue) / previousMonthRevenue) *
            100
          : 0;

        // Get pending tasks
        const tasksResponse = await farmTaskService.getAll({
          filters: [
            { column: "farmer_id", operator: "eq", value: farmerId },
            { column: "status", operator: "eq", value: "pending" },
          ],
          sorts: [{ column: "due_date", ascending: true }],
        });

        // Get current inventory
        const listingsResponse = await productListingService.getAll({
          filters: [
            { column: "farmer_id", operator: "eq", value: farmerId },
            { column: "status", operator: "eq", value: "available" },
          ],
        });

        // Count pending shipments
        const pendingShipments = ordersResponse.success
          ? ordersResponse.data?.filter((order) => order.status === "confirmed")
              .length ?? 0
          : 0;

        // Format tasks
        const pendingTasks = tasksResponse.success
          ? tasksResponse.data?.map((task) => ({
              id: task.id,
              title: task.title,
              dueDate: new Date(task.due_date ?? Date.now()),
            }))
          : [];

        // Check inventory alerts (items below threshold)
        const inventoryAlerts = [];
        if (listingsResponse.success && listingsResponse.data) {
          for (const listing of listingsResponse.data) {
            // Alert when quantity is 20 or less
            if (listing.quantity_available <= 20) {
              const productResponse = await productService.getById(
                listing.product_id
              );
              if (productResponse.success && productResponse.data) {
                inventoryAlerts.push({
                  productId: listing.product_id,
                  productName: productResponse.data.name,
                  currentStock: listing.quantity_available,
                  unit: listing.unit_of_measure,
                });
              }
            }
          }
        }

        setData({
          revenueLastMonth: lastMonthRevenue,
          revenueGrowth,
          activeOrders: ordersResponse.success
            ? ordersResponse.data?.length || 0
            : 0,
          pendingShipments,
          pendingTasks: pendingTasks || [],
          inventoryAlerts,
        });
      } catch (err) {
        console.error("Error loading dashboard data:", err);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [farmerId]);

  return { loading, error, data };
}
