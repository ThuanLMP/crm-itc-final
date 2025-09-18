import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Users, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export function Login() {
  const [email, setEmail] = useState("admin@crm.com");
  const [password, setPassword] = useState("admin123");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user, login } = useAuth();
  const { toast } = useToast();

  if (user) {
    return <Navigate to="/customers" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      toast({
        title: "Đăng nhập thành công",
        description: "Chào mừng bạn đến với hệ thống CRM",
      });
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Đăng nhập thất bại",
        description: "Vui lòng kiểm tra lại email và mật khẩu",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mb-4">
            <Users className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-800">Đăng nhập CRM</CardTitle>
          <CardDescription className="text-slate-600">
            Nhập thông tin đăng nhập để truy cập hệ thống
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@crm.com"
                required
                className="h-12 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700 font-medium">Mật khẩu</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  required
                  className="h-12 pr-12 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-slate-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-slate-500" />
                  )}
                </Button>
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200" 
              disabled={isLoading}
            >
              {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
            </Button>
          </form>
          <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h4 className="text-sm font-medium text-slate-700 mb-3">Tài khoản demo:</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center p-2 bg-white rounded border">
                <span className="text-slate-600">Quản trị viên:</span>
                <span className="font-mono text-blue-600">admin@crm.com / admin123</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-white rounded border">
                <span className="text-slate-600">Nhân viên:</span>
                <span className="font-mono text-green-600">employee@crm.com / employee123</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-3">
              📝 Tài khoản admin đã được điền sẵn, nhấn "Đăng nhập" để vào hệ thống
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
