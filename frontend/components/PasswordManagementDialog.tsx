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
        title: "Success",
        description: "Password changed successfully",
      });
      onSuccess();
      setNewPassword("");
    },
    onError: (error: any) => {
      console.error("Failed to change password:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to change password",
        variant: "destructive",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: () => backend.auth.resetPassword({ userId }),
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: `Password reset successfully. New password: ${data.newPassword}`,
        duration: 10000, // Show for 10 seconds
      });
      onSuccess();
    },
    onError: (error: any) => {
      console.error("Failed to reset password:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to reset password",
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
          description: "Password must be at least 6 characters long",
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
          <DialogTitle>Manage Password - {userName}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2 p-2 bg-slate-50 rounded-lg">
            <Button
              type="button"
              variant={action === "change" ? "default" : "outline"}
              size="sm"
              onClick={() => setAction("change")}
            >
              Change Password
            </Button>
            <Button
              type="button"
              variant={action === "reset" ? "default" : "outline"}
              size="sm"
              onClick={() => setAction("reset")}
            >
              Reset to Default
            </Button>
          </div>

          {action === "change" && (
            <div>
              <Label htmlFor="newPassword">New Password *</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 6 chars)"
                required
                className="mt-1"
              />
            </div>
          )}

          {action === "reset" && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                This will reset the password to a randomly generated secure password. The new password will be displayed once.
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={changePasswordMutation.isPending || resetPasswordMutation.isPending}
              className="btn-gradient"
            >
              {changePasswordMutation.isPending || resetPasswordMutation.isPending 
                ? "Processing..." 
                : action === "change" ? "Change Password" : "Reset Password"
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}