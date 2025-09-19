import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Calendar, Clock, User, MapPin, Plus, Edit, CheckCircle, Search } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useBackend, useAuth } from "../contexts/AuthContext";
import { CreateAppointmentDialog } from "../components/CreateAppointmentDialog";
import { EditAppointmentDialog } from "../components/EditAppointmentDialog";
import type { Appointment } from "~backend/appointments/types";

export function AppointmentsList() {
  const [view, setView] = useState<"upcoming" | "all">("upcoming");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");

  const backend = useBackend();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: appointmentsData, isLoading, error, refetch } = useQuery({
    queryKey: ["appointments", view, customerSearch],
    queryFn: async () => {
      try {
        const params: any = {};
        if (view === "upcoming") {
          params.fromDate = new Date();
          params.status = "scheduled";
        }
        if (customerSearch.trim()) {
          params.customerSearch = customerSearch.trim();
        }
        return await backend.appointments.list(params);
      } catch (err) {
        console.error("Failed to fetch appointments:", err);
        toast({
          title: "Lỗi",
          description: "Không thể tải danh sách lịch hẹn",
          variant: "destructive",
        });
        throw err;
      }
    },
  });

  const completeAppointmentMutation = useMutation({
    mutationFn: (appointment: Appointment) => {
      return backend.appointments.update({
        id: appointment.id,
        title: appointment.title,
        description: appointment.description,
        scheduledAt: appointment.scheduledAt,
        duration: appointment.duration,
        status: "completed",
        reminderMinutes: appointment.reminderMinutes || []
      });
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Lịch hẹn đã được đánh dấu hoàn thành",
      });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      refetch();
    },
    onError: (error: any) => {
      console.error("Lỗi khi hoàn thành lịch hẹn:", error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể hoàn thành lịch hẹn",
        variant: "destructive",
      });
    },
  });

  const handleCompleteAppointment = (appointment: Appointment) => {
    if (window.confirm(`Bạn có chắc chắn muốn đánh dấu lịch hẹn "${appointment.title}" là hoàn thành?`)) {
      completeAppointmentMutation.mutate(appointment);
    }
  };

  const canEditAppointment = (appointment: Appointment) => {
    return user?.role === "admin" || appointment.assignedTo.id === user?.id;
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "scheduled": return "default";
      case "completed": return "secondary";
      case "cancelled": return "destructive";
      case "no_show": return "outline";
      default: return "outline";
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-destructive">Không thể tải danh sách lịch hẹn</p>
          <Button onClick={() => refetch()} className="mt-2">
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="mx-auto">
        <div className="flex flex-col gap-4 mb-6 lg:mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">Lịch hẹn</h1>
              <p className="text-sm lg:text-base text-slate-600 mt-1">
                Tổng cộng {appointmentsData?.total || 0} lịch hẹn
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 lg:gap-3 w-full sm:w-auto">
              <div className="flex gap-1 p-1 bg-white rounded-lg shadow-sm">
                <Button
                  variant={view === "upcoming" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setView("upcoming")}
                  className="text-xs lg:text-sm"
                >
                  Sắp tới
                </Button>
                <Button
                  variant={view === "all" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setView("all")}
                  className="text-xs lg:text-sm"
                >
                  Tất cả
                </Button>
              </div>
              <Button onClick={() => setShowCreateDialog(true)} className="btn-gradient text-sm">
                <Plus className="h-4 w-4 mr-2" />
                <span className="sm:hidden">Mới</span>
                <span className="hidden sm:inline">Lịch hẹn mới</span>
              </Button>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input
              placeholder="Tìm kiếm theo tên khách hàng..."
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              className="pl-10 bg-white border-slate-200 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Appointments Grid */}
        <div className="grid gap-4">
          {isLoading ? (
            <Card className="card-modern">
              <CardContent className="p-8 text-center">
                <div className="animate-pulse text-slate-500">Đang tải lịch hẹn...</div>
              </CardContent>
            </Card>
          ) : appointmentsData?.appointments.length === 0 ? (
            <Card className="card-modern">
              <CardContent className="p-8 text-center">
                <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-700 mb-2">Không tìm thấy lịch hẹn nào</h3>
                <p className="text-slate-500">Tạo lịch hẹn đầu tiên để bắt đầu.</p>
              </CardContent>
            </Card>
          ) : (
            appointmentsData?.appointments.map((appointment: any) => (
              <Card key={appointment.id} className="card-modern hover:shadow-lg transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-slate-800">{appointment.title}</h3>
                        <Badge variant={getStatusBadgeVariant(appointment.status)}>
                          {appointment.status === 'scheduled' ? 'Đã lên lịch' :
                           appointment.status === 'completed' ? 'Hoàn thành' :
                           appointment.status === 'cancelled' ? 'Đã hủy' :
                           appointment.status === 'no_show' ? 'Không đến' : appointment.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>{appointment.customerName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(appointment.scheduledAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>{new Date(appointment.scheduledAt).toLocaleTimeString()} ({appointment.duration} min)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>{appointment.assignedTo.name}</span>
                        </div>
                      </div>
                      
                      {appointment.description && (
                        <p className="mt-3 text-slate-600 text-sm">{appointment.description}</p>
                      )}
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      {canEditAppointment(appointment) && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setEditingAppointment(appointment)}
                          className="text-sm"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          <span className="hidden sm:inline">Chỉnh sửa</span>
                        </Button>
                      )}
                      {appointment.status === "scheduled" && canEditAppointment(appointment) && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-green-600 hover:text-green-700 hover:bg-green-50 text-sm"
                          onClick={() => handleCompleteAppointment(appointment)}
                          disabled={completeAppointmentMutation.isPending}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          <span className="hidden sm:inline">Hoàn thành</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <CreateAppointmentDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={() => {
          refetch();
          setShowCreateDialog(false);
        }}
      />

      {editingAppointment && (
        <EditAppointmentDialog
          appointment={editingAppointment}
          open={!!editingAppointment}
          onOpenChange={(open) => !open && setEditingAppointment(null)}
          onSuccess={() => {
            refetch();
            setEditingAppointment(null);
          }}
        />
      )}
    </div>
  );
}
