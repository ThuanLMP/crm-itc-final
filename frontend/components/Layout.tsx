import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Users, BarChart3, LogOut, Settings, Database, Calendar, Menu, X } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { name: "Bảng điều khiển", href: "/dashboard", icon: BarChart3 },
    { name: "Khách hàng", href: "/customers", icon: Users },
    { name: "Lịch hẹn", href: "/appointments", icon: Calendar },
    ...(user?.role === "admin" ? [
      { name: "Nhân viên", href: "/employees", icon: Settings },
      { name: "Dữ liệu gốc", href: "/master-data", icon: Database }
    ] : []),
  ];

  const NavItems = ({ mobile = false, onItemClick }: { mobile?: boolean; onItemClick?: () => void }) => (
    <>
      {navigation.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.href;
        return (
          <Link
            key={item.name}
            to={item.href}
            onClick={onItemClick}
            className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
              isActive
                ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25"
                : "text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm"
            } ${mobile ? "justify-center md:justify-start" : ""}`}
          >
            <Icon className={`${mobile ? "h-6 w-6" : "mr-3 h-5 w-5"} ${
              isActive ? "text-white" : "text-slate-500 group-hover:text-slate-700"
            }`} />
            {!mobile && <span className="ml-3">{item.name}</span>}
            {mobile && <span className="sr-only">{item.name}</span>}
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="flex h-screen">
        {/* Desktop Sidebar */}
        <div className="hidden lg:flex lg:w-64 lg:flex-col">
          <div className="flex flex-col flex-grow pt-5 bg-white/80 backdrop-blur-sm border-r border-slate-200 shadow-sm overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-6">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg mr-3">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">CRM</h1>
            </div>
            <div className="mt-8 flex-1 flex flex-col">
              <nav className="flex-1 px-4 space-y-2">
                <NavItems />
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

        {/* Mobile Header */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-sm border-b border-slate-200 shadow-sm">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center">
              <div className="p-1.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg mr-2">
                <Users className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">CRM</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="hover:bg-red-50 hover:text-red-600"
              >
                <LogOut className="h-4 w-4" />
              </Button>
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-64 p-0">
                  <div className="flex flex-col h-full pt-6 bg-white">
                    <div className="flex items-center justify-between px-6 pb-4 border-b">
                      <div className="flex items-center">
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg mr-3">
                          <Users className="h-5 w-5 text-white" />
                        </div>
                        <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">CRM</h1>
                      </div>
                    </div>
                    <div className="flex-1 px-4 py-4">
                      <nav className="space-y-2">
                        <NavItems onItemClick={() => setIsMobileMenuOpen(false)} />
                      </nav>
                    </div>
                    <div className="flex-shrink-0 border-t border-slate-200 p-4 bg-slate-50/50">
                      <div className="text-center">
                        <p className="text-sm font-medium text-slate-800">{user?.name}</p>
                        <p className="text-xs text-slate-500 capitalize">{user?.role === 'admin' ? 'Quản trị viên' : 'Nhân viên'}</p>
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-col w-full lg:w-0 lg:flex-1 overflow-hidden">
          <main className="flex-1 relative overflow-y-auto focus:outline-none pt-16 lg:pt-0 pb-16 lg:pb-0">
            {children}
          </main>
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-sm border-t border-slate-200 shadow-lg">
          <nav className="flex justify-around py-2">
            {navigation.slice(0, 4).map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex flex-col items-center px-2 py-2 text-xs font-medium transition-all duration-200 min-w-0 ${
                    isActive
                      ? "text-blue-600"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <Icon className={`h-5 w-5 mb-1 ${
                    isActive ? "text-blue-600" : "text-slate-500"
                  }`} />
                  <span className="truncate">{item.name.split(' ')[0]}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}
