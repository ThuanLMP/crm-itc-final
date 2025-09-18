import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Users, BarChart3, LogOut, Settings, Database, Calendar, MessageSquare } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: "Bảng điều khiển", href: "/dashboard", icon: BarChart3 },
    { name: "Khách hàng", href: "/customers", icon: Users },
    { name: "Lịch hẹn", href: "/appointments", icon: Calendar },
    ...(user?.role === "admin" ? [
      { name: "Nhân viên", href: "/employees", icon: Settings },
      { name: "Dữ liệu gốc", href: "/master-data", icon: Database }
    ] : []),
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="hidden md:flex md:w-64 md:flex-col">
          <div className="flex flex-col flex-grow pt-5 bg-white/80 backdrop-blur-sm border-r border-slate-200 shadow-sm overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-6">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg mr-3">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">Hệ thống CRM</h1>
            </div>
            <div className="mt-8 flex-1 flex flex-col">
              <nav className="flex-1 px-4 space-y-2">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                        isActive
                          ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25"
                          : "text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm"
                      }`}
                    >
                      <Icon className={`mr-3 h-5 w-5 ${
                        isActive ? "text-white" : "text-slate-500 group-hover:text-slate-700"
                      }`} />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-slate-200 p-4 bg-slate-50/50">
              <div className="flex items-center w-full">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800">{user?.name}</p>
                  <p className="text-xs text-slate-500 capitalize">{user?.role === 'admin' ? 'Quản trị viên' : 'Nhân viên'}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="ml-2 hover:bg-red-50 hover:text-red-600"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-col w-0 flex-1 overflow-hidden">
          <main className="flex-1 relative overflow-y-auto focus:outline-none">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
