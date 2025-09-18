import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { useBackend } from "../contexts/AuthContext";
import type { MasterDataItem, UpdateMasterDataRequest } from "~backend/masterdata/list_items";

interface EditMasterDataDialogProps {
  table: string;
  tableLabel: string;
  item: MasterDataItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditMasterDataDialog({ 
  table, 
  tableLabel, 
  item, 
  open, 
  onOpenChange, 
  onSuccess 
}: EditMasterDataDialogProps) {
  const [formData, setFormData] = useState({
    name: item.name,
    active: item.active,
  });

  const backend = useBackend();
  const { toast } = useToast();

  useEffect(() => {
    setFormData({
      name: item.name,
      active: item.active,
    });
  }, [item]);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateMasterDataRequest) => backend.masterdata.updateItem(data),
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: `${tableLabel.slice(0, -1)} sửa thành công`,
      });
      onSuccess();
    },
    onError: (error: any) => {
      console.error("Có lỗi xảy ra:", error);
      toast({
        title: "Lỗi",
        description: error.message || "Lỗi không thể sửa",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({
        title: "Lỗi",
        description: "Tên là bắt buộc",
        variant: "destructive",
      });
      return;
    }
    updateMutation.mutate({ 
      table, 
      id: item.id, 
      name: formData.name.trim(), 
      active: formData.active 
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Sửa {tableLabel}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Tên *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder={`Enter ${tableLabel.slice(0, -1).toLowerCase()} name`}
              required
              className="mt-1"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div>
              <Label htmlFor="active" className="font-medium">Trạng thái hoạt động</Label>
              <p className="text-sm text-slate-600 mt-1">
                {formData.active 
                  ? "Có sẵn để chọn trong form khách hàng" 
                  : "Ẳn khỏi lựa chọn trong form khách hàng, những vẫn còn ở màn quản lý"
                }
              </p>
            </div>
            <Switch
              id="active"
              checked={formData.active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button 
              type="submit" 
              disabled={updateMutation.isPending}
              className="btn-gradient"
            >
              {updateMutation.isPending ? "Đang sửa..." : "Sửa"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}