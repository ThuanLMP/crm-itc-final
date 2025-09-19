import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, Phone, Calendar, Activity, Clock, Briefcase, ShoppingBag, UserCheck } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useBackend, useAuth } from "../contexts/AuthContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 text-sm bg-background/80 backdrop-blur-sm rounded-lg border shadow-lg">
        <p className="label font-bold">{`${label}`}</p>
        <p className="intro text-primary">{`${payload[0].name} : ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

export function Dashboard() {
  const backend = useBackend();
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      try {
        return await backend.reports.getDashboard();
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        toast({
          title: "Lỗi",
          description: "Không thể tải dữ liệu dashboard",
          variant: "destructive",
        });
        throw err;
      }
    },
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-1/4 mb-4"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-200 rounded"></div>
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2 mt-6">
            <div className="h-64 bg-slate-200 rounded"></div>
            <div className="h-64 bg-slate-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-destructive">Không thể tải dashboard. Vui lòng thử lại.</div>;
  }

  return (
    <div className="p-4 lg:p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">Bảng điều khiển</h1>
          <p className="text-sm lg:text-base text-slate-600">Chào mừng trở lại, {user?.name}</p>
        </div>

        {/* Top Stats */}
        <div className="grid gap-3 lg:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng khách hàng</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800">{dashboardData?.totalCustomers || 0}</div>
              <p className="text-xs text-slate-500">Khách hàng đang hoạt động</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng lịch hẹn</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800">{dashboardData?.totalAppointments || 0}</div>
              <p className="text-xs text-slate-500">Tất cả lịch hẹn đã lên kế hoạch</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng liên hệ</CardTitle>
              <Phone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800">{dashboardData?.totalContacts || 0}</div>
              <p className="text-xs text-slate-500">Tất cả tương tác khách hàng</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:gap-6 grid-cols-1 lg:grid-cols-2 mt-4 lg:mt-6">
          {/* Customers by Salesperson */}
          <Card>
            <CardHeader className="pb-2 lg:pb-3">
              <CardTitle className="flex items-center text-sm lg:text-base"><UserCheck className="mr-2 h-4 w-4 lg:h-5 lg:w-5" />Khách hàng theo nhân viên bán hàng</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={dashboardData?.customersBySalesperson}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="count" name="Khách hàng" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Customers by Type */}
          <Card>
            <CardHeader className="pb-2 lg:pb-3">
              <CardTitle className="flex items-center text-sm lg:text-base"><Briefcase className="mr-2 h-4 w-4 lg:h-5 lg:w-5" />Khách hàng theo loại</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={dashboardData?.customersByType}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {dashboardData?.customersByType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:gap-6 grid-cols-1 lg:grid-cols-2 mt-4 lg:mt-6">
          {/* Customers by Stage */}
          <Card>
            <CardHeader className="pb-2 lg:pb-3">
              <CardTitle className="flex items-center text-sm lg:text-base"><TrendingUp className="mr-2 h-4 w-4 lg:h-5 lg:w-5" />Khách hàng theo giai đoạn</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={dashboardData?.customersByStage}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="count" name="Khách hàng" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Customers by Product */}
          <Card>
            <CardHeader className="pb-2 lg:pb-3">
              <CardTitle className="flex items-center text-sm lg:text-base"><ShoppingBag className="mr-2 h-4 w-4 lg:h-5 lg:w-5" />Khách hàng theo sản phẩm</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={dashboardData?.customersByProduct}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="count" name="Khách hàng" fill="#ffc658" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:gap-6 grid-cols-1 lg:grid-cols-2 mt-4 lg:mt-6">
          {/* Recent Activities */}
          <Card>
            <CardHeader className="pb-2 lg:pb-3">
              <CardTitle className="flex items-center text-sm lg:text-base"><Activity className="mr-2 h-4 w-4 lg:h-5 lg:w-5" />Hoạt động gần đây</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 lg:space-y-4 max-h-64 overflow-y-auto">
                {dashboardData?.recentActivities.length ? dashboardData.recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-start">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3 mt-1.5 flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{activity.subject || `Contact (${activity.type})`}</p>
                      <p className="text-xs lg:text-sm text-muted-foreground">
                        Cùng <span className="font-semibold text-primary">{activity.customerName}</span> bởi {activity.createdBy}
                      </p>
                      <p className="text-xs text-muted-foreground">{new Date(activity.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                )) : <p className="text-sm text-muted-foreground">Không có hoạt động gần đây.</p>}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Appointments */}
          <Card>
            <CardHeader className="pb-2 lg:pb-3">
              <CardTitle className="flex items-center text-sm lg:text-base"><Clock className="mr-2 h-4 w-4 lg:h-5 lg:w-5" />Lịch hẹn sắp tới</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 lg:space-y-4 max-h-64 overflow-y-auto">
                {dashboardData?.upcomingAppointments.length ? dashboardData.upcomingAppointments.map((apt) => (
                  <div key={apt.id} className="flex items-start">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3 mt-1.5 flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{apt.title}</p>
                      <p className="text-xs lg:text-sm text-muted-foreground">
                        cùng <span className="font-semibold text-primary">{apt.customerName}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">{new Date(apt.scheduledAt).toLocaleString()}</p>
                    </div>
                  </div>
                )) : <p className="text-sm text-muted-foreground">Không có lịch hẹn sắp tới.</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
