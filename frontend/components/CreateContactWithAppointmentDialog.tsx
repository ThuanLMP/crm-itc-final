import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Calendar } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import backend from "~backend/client";
import type { CreateContactRequest } from "~backend/contacts/types";
import type { CreateAppointmentRequest } from "~backend/appointments/types";

interface Props {
  customerId: string;
  customerName: string;
  onSuccess?: () => void;
}

export default function CreateContactWithAppointmentDialog({ customerId, customerName, onSuccess }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [createAppointment, setCreateAppointment] = useState(false);
  const { toast } = useToast();

  const [contactData, setContactData] = useState({
    type: "",
    subject: "",
    notes: "",
    outcome: "",
    nextStep: "",
    duration: 30
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
        subject: contactData.subject || `Liên hệ ${contactData.type}`,
        notes: contactData.notes,
        outcome: contactData.outcome || undefined,
        nextStep: contactData.nextStep || undefined,
        duration: contactData.duration
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

      setOpen(false);
      setContactData({
        type: "",
        subject: "",
        notes: "",
        outcome: "",
        nextStep: "",
        duration: 30
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Tạo liên hệ
        </Button>
      </DialogTrigger>
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

          {/* Tiêu đề */}
          <div className="space-y-2">
            <Label htmlFor="subject">Tiêu đề</Label>
            <Input
              id="subject"
              value={contactData.subject}
              onChange={(e) => setContactData({...contactData, subject: e.target.value})}
              placeholder="Tiêu đề liên hệ (tùy chọn)"
            />
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

          {/* Kết quả */}
          <div className="space-y-2">
            <Label htmlFor="outcome">Kết quả</Label>
            <Input
              id="outcome"
              value={contactData.outcome}
              onChange={(e) => setContactData({...contactData, outcome: e.target.value})}
              placeholder="Kết quả của cuộc liên hệ (tùy chọn)"
            />
          </div>

          {/* Bước tiếp theo */}
          <div className="space-y-2">
            <Label htmlFor="nextStep">Bước tiếp theo</Label>
            <Input
              id="nextStep"
              value={contactData.nextStep}
              onChange={(e) => setContactData({...contactData, nextStep: e.target.value})}
              placeholder="Hành động tiếp theo cần thực hiện (tùy chọn)"
            />
          </div>

          {/* Thời gian liên hệ */}
          <div className="space-y-2">
            <Label htmlFor="duration">Thời gian liên hệ (phút)</Label>
            <Input
              id="duration"
              type="number"
              value={contactData.duration}
              onChange={(e) => setContactData({...contactData, duration: parseInt(e.target.value) || 30})}
              min="1"
              max="480"
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
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
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