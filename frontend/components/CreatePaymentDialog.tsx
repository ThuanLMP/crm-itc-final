import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useBackend } from "../contexts/AuthContext";
import type { CreatePaymentRequest } from "~backend/payments/types";

interface CreatePaymentDialogProps {
  customerId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreatePaymentDialog({ customerId, open, onOpenChange }: CreatePaymentDialogProps) {
  const [formData, setFormData] = useState<CreatePaymentRequest>({
    customerId,
    amount: 0,
    currency: "VND",
    paymentMethod: "cash",
    paymentDate: new Date(),
    status: "pending",
    referenceNumber: "",
    notes: "",
  });

  const backend = useBackend();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: CreatePaymentRequest) => backend.payments.create(data),
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã tạo thanh toán mới",
      });
      queryClient.invalidateQueries({ queryKey: ["payments", customerId] });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      console.error("Failed to create payment:", error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tạo thanh toán",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      customerId,
      amount: 0,
      currency: "VND",
      paymentMethod: "cash",
      paymentDate: new Date(),
      status: "pending",
      referenceNumber: "",
      notes: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.amount <= 0) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập số tiền hợp lệ",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tạo thanh toán mới</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount">Số tiền *</Label>
              <Input
                id="amount"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                placeholder="Nhập số tiền"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div>
              <Label htmlFor="currency">Tiền tệ</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VND">VND</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="paymentMethod">Phương thức thanh toán</Label>
            <Select
              value={formData.paymentMethod}
              onValueChange={(value: any) => setFormData(prev => ({ ...prev, paymentMethod: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Tiền mặt</SelectItem>
                <SelectItem value="bank_transfer">Chuyển khoản</SelectItem>
                <SelectItem value="credit_card">Thẻ tín dụng</SelectItem>
                <SelectItem value="check">Séc</SelectItem>
                <SelectItem value="other">Khác</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="status">Trạng thái</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Chờ xử lý</SelectItem>
                <SelectItem value="completed">Hoàn thành</SelectItem>
                <SelectItem value="failed">Thất bại</SelectItem>
                <SelectItem value="cancelled">Đã hủy</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="paymentDate">Ngày thanh toán</Label>
            <Input
              id="paymentDate"
              type="datetime-local"
              value={formData.paymentDate ? new Date(formData.paymentDate.getTime() - formData.paymentDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ""}
              onChange={(e) => setFormData(prev => ({ ...prev, paymentDate: new Date(e.target.value) }))}
            />
          </div>

          <div>
            <Label htmlFor="referenceNumber">Số tham chiếu</Label>
            <Input
              id="referenceNumber"
              value={formData.referenceNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, referenceNumber: e.target.value }))}
              placeholder="Số tham chiếu (tùy chọn)"
            />
          </div>

          <div>
            <Label htmlFor="notes">Ghi chú</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Ghi chú thanh toán"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createMutation.isPending}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Đang tạo..." : "Tạo thanh toán"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}