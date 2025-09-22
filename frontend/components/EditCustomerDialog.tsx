import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { useBackend, useAuth } from "../contexts/AuthContext";
import type { Customer, UpdateCustomerRequest } from "~backend/customers/types";

interface EditCustomerDialogProps {
  customer: Customer;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditCustomerDialog({ customer, open, onOpenChange, onSuccess }: EditCustomerDialogProps) {
  const [formData, setFormData] = useState<UpdateCustomerRequest>({
    id: customer.id,
    name: customer.name,
    phone: customer.phone || "",
    email: customer.email || "",
    address: customer.address || "",
    companyName: customer.companyName || "",
    customerTypeId: customer.customerType?.id || "",
    businessTypeId: customer.businessType?.id || "",
    companySizeId: customer.companySize?.id || "",
    provinceId: customer.province?.id || "",
    leadSourceId: customer.leadSource?.id || "",
    assignedSalespersonId: customer.assignedSalesperson?.id || "",
    stageId: customer.stage?.id || "",
    temperatureId: customer.temperature?.id || "",
    contactStatusId: customer.contactStatus?.id || "",
    customerFeedback: customer.customerFeedback || "",
    notes: customer.notes || "",
    productIds: customer.products.map(p => p.id),
  });

  const backend = useBackend();
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: masterData } = useQuery({
    queryKey: ["masterdata"],
    queryFn: () => backend.masterdata.getAll(),
    staleTime: 0,
  });

  // Get list of employees for assignment (admin only)
  const { data: employeesData } = useQuery({
    queryKey: ["employees-for-assignment"],
    queryFn: () => backend.employees.list(),
    enabled: user?.role === "admin",
    staleTime: 0,
  });

  useEffect(() => {
    setFormData({
      id: customer.id,
      name: customer.name,
      phone: customer.phone || "",
      email: customer.email || "",
      address: customer.address || "",
      companyName: customer.companyName || "",
      customerTypeId: customer.customerType?.id || "",
      businessTypeId: customer.businessType?.id || "",
      companySizeId: customer.companySize?.id || "",
      provinceId: customer.province?.id || "",
      leadSourceId: customer.leadSource?.id || "",
      assignedSalespersonId: customer.assignedSalesperson?.id || "",
      stageId: customer.stage?.id || "",
      temperatureId: customer.temperature?.id || "",
      contactStatusId: customer.contactStatus?.id || "",
      customerFeedback: customer.customerFeedback || "",
      notes: customer.notes || "",
      productIds: customer.products.map(p => p.id),
    });
  }, [customer]);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateCustomerRequest) => {
      // Clean up the data before sending
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
      return backend.customers.update(cleanData);
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Sửa khách hàng thành công",
      });
      onSuccess();
    },
    onError: (error: any) => {
      console.error("Có lỗi xảy ra:", error);
      toast({
        title: "Error",
        description: error.message || "Có lỗi xảy ra",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Khách hàng là bắt buộc",
        variant: "destructive",
      });
      return;
    }
    updateMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof UpdateCustomerRequest, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSelectChange = (field: keyof UpdateCustomerRequest, value: string) => {
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
          <DialogTitle className="text-lg lg:text-xl">Sửa khách hàng</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 lg:space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
            <div>
              <Label htmlFor="name" className="text-sm lg:text-base">Tên *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                required
                className="text-sm lg:text-base"
              />
            </div>
            <div>
              <Label htmlFor="companyName" className="text-sm lg:text-base">Công ty</Label>
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
              <Label htmlFor="phone" className="text-sm lg:text-base">SĐT</Label>
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
            <Combobox
              value={formData.provinceId}
              onValueChange={(value) => handleSelectChange("provinceId", value)}
              options={masterData?.provinces?.map((province: any) => ({
                value: province.id,
                label: province.name,
              })) || []}
              placeholder="Tìm và chọn tỉnh/thành phố..."
              searchPlaceholder="Nhập tên tỉnh/thành phố..."
              emptyMessage="Không tìm thấy tỉnh/thành phố"
              className="w-full"
            />
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
              <Label className="text-sm lg:text-base">Loại hình kinh doanh</Label>
              <Select value={formData.businessTypeId} onValueChange={(value) => handleSelectChange("businessTypeId", value)}>
                <SelectTrigger className="w-full text-sm lg:text-base">
                  <SelectValue placeholder="Chọn loại hình" />
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
              <Label className="text-sm lg:text-base">Gán cho NV</Label>
              <Select value={formData.assignedSalespersonId} onValueChange={(value) => handleSelectChange("assignedSalespersonId", value)}>
                <SelectTrigger className="w-full text-sm lg:text-base">
                  <SelectValue placeholder="Chọn nhân viên" />
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

          {/* Show read-only assignment for employees */}
          {user?.role === "employee" && customer.assignedSalesperson && (
            <div>
              <Label className="text-sm lg:text-base">Gán cho NV</Label>
              <Input
                value={`${customer.assignedSalesperson.name}`}
                disabled
                className="bg-muted text-sm lg:text-base"
              />
            </div>
          )}

          <div>
            <Label className="text-sm lg:text-base">Sản phẩm</Label>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-lg border p-3 lg:p-4 max-h-32 lg:max-h-40 overflow-y-auto">
              {masterData?.products?.filter((p: any) => p.active).map((product: any) => (
                <div key={product.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`edit-product-${product.id}`}
                    checked={formData.productIds.includes(product.id)}
                    onCheckedChange={(checked) => handleProductChange(product.id, !!checked)}
                  />
                  <label
                    htmlFor={`edit-product-${product.id}`}
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
            <Button type="submit" disabled={updateMutation.isPending} className="text-sm lg:text-base">
              {updateMutation.isPending ? "Đang sửa..." : "Sửa khách hàng"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
