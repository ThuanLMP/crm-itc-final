import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useBackend, useAuth } from "../contexts/AuthContext";
import type { Appointment, UpdateAppointmentRequest } from "~backend/appointments/types";

interface EditAppointmentDialogProps {
  appointment: Appointment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditAppointmentDialog({ appointment, open, onOpenChange, onSuccess }: EditAppointmentDialogProps) {
  const [formData, setFormData] = useState<UpdateAppointmentRequest>({
    id: appointment.id,
    title: appointment.title,
    description: appointment.description || "",
    scheduledAt: appointment.scheduledAt,
    duration: appointment.duration,
    status: appointment.status,
    reminderMinutes: appointment.reminderMinutes || [],
  });

  const backend = useBackend();
  const { user } = useAuth();
  const { toast } = useToast();

  // Get list of employees for assignment (admin only)
  const { data: employeesData } = useQuery({
    queryKey: ["employees-for-assignment"],
    queryFn: () => backend.employees.list(),
    enabled: user?.role === "admin",
    staleTime: 0,
  });

  useEffect(() => {
    setFormData({
      id: appointment.id,
      title: appointment.title,
      description: appointment.description || "",
      scheduledAt: appointment.scheduledAt,
      duration: appointment.duration,
      status: appointment.status,
      reminderMinutes: appointment.reminderMinutes || [],
    });
  }, [appointment]);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateAppointmentRequest) => {
      return backend.appointments.update(data);
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Cập nhật lịch hẹn thành công",
      });
      onSuccess();
    },
    onError: (error: any) => {
      console.error("Có lỗi xảy ra:", error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật lịch hẹn",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast({
        title: "Lỗi",
        description: "Tiêu đề lịch hẹn là bắt buộc",
        variant: "destructive",
      });
      return;
    }
    updateMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof UpdateAppointmentRequest, value: string | number | Date | number[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Format datetime for input
  const formatDateTimeForInput = (date: Date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[95vw] lg:min-w-2xl max-h-[85vh] lg:max-h-[80vh] overflow-y-auto p-4 lg:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg lg:text-xl">Chỉnh sửa lịch hẹn</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 lg:space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
            <div className="lg:col-span-2">
              <Label htmlFor="title" className="text-sm lg:text-base">Tiêu đề *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                required
                className="text-sm lg:text-base"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description" className="text-sm lg:text-base">Mô tả</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              rows={3}
              className="text-sm lg:text-base"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
            <div>
              <Label htmlFor="scheduledAt" className="text-sm lg:text-base">Thời gian *</Label>
              <Input
                id="scheduledAt"
                type="datetime-local"
                value={formatDateTimeForInput(new Date(formData.scheduledAt))}
                onChange={(e) => handleInputChange("scheduledAt", new Date(e.target.value))}
                required
                className="text-sm lg:text-base"
              />
            </div>
            <div>
              <Label htmlFor="duration" className="text-sm lg:text-base">Thời lượng (phút) *</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                value={formData.duration}
                onChange={(e) => handleInputChange("duration", parseInt(e.target.value))}
                required
                className="text-sm lg:text-base"
              />
            </div>
          </div>

          <div>
            <Label className="text-sm lg:text-base">Trạng thái</Label>
            <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
              <SelectTrigger className="w-full text-sm lg:text-base">
                <SelectValue placeholder="Chọn trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Đã lên lịch</SelectItem>
                <SelectItem value="completed">Hoàn thành</SelectItem>
                <SelectItem value="cancelled">Đã hủy</SelectItem>
                <SelectItem value="no_show">Không đến</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm lg:text-base">Nhắc nhở (phút trước)</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
              {[5, 15, 30, 60].map((minutes) => (
                <label key={minutes} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.reminderMinutes?.includes(minutes) || false}
                    onChange={(e) => {
                      const currentReminders = formData.reminderMinutes || [];
                      if (e.target.checked) {
                        handleInputChange("reminderMinutes", [...currentReminders, minutes] as number[]);
                      } else {
                        handleInputChange("reminderMinutes", currentReminders.filter(m => m !== minutes) as number[]);
                      }
                    }}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">{minutes} phút</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-2 lg:gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="text-sm lg:text-base">
              Hủy
            </Button>
            <Button type="submit" disabled={updateMutation.isPending} className="text-sm lg:text-base">
              {updateMutation.isPending ? "Đang cập nhật..." : "Cập nhật lịch hẹn"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}