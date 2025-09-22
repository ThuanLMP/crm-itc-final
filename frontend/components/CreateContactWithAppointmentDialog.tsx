import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import backend from "~backend/client";
import type { CreateContactRequest } from "~backend/contacts/types";
import type { CreateAppointmentRequest } from "~backend/appointments/types";

interface Props {
  customerId: string;
  customerName: string;
  open?: boolean;
  onSuccess?: () => void;
  onClose?: () => void;
}

export default function CreateContactWithAppointmentDialog({ 
  customerId, 
  customerName, 
  open = true,
  onSuccess, 
  onClose 
}: Props) {
  const [loading, setLoading] = useState(false);
  const [createAppointment, setCreateAppointment] = useState(false);
  const { toast } = useToast();

  const [contactData, setContactData] = useState({
    type: "",
    notes: ""
  });

  const [appointmentData, setAppointmentData] = useState({
    title: "",
    description: "",
    scheduledAt: "",
    duration: 60,
    reminderMinutes: [15, 60] // 15 phút và 1 tiếng trước
  });

  const contactTypes = [
    "Call",
    "Email", 
    "Meeting",
    "Zalo",
    "Facebook",
    "Website",
    "Other"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactData.type || !contactData.notes) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin bắt buộc",
        variant: "destructive"
      });
      return;
    }

    if (createAppointment && (!appointmentData.title || !appointmentData.scheduledAt)) {
      toast({
        title: "Lỗi", 
        description: "Vui lòng điền đầy đủ thông tin lịch hẹn",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Tạo liên hệ
      const contactRequest: CreateContactRequest = {
        customerId,
        type: contactData.type,
        subject: `Liên hệ ${contactData.type}`,
        notes: contactData.notes
      };

      await backend.contacts.create(contactRequest);

      // Tạo lịch hẹn nếu được chọn
      if (createAppointment) {
        const appointmentRequest: CreateAppointmentRequest = {
          customerId,
          title: appointmentData.title,
          description: appointmentData.description || undefined,
          scheduledAt: new Date(appointmentData.scheduledAt),
          duration: appointmentData.duration,
          reminderMinutes: appointmentData.reminderMinutes
        };

        await backend.appointments.create(appointmentRequest);
      }

      toast({
        title: "Thành công",
        description: createAppointment 
          ? "Đã tạo liên hệ và lịch hẹn thành công" 
          : "Đã tạo liên hệ thành công"
      });

      // Reset form
      setContactData({
        type: "",
        notes: ""
      });
      setAppointmentData({
        title: "",
        description: "",
        scheduledAt: "",
        duration: 60,
        reminderMinutes: [15, 60]
      });
      setCreateAppointment(false);
      
      onSuccess?.();
      onClose?.();
    } catch (error) {
      console.error("Error creating contact:", error);
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi tạo liên hệ",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose?.()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo liên hệ mới - {customerName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Loại liên hệ */}
          <div className="space-y-2">
            <Label htmlFor="type">Loại liên hệ *</Label>
            <Select 
              value={contactData.type} 
              onValueChange={(value) => setContactData({...contactData, type: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn loại liên hệ" />
              </SelectTrigger>
              <SelectContent>
                {contactTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Nội dung */}
          <div className="space-y-2">
            <Label htmlFor="notes">Nội dung *</Label>
            <Textarea
              id="notes"
              value={contactData.notes}
              onChange={(e) => setContactData({...contactData, notes: e.target.value})}
              placeholder="Nội dung chi tiết về cuộc liên hệ"
              className="min-h-[100px]"
            />
          </div>

          {/* Checkbox tạo lịch hẹn */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="createAppointment"
              checked={createAppointment}
              onCheckedChange={(checked) => setCreateAppointment(checked as boolean)}
            />
            <Label htmlFor="createAppointment" className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              Tạo lịch hẹn cho khách hàng này
            </Label>
          </div>

          {/* Form lịch hẹn */}
          {createAppointment && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
              <h3 className="font-medium">Thông tin lịch hẹn</h3>
              
              <div className="space-y-2">
                <Label htmlFor="appointmentTitle">Tiêu đề lịch hẹn *</Label>
                <Input
                  id="appointmentTitle"
                  value={appointmentData.title}
                  onChange={(e) => setAppointmentData({...appointmentData, title: e.target.value})}
                  placeholder="Tên cuộc hẹn"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="appointmentDescription">Mô tả</Label>
                <Textarea
                  id="appointmentDescription"
                  value={appointmentData.description}
                  onChange={(e) => setAppointmentData({...appointmentData, description: e.target.value})}
                  placeholder="Mô tả chi tiết về cuộc hẹn"
                  className="min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="scheduledAt">Thời gian hẹn *</Label>
                <Input
                  id="scheduledAt"
                  type="datetime-local"
                  value={appointmentData.scheduledAt}
                  onChange={(e) => setAppointmentData({...appointmentData, scheduledAt: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="appointmentDuration">Thời gian dự kiến (phút)</Label>
                <Input
                  id="appointmentDuration"
                  type="number"
                  value={appointmentData.duration}
                  onChange={(e) => setAppointmentData({...appointmentData, duration: parseInt(e.target.value) || 60})}
                  min="15"
                  max="480"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Đang tạo..." : (createAppointment ? "Tạo liên hệ & lịch hẹn" : "Tạo liên hệ")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}