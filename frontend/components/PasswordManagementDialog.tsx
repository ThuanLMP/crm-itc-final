import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useBackend } from "../contexts/AuthContext";

interface PasswordManagementDialogProps {
  userId: string;
  userName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function PasswordManagementDialog({ 
  userId, 
  userName, 
  open, 
  onOpenChange, 
  onSuccess 
}: PasswordManagementDialogProps) {
  const [newPassword, setNewPassword] = useState("");
  const [action, setAction] = useState<"change" | "reset">("change");

  const backend = useBackend();
  const { toast } = useToast();

  const changePasswordMutation = useMutation({
    mutationFn: (password: string) => backend.auth.changePassword({ userId, newPassword: password }),
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đổi mật khẩu thành công",
      });
      onSuccess();
      setNewPassword("");
    },
    onError: (error: any) => {
      console.error("Failed to change password:", error);
      toast({
        title: "Lỗi",
        description: error.message || "Lỗi khi đổi mật khẩu",
        variant: "destructive",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: () => backend.auth.resetPassword({ userId }),
    onSuccess: (data) => {
      toast({
        title: "Thành công",
        description: `Đặt lại mật khẩu thành công, mật khẩu: ${data.newPassword}`,
        duration: 10000, // Show for 10 seconds
      });
      onSuccess();
    },
    onError: (error: any) => {
      console.error("Failed to reset password:", error);
      toast({
        title: "Lỗi",
        description: error.message || "Lỗi đặt lại mật khẩu",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (action === "change") {
      if (!newPassword || newPassword.length < 6) {
        toast({
          title: "Error",
          description: "Mật khẩu cần ít nhất 6 ký tự",
          variant: "destructive",
        });
        return;
      }
      changePasswordMutation.mutate(newPassword);
    } else {
      resetPasswordMutation.mutate();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Quản lý mật khẩu - {userName}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2 p-2 bg-slate-50 rounded-lg">
            <Button
              type="button"
              variant={action === "change" ? "default" : "outline"}
              size="sm"
              onClick={() => setAction("change")}
            >
              Đổi mật khẩu
            </Button>
            <Button
              type="button"
              variant={action === "reset" ? "default" : "outline"}
              size="sm"
              onClick={() => setAction("reset")}
            >
             Đặt lại mật khẩu
            </Button>
          </div>

          {action === "change" && (
            <div>
              <Label htmlFor="newPassword">Đổi mật khẩu *</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
                required
                className="mt-1"
              />
            </div>
          )}

          {action === "reset" && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
								Điều này sẽ đặt lại thành mật khẩu an toàn ngẫu nhiên. Mật khẩu mới sẽ chỉ xuất hiện 1 lần.
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button 
              type="submit" 
              disabled={changePasswordMutation.isPending || resetPasswordMutation.isPending}
              className="btn-gradient"
            >
              {changePasswordMutation.isPending || resetPasswordMutation.isPending 
                ? "Đang xử lý..." 
                : action === "change" ? "Đổi mật khẩu" : "Đặt lại mật khẩu"
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}