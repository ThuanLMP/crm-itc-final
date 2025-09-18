import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { useBackend } from "../contexts/AuthContext";
import type { Employee, UpdateEmployeeRequest } from "~backend/employees/types";

interface EditEmployeeDialogProps {
  employee: Employee;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditEmployeeDialog({ employee, open, onOpenChange, onSuccess }: EditEmployeeDialogProps) {
  const [formData, setFormData] = useState<UpdateEmployeeRequest>({
    id: employee.id,
    name: employee.name,
    email: employee.email,
    phone: employee.phone || "",
    active: employee.active,
  });

  const backend = useBackend();
  const { toast } = useToast();

  useEffect(() => {
    setFormData({
      id: employee.id,
      name: employee.name,
      email: employee.email,
      phone: employee.phone || "",
      active: employee.active,
    });
  }, [employee]);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateEmployeeRequest) => backend.employees.update(data),
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Sửa nhân viên thành công",
      });
      onSuccess();
    },
    onError: (error: any) => {
      console.error("Sửa nhân viên có lỗi xảy ra:", error);
      toast({
        title: "Error",
        description: error.message || "Sửa nhân viên có lỗi xảy ra",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      toast({
        title: "Lỗi",
        description: "Tên và email là bắt buộc",
        variant: "destructive",
      });
      return;
    }
    updateMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof UpdateEmployeeRequest, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Sửa nhân viên</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Tên *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="phone">SĐT</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="active"
              checked={formData.active}
              onCheckedChange={(checked) => handleInputChange("active", checked)}
            />
            <Label htmlFor="active">Hoạt động</Label>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Đang sửa..." : "Sửa nhân viên"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}