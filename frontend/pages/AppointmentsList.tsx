import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, MapPin, Plus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useBackend, useAuth } from "../contexts/AuthContext";
import { CreateAppointmentDialog } from "../components/CreateAppointmentDialog";

export function AppointmentsList() {
  const [view, setView] = useState<"upcoming" | "all">("upcoming");
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const backend = useBackend();
  const { toast } = useToast();

  const { data: appointmentsData, isLoading, error, refetch } = useQuery({
    queryKey: ["appointments", view],
    queryFn: async () => {
      try {
        const params: any = {};
        if (view === "upcoming") {
          params.fromDate = new Date();
          params.status = "scheduled";
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
    <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Lịch hẹn</h1>
            <p className="text-slate-600 mt-1">
              Tổng cộng {appointmentsData?.total || 0} lịch hẹn
            </p>
          </div>
          <div className="flex gap-3">
            <div className="flex gap-2 p-1 bg-white rounded-lg shadow-sm">
              <Button
                variant={view === "upcoming" ? "default" : "ghost"}
                size="sm"
                onClick={() => setView("upcoming")}
              >
Sắp tới
              </Button>
              <Button
                variant={view === "all" ? "default" : "ghost"}
                size="sm"
                onClick={() => setView("all")}
              >
Tất cả
              </Button>
            </div>
            <Button onClick={() => setShowCreateDialog(true)} className="btn-gradient">
              <Plus className="h-4 w-4 mr-2" />
              Lịch hẹn mới
            </Button>
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
                      <Button variant="outline" size="sm">
                        Chỉnh sửa
                      </Button>
                      {appointment.status === "scheduled" && (
                        <Button variant="outline" size="sm" className="text-green-600 hover:text-green-700">
Hoàn thành
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
    </div>
  );
}
