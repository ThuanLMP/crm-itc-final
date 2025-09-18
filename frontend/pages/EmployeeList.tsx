import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Pencil, Trash2, Key } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useBackend, useAuth } from "../contexts/AuthContext";
import { CreateEmployeeDialog } from "../components/CreateEmployeeDialog";
import { EditEmployeeDialog } from "../components/EditEmployeeDialog";
import { PasswordManagementDialog } from "../components/PasswordManagementDialog";
import type { Employee } from "~backend/employees/types";

export function EmployeeList() {
  const [search, setSearch] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [passwordEmployee, setPasswordEmployee] = useState<Employee | null>(null);

  const backend = useBackend();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Only admins can access this page
  if (user?.role !== "admin") {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Truy cập bị từ chối</h1>
          <p className="text-muted-foreground mt-2">Bạn không có quyền xem trang này.</p>
        </div>
      </div>
    );
  }

  const { data: employeesData, isLoading, error, refetch } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      try {
        return await backend.employees.list();
      } catch (err) {
        console.error("Failed to fetch employees:", err);
        toast({
          title: "Lỗi",
          description: "Không thể tải danh sách nhân viên",
          variant: "destructive",
        });
        throw err;
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => backend.employees.deleteEmployee({ id }),
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Xóa nhân viên thành công",
      });
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
    onError: (error: any) => {
      console.error("Failed to delete employee:", error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa nhân viên",
        variant: "destructive",
      });
    },
  });

  const filteredEmployees = employeesData?.employees.filter(employee =>
    employee.name.toLowerCase().includes(search.toLowerCase()) ||
    employee.email.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const handleDelete = async (employee: Employee) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa ${employee.name}?`)) {
      deleteMutation.mutate(employee.id);
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-destructive">Không thể tải danh sách nhân viên</p>
          <Button onClick={() => refetch()} className="mt-2">
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Quản lý nhân viên</h1>
          <p className="text-muted-foreground">
            Tổng cộng {employeesData?.employees.length || 0} nhân viên
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Thêm nhân viên
        </Button>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="h-4 w-4 mr-2" />
            Tìm kiếm nhân viên
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm theo tên hoặc email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardContent>
      </Card>

      {/* Employee Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Điện thoại</TableHead>
                  <TableHead>Vai trò</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Tạo lúc</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="animate-pulse">Đang tải nhân viên...</div>
                    </TableCell>
                  </TableRow>
                ) : filteredEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
      Không tìm thấy nhân viên nào
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEmployees.map((employee: Employee) => (
                    <TableRow key={employee.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{employee.name}</TableCell>
                      <TableCell>{employee.email}</TableCell>
                      <TableCell>{employee.phone || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={employee.role === "admin" ? "default" : "secondary"}>
                          {employee.role === "admin" ? "Quản trị viên" : "Nhân viên"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={employee.active ? "default" : "destructive"}>
                          {employee.active ? "Hoạt động" : "Không hoạt động"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(employee.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPasswordEmployee(employee)}
                            className="h-8 px-2"
                          >
                            <Key className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingEmployee(employee)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {employee.role !== "admin" && employee.id !== user.id && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(employee)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <CreateEmployeeDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["employees"] });
          setShowCreateDialog(false);
        }}
      />

      {editingEmployee && (
        <EditEmployeeDialog
          employee={editingEmployee}
          open={!!editingEmployee}
          onOpenChange={(open) => !open && setEditingEmployee(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["employees"] });
            setEditingEmployee(null);
          }}
        />
      )}

      {passwordEmployee && (
        <PasswordManagementDialog
          userId={passwordEmployee.id}
          userName={passwordEmployee.name}
          open={!!passwordEmployee}
          onOpenChange={(open) => !open && setPasswordEmployee(null)}
          onSuccess={() => {
            setPasswordEmployee(null);
          }}
        />
      )}
    </div>
  );
}