import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useBackend } from "../contexts/AuthContext";
import type { CreateEmployeeRequest } from "~backend/employees/types";

interface CreateEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateEmployeeDialog({ open, onOpenChange, onSuccess }: CreateEmployeeDialogProps) {
  const [formData, setFormData] = useState<CreateEmployeeRequest>({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  const backend = useBackend();
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: (data: CreateEmployeeRequest) => backend.employees.create(data),
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Tạo nhân viên thành công",
      });
      onSuccess();
      setFormData({
        name: "",
        email: "",
        phone: "",
        password: "",
      });
    },
    onError: (error: any) => {
      console.error("Failed to create employee:", error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tạo nhân viên",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
      toast({
        title: "Lỗi",
        description: "Tên, email và mật khẩu là bắt buộc",
        variant: "destructive",
      });
      return;
    }
    if (formData.password.length < 6) {
      toast({
        title: "Lỗi",
        description: "Mật khẩu phải có ít nhất 6 ký tự",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof CreateEmployeeRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Tạo nhân viên mới</DialogTitle>
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
            <Label htmlFor="phone">Số điện thoại</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="password">Mật khẩu *</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              placeholder="Tối thiểu 6 ký tự"
              required
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
Hủy
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Đang tạo..." : "Tạo nhân viên"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}