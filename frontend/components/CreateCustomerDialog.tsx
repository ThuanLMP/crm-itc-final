import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { useBackend, useAuth } from "../contexts/AuthContext";
import type { CreateCustomerRequest } from "~backend/customers/types";

interface CreateCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateCustomerDialog({ open, onOpenChange, onSuccess }: CreateCustomerDialogProps) {
  const [formData, setFormData] = useState<CreateCustomerRequest>({
    name: "",
    phone: "",
    email: "",
    address: "",
    companyName: "",
    customerTypeId: "",
    businessTypeId: "",
    companySizeId: "",
    provinceId: "",
    leadSourceId: "",
    assignedSalespersonId: "",
    stageId: "",
    temperatureId: "",
    contactStatusId: "",
    customerFeedback: "",
    notes: "",
    productIds: [],
  });

  const backend = useBackend();
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: masterData, refetch: refetchMasterData } = useQuery({
    queryKey: ["masterdata"],
    queryFn: () => backend.masterdata.getAll(),
    staleTime: 0, // Always consider data stale
  });

  // Get list of employees for assignment (admin only)
  const { data: employeesData } = useQuery({
    queryKey: ["employees-for-assignment"],
    queryFn: () => backend.employees.list(),
    enabled: user?.role === "admin",
    staleTime: 0,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateCustomerRequest) => {
      // Clean up the data before sending to avoid UUID parsing errors
      const cleanData = {
        ...data,
        customerTypeId: data.customerTypeId || undefined,
        businessTypeId: data.businessTypeId || undefined,
        companySizeId: data.companySizeId || undefined,
        provinceId: data.provinceId || undefined,
        leadSourceId: data.leadSourceId || undefined,
        assignedSalespersonId: data.assignedSalespersonId || undefined,
        stageId: data.stageId || undefined,
        temperatureId: data.temperatureId || undefined,
        contactStatusId: data.contactStatusId || undefined,
        phone: data.phone || undefined,
        email: data.email || undefined,
        address: data.address || undefined,
        companyName: data.companyName || undefined,

        customerFeedback: data.customerFeedback || undefined,
        notes: data.notes || undefined,
      };
      return backend.customers.create(cleanData);
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Tạo khách hàng thành công",
      });
      onSuccess();
      setFormData({
        name: "",
        phone: "",
        email: "",
        address: "",
        companyName: "",
        customerTypeId: "",
        businessTypeId: "",
        companySizeId: "",
        provinceId: "",
        leadSourceId: "",
        assignedSalespersonId: "",
        stageId: "",
        temperatureId: "",
        contactStatusId: "",
        customerFeedback: "",
        notes: "",
        productIds: [],
      });
    },
    onError: (error: any) => {
      console.error("Failed to create customer:", error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tạo khách hàng",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({
        title: "Lỗi",
        description: "Tên khách hàng là bắt buộc",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof CreateCustomerRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSelectChange = (field: keyof CreateCustomerRequest, value: string) => {
    // Handle "all" or empty values by setting to empty string
    const cleanValue = value === "all" || !value ? "" : value;
    setFormData(prev => ({ ...prev, [field]: cleanValue }));
  };

  const handleProductChange = (productId: string, checked: boolean) => {
    setFormData(prev => {
      const newProductIds = checked
        ? [...prev.productIds, productId]
        : prev.productIds.filter(id => id !== productId);
      return { ...prev, productIds: newProductIds };
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-[95vw] lg:min-w-3xl max-h-[85vh] lg:max-h-[80vh] overflow-y-auto p-4 lg:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg lg:text-xl">Tạo khách hàng mới</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 lg:space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
            <div>
              <Label htmlFor="name" className="text-sm lg:text-base">Tên khách hàng *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                required
                className="text-sm lg:text-base"
              />
            </div>
            <div>
              <Label htmlFor="companyName" className="text-sm lg:text-base">Tên công ty</Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => handleInputChange("companyName", e.target.value)}
                className="text-sm lg:text-base"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
            <div>
              <Label htmlFor="phone" className="text-sm lg:text-base">Điện thoại</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                className="text-sm lg:text-base"
              />
            </div>
            <div>
              <Label htmlFor="email" className="text-sm lg:text-base">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="text-sm lg:text-base"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="address" className="text-sm lg:text-base">Địa chỉ</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              className="text-sm lg:text-base"
            />
          </div>

          <div>
            <Label className="text-sm lg:text-base">Tỉnh/Thành phố</Label>
            <Select value={formData.provinceId} onValueChange={(value) => handleSelectChange("provinceId", value)}>
              <SelectTrigger className="w-full text-sm lg:text-base">
                <SelectValue placeholder="Chọn tỉnh/thành phố" />
              </SelectTrigger>
              <SelectContent>
                {masterData?.provinces?.map((province: any) => (
                  <SelectItem key={province.id} value={province.id}>
                    {province.name}
                  </SelectItem>
                )) || []}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
            <div>
              <Label className="text-sm lg:text-base">Loại khách hàng</Label>
              <Select value={formData.customerTypeId} onValueChange={(value) => handleSelectChange("customerTypeId", value)}>
                <SelectTrigger className="w-full text-sm lg:text-base">
                  <SelectValue placeholder="Chọn loại khách hàng" />
                </SelectTrigger>
                <SelectContent>
                  {masterData?.customerTypes?.filter((ct: any) => ct.active).map((type: any) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  )) || []}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm lg:text-base">Loại doanh nghiệp</Label>
              <Select value={formData.businessTypeId} onValueChange={(value) => handleSelectChange("businessTypeId", value)}>
                <SelectTrigger className="w-full text-sm lg:text-base">
                  <SelectValue placeholder="Chọn loại doanh nghiệp" />
                </SelectTrigger>
                <SelectContent>
                  {masterData?.businessTypes?.filter((bt: any) => bt.active).map((type: any) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  )) || []}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
            <div>
              <Label className="text-sm lg:text-base">Giai đoạn</Label>
              <Select value={formData.stageId} onValueChange={(value) => handleSelectChange("stageId", value)}>
                <SelectTrigger className="w-full text-sm lg:text-base">
                  <SelectValue placeholder="Chọn giai đoạn" />
                </SelectTrigger>
                <SelectContent>
                  {masterData?.stages?.filter((s: any) => s.active).map((stage: any) => (
                    <SelectItem key={stage.id} value={stage.id}>
                      {stage.name}
                    </SelectItem>
                  )) || []}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm lg:text-base">Mức độ</Label>
              <Select value={formData.temperatureId} onValueChange={(value) => handleSelectChange("temperatureId", value)}>
                <SelectTrigger className="w-full text-sm lg:text-base">
                  <SelectValue placeholder="Chọn mức độ" />
                </SelectTrigger>
                <SelectContent>
                  {masterData?.temperatures?.filter((t: any) => t.active).map((temp: any) => (
                    <SelectItem key={temp.id} value={temp.id}>
                      {temp.name}
                    </SelectItem>
                  )) || []}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Assign Employee - Only visible to admins */}
          {user?.role === "admin" && (
            <div>
              <Label className="text-sm lg:text-base">Phân công cho nhân viên</Label>
              <Select value={formData.assignedSalespersonId} onValueChange={(value) => handleSelectChange("assignedSalespersonId", value)}>
                <SelectTrigger className="w-full text-sm lg:text-base">
                  <SelectValue placeholder="Chọn nhân viên (mặc định là bạn)" />
                </SelectTrigger>
                <SelectContent>
                  {employeesData?.employees?.filter((emp: any) => emp.active).map((employee: any) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name} ({employee.email})
                    </SelectItem>
                  )) || []}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label className="text-sm lg:text-base">Sản phẩm quan tâm</Label>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-lg border p-3 lg:p-4 max-h-32 lg:max-h-40 overflow-y-auto">
              {masterData?.products?.filter((p: any) => p.active).map((product: any) => (
                <div key={product.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`product-${product.id}`}
                    checked={formData.productIds.includes(product.id)}
                    onCheckedChange={(checked) => handleProductChange(product.id, !!checked)}
                  />
                  <label
                    htmlFor={`product-${product.id}`}
                    className="text-xs lg:text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {product.name}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="notes" className="text-sm lg:text-base">Ghi chú</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              rows={3}
              className="text-sm lg:text-base"
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-2 lg:gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="text-sm lg:text-base">
              Hủy
            </Button>
            <Button type="submit" disabled={createMutation.isPending} className="text-sm lg:text-base">
              {createMutation.isPending ? "Đang tạo..." : "Tạo khách hàng"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
