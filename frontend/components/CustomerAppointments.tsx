import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Plus, Search, Clock, User, Edit, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useBackend } from "../contexts/AuthContext";
import { CreateAppointmentDialog } from "./CreateAppointmentDialog";
import { EditAppointmentDialog } from "./EditAppointmentDialog";
import type { Appointment } from "~backend/appointments/types";

interface CustomerAppointmentsProps {
  customerId: string;
  customerName: string;
}

export function CustomerAppointments({ customerId, customerName }: CustomerAppointmentsProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<"upcoming" | "past" | "all">("upcoming");
  
  const backend = useBackend();
  const { toast } = useToast();

  const { data: appointmentsData, isLoading, refetch } = useQuery({
    queryKey: ["customer-appointments", customerId, statusFilter, dateFilter],
    queryFn: async () => {
      try {
        const now = new Date();
        const params: any = { customerId };
        
        if (statusFilter) {
          params.status = statusFilter;
        }
        
        if (dateFilter === "upcoming") {
          params.fromDate = now;
        } else if (dateFilter === "past") {
          params.toDate = now;
        }
        
        return await backend.appointments.getByCustomer(params);
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
    enabled: !!customerId,
  });

  const filteredAppointments = appointmentsData?.appointments?.filter(appointment =>
    !searchQuery || 
    appointment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    appointment.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    appointment.assignedTo.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Badge variant="secondary" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Đã lên lịch
        </Badge>;
      case "completed":
        return <Badge variant="default" className="flex items-center gap-1 bg-green-600">
          <CheckCircle className="h-3 w-3" />
          Hoàn thành
        </Badge>;
      case "cancelled":
        return <Badge variant="destructive" className="flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          Đã hủy
        </Badge>;
      case "no_show":
        return <Badge variant="outline" className="flex items-center gap-1 text-orange-600 border-orange-600">
          <AlertCircle className="h-3 w-3" />
          Không đến
        </Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString('vi-VN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowEditDialog(true);
  };

  const groupAppointmentsByMonth = (appointments: Appointment[]) => {
    const groups: Record<string, Appointment[]> = {};
    
    appointments.forEach(appointment => {
      const date = new Date(appointment.scheduledAt);
      const monthKey = date.toLocaleDateString('vi-VN', { year: 'numeric', month: 'long' });
      
      if (!groups[monthKey]) {
        groups[monthKey] = [];
      }
      groups[monthKey].push(appointment);
    });
    
    return groups;
  };

  const appointmentGroups = groupAppointmentsByMonth(filteredAppointments);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-muted rounded"></div>
            <div className="h-20 bg-muted rounded"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="card-modern">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle className="flex items-center text-lg text-slate-800">
              <Calendar className="h-5 w-5 mr-2" />
              Lịch hẹn của {customerName}
            </CardTitle>
            <Button onClick={() => setShowCreateDialog(true)} className="btn-gradient">
              <Plus className="h-4 w-4 mr-2" />
              Tạo lịch hẹn mới
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Tìm kiếm lịch hẹn..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tất cả trạng thái</SelectItem>
                <SelectItem value="scheduled">Đã lên lịch</SelectItem>
                <SelectItem value="completed">Hoàn thành</SelectItem>
                <SelectItem value="cancelled">Đã hủy</SelectItem>
                <SelectItem value="no_show">Không đến</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={dateFilter} onValueChange={(value: any) => setDateFilter(value)}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="upcoming">Sắp tới</SelectItem>
                <SelectItem value="past">Đã qua</SelectItem>
                <SelectItem value="all">Tất cả</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {Object.keys(appointmentGroups).length > 0 ? (
            <div className="space-y-6">
              {Object.entries(appointmentGroups)
                .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
                .map(([month, appointments]) => (
                <div key={month}>
                  <h3 className="text-lg font-semibold text-slate-700 mb-3 sticky top-0 bg-background/80 backdrop-blur-sm py-2">
                    {month}
                  </h3>
                  <div className="space-y-3">
                    {appointments
                      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
                      .map((appointment) => (
                      <Card key={appointment.id} className="p-4 hover:shadow-md transition-shadow border-l-4 border-blue-500">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold text-slate-800">{appointment.title}</h4>
                              {getStatusBadge(appointment.status)}
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-slate-600 mb-2">
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {formatDateTime(appointment.scheduledAt)}
                              </div>
                              <div className="flex items-center gap-1">
                                <span>{appointment.duration} phút</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                {appointment.assignedTo.name}
                              </div>
                            </div>
                            
                            {appointment.description && (
                              <p className="text-slate-600 mb-3">{appointment.description}</p>
                            )}
                            
                            {appointment.reminderMinutes && appointment.reminderMinutes.length > 0 && (
                              <div className="flex items-center gap-2 text-sm text-slate-500">
                                <AlertCircle className="h-4 w-4" />
                                <span>Nhắc nhở: {appointment.reminderMinutes.map(m => `${m} phút`).join(', ')} trước</span>
                              </div>
                            )}
                          </div>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditAppointment(appointment)}
                            className="ml-4"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 text-lg">
                {searchQuery || statusFilter ? "Không tìm thấy lịch hẹn nào" : "Chưa có lịch hẹn nào"}
              </p>
              <p className="text-slate-400 text-sm mt-2">
                {!searchQuery && !statusFilter && "Tạo lịch hẹn đầu tiên với khách hàng này"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <CreateAppointmentDialog
        customerId={customerId}
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={() => {
          refetch();
          setShowCreateDialog(false);
        }}
      />

      {selectedAppointment && (
        <EditAppointmentDialog
          appointment={selectedAppointment}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          onSuccess={() => {
            refetch();
            setShowEditDialog(false);
            setSelectedAppointment(null);
          }}
        />
      )}
    </div>
  );
}