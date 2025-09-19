import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useBackend, useAuth } from "../contexts/AuthContext";
import type { CreateAppointmentRequest } from "~backend/appointments/types";

interface CreateAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateAppointmentDialog({ open, onOpenChange, onSuccess }: CreateAppointmentDialogProps) {
  const [formData, setFormData] = useState<Partial<CreateAppointmentRequest>>({
    title: "",
    customerId: "",
    description: "",
    scheduledAt: new Date(),
    duration: 60,
    assignedToId: "",
  });

  const backend = useBackend();
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: customersData } = useQuery({
    queryKey: ["customers-for-appointments"],
    queryFn: () => backend.customers.list({ limit: 1000 }), // Fetch all customers
    staleTime: Infinity,
  });

  const { data: employeesData } = useQuery({
    queryKey: ["employees-for-appointments"],
    queryFn: () => backend.employees.list(),
    enabled: user?.role === "admin",
    staleTime: Infinity,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateAppointmentRequest) => backend.appointments.create(data),
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Tạo lịch hẹn thành công",
      });
      onSuccess();
      setFormData({
        title: "",
        customerId: "",
        description: "",
        scheduledAt: new Date(),
        duration: 60,
        assignedToId: "",
      });
    },
    onError: (error: any) => {
      console.error("Failed to create appointment:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create appointment",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim() || !formData.customerId || !formData.scheduledAt || !formData.duration) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate(formData as CreateAppointmentRequest);
  };

  const handleInputChange = (field: keyof CreateAppointmentRequest, value: string | number | Date) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSelectChange = (field: keyof CreateAppointmentRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Tạo lịch hẹn</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Tiêu đề *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              required
            />
          </div>

          <div>
            <Label>Khách hàng *</Label>
            <Select value={formData.customerId} onValueChange={(value) => handleSelectChange("customerId", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn khách hàng" />
              </SelectTrigger>
              <SelectContent>
                {customersData?.customers?.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="scheduledAt">Lịch hẹn *</Label>
              <Input
                id="scheduledAt"
                type="datetime-local"
                value={formData.scheduledAt ? new Date(formData.scheduledAt.getTime() - formData.scheduledAt.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                onChange={(e) => handleInputChange("scheduledAt", new Date(e.target.value))}
                required
              />
            </div>
            <div>
              <Label htmlFor="duration">Thời gian (phút) *</Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration}
                onChange={(e) => handleInputChange("duration", parseInt(e.target.value))}
                required
              />
            </div>
          </div>

          {user?.role === "admin" && (
            <div>
              <Label>Người phụ trách</Label>
              <Select value={formData.assignedToId} onValueChange={(value) => handleSelectChange("assignedToId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn nhân viên (mặc định là bạn)" />
                </SelectTrigger>
                <SelectContent>
                  {employeesData?.employees?.filter(e => e.active).map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor="description">Mô tả</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Đang tạo..." : "Tạo lịch hẹn"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
