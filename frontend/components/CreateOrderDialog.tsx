import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useBackend } from "../contexts/AuthContext";
import type { CreateOrderRequest, CreateOrderItemRequest } from "~backend/orders/types";

interface CreateOrderDialogProps {
  customerId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateOrderDialog({ customerId, open, onOpenChange }: CreateOrderDialogProps) {
  const [formData, setFormData] = useState<CreateOrderRequest>({
    customerId,
    totalAmount: 0,
    currency: "VND", // Fixed to VND
    status: "pending",
    orderDate: new Date(),
    licenseType: "subscription",
    notes: "",
    items: [],
  });

  const [newItem, setNewItem] = useState<CreateOrderItemRequest>({
    productId: "",
    productName: "",
    quantity: 1,
    unitPrice: 0,
    notes: "",
  });

  const backend = useBackend();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: masterData } = useQuery({
    queryKey: ["masterdata"],
    queryFn: () => backend.masterdata.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateOrderRequest) => backend.orders.create(data),
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã tạo đơn hàng mới",
      });
      queryClient.invalidateQueries({ queryKey: ["orders", customerId] });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      console.error("Failed to create order:", error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tạo đơn hàng",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      customerId,
      totalAmount: 0,
      currency: "VND",
      status: "pending",
      orderDate: new Date(),
      licenseType: "subscription",
      notes: "",
      items: [],
    });
    setNewItem({
      productId: "",
      productName: "",
      quantity: 1,
      unitPrice: 0,
      notes: "",
    });
  };

  const addItem = () => {
    if (!newItem.productId || !newItem.productName?.trim() || (newItem.unitPrice || 0) <= 0) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn sản phẩm và nhập giá hợp lệ",
        variant: "destructive",
      });
      return;
    }

    const item = {
      productId: newItem.productId || undefined,
      productName: newItem.productName || '',
      quantity: newItem.quantity || 1,
      unitPrice: newItem.unitPrice || 0,
      notes: newItem.notes || undefined,
    };

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, item]
    }));

    setNewItem({
      productId: "",
      productName: "",
      quantity: 1,
      unitPrice: 0,
      notes: "",
    });
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + ((item.quantity || 0) * (item.unitPrice || 0)), 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.items.length === 0) {
      toast({
        title: "Lỗi",
        description: "Vui lòng thêm ít nhất một sản phẩm",
        variant: "destructive",
      });
      return;
    }

    const totalAmount = calculateTotal();
    if (isNaN(totalAmount) || totalAmount <= 0) {
      toast({
        title: "Lỗi",
        description: "Tổng số tiền không hợp lệ",
        variant: "destructive",
      });
      return;
    }

    const orderData = {
      ...formData,
      totalAmount,
    };
    
    createMutation.mutate(orderData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo đơn hàng mới</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">Trạng thái</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Chờ xử lý</SelectItem>
                  <SelectItem value="confirmed">Đã xác nhận</SelectItem>
                  <SelectItem value="processing">Đang xử lý</SelectItem>
                  <SelectItem value="active">Đang hoạt động</SelectItem>
                  <SelectItem value="completed">Hoàn thành</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="licenseType">Loại license</Label>
              <Select
                value={formData.licenseType}
                onValueChange={(value) => setFormData(prev => ({ ...prev, licenseType: value as any }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trial">Dùng thử</SelectItem>
                  <SelectItem value="subscription">Đăng ký</SelectItem>
                  <SelectItem value="perpetual">Vĩnh viễn</SelectItem>
                  <SelectItem value="enterprise">Doanh nghiệp</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="activationDate">Ngày kích hoạt</Label>
              <Input
                id="activationDate"
                type="date"
                value={formData.activationDate ? formData.activationDate.toISOString().split('T')[0] : ''}
                onChange={(e) => setFormData(prev => ({ ...prev, activationDate: e.target.value ? new Date(e.target.value) : undefined }))}
              />
            </div>
            <div>
              <Label htmlFor="expiryDate">Ngày hết hạn</Label>
              <Input
                id="expiryDate"
                type="date"
                value={formData.expiryDate ? formData.expiryDate.toISOString().split('T')[0] : ''}
                onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value ? new Date(e.target.value) : undefined }))}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Ghi chú</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Ghi chú cho đơn hàng phần mềm"
              rows={2}
            />
          </div>

          {/* Add Item Section */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Thêm sản phẩm</h4>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <Label>Sản phẩm</Label>
                <Select
                  value={newItem.productId}
                  onValueChange={(value) => {
                    const selectedProduct = masterData?.products?.find((p: any) => p.id === value);
                    setNewItem(prev => ({
                      ...prev,
                      productId: value,
                      productName: selectedProduct ? selectedProduct.name : ""
                    }));
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Chọn sản phẩm" />
                  </SelectTrigger>
                  <SelectContent>
                    {masterData?.products?.filter((p: any) => p.active).map((product: any) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    )) || []}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Số lượng</Label>
                <Input
                  type="number"
                  placeholder="1"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                  min="1"
                />
              </div>
              <div>
                <Label>Đơn giá (VND)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={newItem.unitPrice}
                  onChange={(e) => setNewItem(prev => ({ ...prev, unitPrice: parseFloat(e.target.value) || 0 }))}
                  min="0"
                />
              </div>
            </div>
            <Button type="button" onClick={addItem} size="sm" className="w-full">
              Thêm sản phẩm
            </Button>
          </div>

          {/* Items List */}
          {formData.items.length > 0 && (
            <div>
              <h4 className="font-medium mb-3">Danh sách sản phẩm</h4>
              <div className="space-y-2">
                {formData.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex-1">
                      <div className="font-medium">{item.productName}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.quantity || 0} x {(item.unitPrice || 0).toLocaleString()} VND = {((item.quantity || 0) * (item.unitPrice || 0)).toLocaleString()} VND
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeItem(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="mt-3 p-3 bg-muted rounded">
                <div className="font-medium text-right">
                  Tổng cộng: {calculateTotal().toLocaleString()} VND
                </div>
              </div>
            </div>
          )}

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
              {createMutation.isPending ? "Đang tạo..." : "Tạo đơn hàng"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}