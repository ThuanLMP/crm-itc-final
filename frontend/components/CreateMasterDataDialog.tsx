import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useBackend } from "../contexts/AuthContext";
import type { CreateMasterDataRequest } from "~backend/masterdata/list_items";

interface CreateMasterDataDialogProps {
  table: string;
  tableLabel: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateMasterDataDialog({ 
  table, 
  tableLabel, 
  open, 
  onOpenChange, 
  onSuccess 
}: CreateMasterDataDialogProps) {
  const [name, setName] = useState("");

  const backend = useBackend();
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: (data: CreateMasterDataRequest) => backend.masterdata.createItem(data),
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: `${tableLabel} được tạo thành công`,
      });
      onSuccess();
      setName("");
    },
    onError: (error: any) => {
      console.error("Failed to create item:", error);
      toast({
        title: "Lỗi",
        description: error.message || "Lỗi khi tạo",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({
        title: "Lỗi",
        description: "Tên là bắt buộc",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate({ table, name: name.trim() });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Tạo mới {tableLabel}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Tên *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`Enter ${tableLabel.slice(0, -1).toLowerCase()} name`}
              required
              className="mt-1"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button 
              type="submit" 
              disabled={createMutation.isPending}
              className="btn-gradient"
            >
              {createMutation.isPending ? "Đang tạo..." : "Tạo"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}