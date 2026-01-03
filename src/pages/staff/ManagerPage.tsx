import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  Users,
  DollarSign,
  ShoppingBag,
  BarChart3,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/contexts/CurrencyContext";
import { getDashboardAnalytics } from "../../services/analyticsService";

const ManagerPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { formatPrice } = useCurrency();
  const [staffData, setStaffData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    const data = localStorage.getItem("staffData");
    const token = localStorage.getItem("staffToken");

    if (!data || !token) {
      navigate("/staff/manager/login");
      return;
    }

    const parsedData = JSON.parse(data);
    console.log("Staff data loaded:", parsedData);
    setStaffData(parsedData);

    // Initial fetch
    fetchAnalytics();

    // Set up polling every 60 seconds
    const interval = setInterval(() => {
      fetchAnalytics(true);
    }, 60000);

    return () => clearInterval(interval);
  }, [navigate]);

  const fetchAnalytics = useCallback(
    async (silent = false) => {
      try {
        if (!silent) setLoading(true);
        else setRefreshing(true);

        const data = await getDashboardAnalytics("today");
        setAnalytics(data);
      } catch (error) {
        console.error("Error fetching analytics:", error);
        toast({
          variant: "destructive",
          description: "Failed to load analytics data",
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [toast]
  );

  const handleRefresh = () => {
    fetchAnalytics();
    toast({
      description: "Dashboard refreshed",
    });
  };

  if (!staffData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (loading && !analytics) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">
              Loading dashboard data...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Default values if analytics is not loaded yet
  const todayStats = {
    revenue: parseFloat(analytics?.revenueToday || "0"),
    orders: analytics?.totalOrdersToday || 0,
    customers: analytics?.activeToday || 0,
    averageOrderValue: parseFloat(analytics?.avgOrderValue || "0"),
    revenueChange: analytics?.revenueChange || "+0%",
    revenueChangePositive: analytics?.revenueChangePositive ?? true,
    ordersChange: analytics?.ordersChange || "+0%",
    ordersChangePositive: analytics?.ordersChangePositive ?? true,
  };

  // Get top 4 items from recent orders for "top selling"
  const topItems =
    analytics?.recentOrders?.slice(0, 4).map((order: any) => ({
      name: order.items[0] || "Unknown Item",
      orders: 1,
      revenue: order.total,
    })) || [];

  // Mock staff performance data (you can fetch this from a staff endpoint if available)
  const staffPerformance = [
    { name: "Staff Member", role: "Waiter", tables: 0, rating: 4.5 },
  ];

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Page Header with Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Overview</h1>
          <p className="text-sm text-muted-foreground">
            Welcome, {staffData.fullName || staffData.username}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="gap-2"
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>
        {/* Today's Stats */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Today's Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Total Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatPrice(todayStats.revenue)}
                </div>
                <p
                  className={`text-xs mt-1 ${
                    todayStats.revenueChangePositive
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {todayStats.revenueChange} from yesterday
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4" />
                  Total Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{todayStats.orders}</div>
                <p
                  className={`text-xs mt-1 ${
                    todayStats.ordersChangePositive
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {todayStats.ordersChange} from yesterday
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Active Tables
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{todayStats.customers}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Unique tables served
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Avg Order Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatPrice(todayStats.averageOrderValue)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Per order average
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {topItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No orders yet today</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {topItems.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between pb-3 border-b last:border-0"
                    >
                      <div className="space-y-1">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.orders} order{item.orders !== 1 ? "s" : ""}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          {formatPrice(item.revenue)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Item */}
          <Card>
            <CardHeader>
              <CardTitle>Most Popular Item</CardTitle>
            </CardHeader>
            <CardContent>
              {analytics?.popularDish ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="space-y-1">
                      <div className="font-bold text-lg">
                        {analytics.popularDish.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Most ordered today
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">
                        {analytics.popularDish.count}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        orders
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No popular items yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button
                variant="outline"
                className="h-auto py-6 flex-col gap-2"
                onClick={() => navigate("/staff/manager/staff")}
              >
                <Users className="h-6 w-6" />
                <span className="text-sm">Staff Management</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-6 flex-col gap-2"
                onClick={() => navigate("/staff/manager/menu")}
              >
                <ShoppingBag className="h-6 w-6" />
                <span className="text-sm">Menu Management</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-6 flex-col gap-2"
                onClick={() => navigate("/staff/manager/analytics")}
              >
                <BarChart3 className="h-6 w-6" />
                <span className="text-sm">Analytics</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-6 flex-col gap-2"
                onClick={() => navigate("/staff/manager/orders")}
              >
                <DollarSign className="h-6 w-6" />
                <span className="text-sm">View Orders</span>
              </Button>
            </div>
          </CardContent>
        </Card>
    </div>
  );
};

export default ManagerPage;
