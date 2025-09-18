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
import type { CreateContactRequest } from "~backend/contacts/types";

interface CreateContactDialogProps {
  customerId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateContactDialog({ customerId, open, onOpenChange }: CreateContactDialogProps) {
  const [formData, setFormData] = useState<CreateContactRequest>({
    customerId,
    type: "call",
    subject: "",
    notes: "",
    outcome: "",
    nextStep: "",
    duration: undefined,
  });

  const backend = useBackend();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: CreateContactRequest) => backend.contacts.create(data),
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã tạo liên hệ mới",
      });
      queryClient.invalidateQueries({ queryKey: ["contacts", customerId] });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      console.error("Failed to create contact:", error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tạo liên hệ",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      customerId,
      type: "call",
      subject: "",
      notes: "",
      outcome: "",
      nextStep: "",
      duration: undefined,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject.trim() || !formData.notes.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập chủ đề và ghi chú",
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
          <DialogTitle>Tạo liên hệ mới</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="type">Loại liên hệ</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="call">Cuộc gọi</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="meeting">Cuộc họp</SelectItem>
                <SelectItem value="zalo">Zalo</SelectItem>
                <SelectItem value="other">Khác</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="subject">Chủ đề *</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="Nhập chủ đề liên hệ"
              required
            />
          </div>

          <div>
            <Label htmlFor="notes">Ghi chú *</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Nhập nội dung chi tiết"
              rows={3}
              required
            />
          </div>

          <div>
            <Label htmlFor="duration">Thời gian (phút)</Label>
            <Input
              id="duration"
              type="number"
              value={formData.duration || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value ? parseInt(e.target.value) : undefined }))}
              placeholder="Thời gian liên hệ"
              min="1"
            />
          </div>

          <div>
            <Label htmlFor="outcome">Kết quả</Label>
            <Textarea
              id="outcome"
              value={formData.outcome}
              onChange={(e) => setFormData(prev => ({ ...prev, outcome: e.target.value }))}
              placeholder="Kết quả của cuộc liên hệ"
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="nextStep">Bước tiếp theo</Label>
            <Textarea
              id="nextStep"
              value={formData.nextStep}
              onChange={(e) => setFormData(prev => ({ ...prev, nextStep: e.target.value }))}
              placeholder="Các bước cần thực hiện tiếp theo"
              rows={2}
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
              {createMutation.isPending ? "Đang tạo..." : "Tạo liên hệ"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}