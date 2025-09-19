import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Filter, ArrowUpDown, Eye, Pencil, Trash2, Calendar, Clock, CheckCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useBackend, useAuth } from "../contexts/AuthContext";
import { CreateCustomerDialog } from "../components/CreateCustomerDialog";
import { EditCustomerDialog } from "../components/EditCustomerDialog";
import { ExportDropdown } from "../components/ExportDropdown";
import type { Customer } from "~backend/customers/types";

export function CustomerList() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    stageId: "",
    temperatureId: "",
    assignedSalespersonId: "",
    provinceId: "",
    contactStatusId: "",
  });
  const [sortBy, setSortBy] = useState("created");
  const [sortOrder, setSortOrder] = useState("desc");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const backend = useBackend();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: customersData, isLoading, error, refetch } = useQuery({
    queryKey: ["customers", page, search, filters, sortBy, sortOrder],
    queryFn: async () => {
      try {
        return await backend.customers.list({
          page,
          limit: 20,
          search: search || undefined,
          stageId: filters.stageId || undefined,
          temperatureId: filters.temperatureId || undefined,
          assignedSalespersonId: filters.assignedSalespersonId || undefined,
          provinceId: filters.provinceId || undefined,
          contactStatusId: filters.contactStatusId || undefined,
          sortBy,
          sortOrder,
        });
      } catch (err) {
        console.error("Failed to fetch customers:", err);
        toast({
          title: "Lỗi",
          description: "Không thể tải danh sách khách hàng",
          variant: "destructive",
        });
        throw err;
      }
    },
  });

  const { data: masterData } = useQuery({
    queryKey: ["masterdata"],
    queryFn: () => backend.masterdata.getAll(),
    staleTime: 0, // Always fresh data
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => backend.customers.deleteCustomer({ id }),
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Xóa khách hàng thành công",
      });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (error: any) => {
      console.error("Failed to delete customer:", error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa khách hàng",
        variant: "destructive",
      });
    },
  });

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value === "all" ? "" : value }));
    setPage(1);
  };

  const getTemperatureBadgeColor = (temp: string) => {
    switch (temp) {
      case "Hot": return "destructive";
      case "Warm": return "secondary";
      case "Cold": return "outline";
      default: return "outline";
    }
  };

  const canEditCustomer = (customer: Customer) => {
    return user?.role === "admin" || 
           (user?.role === "employee" && customer.assignedSalesperson?.id === user.id);
  };

  const canDeleteCustomer = () => {
    return user?.role === "admin";
  };

  const handleDeleteCustomer = (customer: Customer) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa khách hàng "${customer.name}"? Hành động này không thể hoàn tác.`)) {
      deleteMutation.mutate(customer.id);
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-destructive">Không thể tải danh sách khách hàng</p>
          <Button onClick={() => refetch()} className="mt-2">
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 lg:mb-8 gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">Danh sách khách hàng</h1>
            <div className="flex items-center gap-4 text-sm lg:text-base text-slate-600 mt-1">
              <span>{customersData?.total || 0} tổng khách hàng</span>
              {customersData?.customers && customersData.customers.filter(c => c.appointmentInfo?.upcomingAppointments && c.appointmentInfo.upcomingAppointments > 0).length > 0 && (
                <span className="flex items-center gap-1 text-green-600">
                  <Calendar className="h-4 w-4" />
                  {customersData.customers.filter(c => c.appointmentInfo?.upcomingAppointments && c.appointmentInfo.upcomingAppointments > 0).length} có lịch hẹn
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2 lg:gap-3 w-full sm:w-auto">
            <div className="sm:hidden">
              <ExportDropdown 
                filters={{ ...filters, search } as any}
                sortBy={sortBy}
                sortOrder={sortOrder}
              />
            </div>
            <div className="hidden sm:block">
              <ExportDropdown 
                filters={{ ...filters, search } as any}
                sortBy={sortBy}
                sortOrder={sortOrder}
              />
            </div>
            <Button onClick={() => setShowCreateDialog(true)} className="btn-gradient flex-1 sm:flex-initial">
              <Plus className="h-4 w-4 mr-2" />
              <span className="sm:inline">Thêm</span>
            </Button>
          </div>
        </div>

      {/* Filters */}
      <Card className="mb-4 lg:mb-6 card-modern shadow-lg">
        <CardHeader className="pb-3 lg:pb-4">
          <CardTitle className="flex items-center text-slate-800 text-sm lg:text-base">
            <Filter className="h-4 w-4 mr-2" />
            Lọc
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4">
            <div className="relative col-span-1 sm:col-span-2 lg:col-span-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Tìm kiếm khách hàng..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 border-slate-300 focus:border-blue-500 focus:ring-blue-500 text-sm lg:text-base"
              />
            </div>
            
            <Select value={filters.stageId} onValueChange={(value) => handleFilterChange("stageId", value)}>
              <SelectTrigger className="text-sm lg:text-base">
                <SelectValue placeholder="Tất cả giai đoạn" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả giai đoạn</SelectItem>
                {masterData?.stages?.filter((s: any) => s.active).map((stage: any) => (
                  <SelectItem key={stage.id} value={stage.id}>
                    {stage.name}
                  </SelectItem>
                )) || []}
              </SelectContent>
            </Select>

            <Select value={filters.temperatureId} onValueChange={(value) => handleFilterChange("temperatureId", value)}>
              <SelectTrigger className="text-sm lg:text-base">
                <SelectValue placeholder="Tất cả mức độ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả mức độ</SelectItem>
                {masterData?.temperatures?.filter((t: any) => t.active).map((temp: any) => (
                  <SelectItem key={temp.id} value={temp.id}>
                    {temp.name}
                  </SelectItem>
                )) || []}
              </SelectContent>
            </Select>

            <Select value={filters.provinceId} onValueChange={(value) => handleFilterChange("provinceId", value)}>
              <SelectTrigger className="text-sm lg:text-base">
                <SelectValue placeholder="Tất cả tỉnh" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả tỉnh</SelectItem>
                {masterData?.provinces?.map((province: any) => (
                  <SelectItem key={province.id} value={province.id}>
                    {province.name}
                  </SelectItem>
                )) || []}
              </SelectContent>
            </Select>

            <Select value={(filters as any).appointmentStatus || ""} onValueChange={(value) => handleFilterChange("appointmentStatus", value)}>
              <SelectTrigger className="text-sm lg:text-base">
                <SelectValue placeholder="Tất cả lịch hẹn" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả lịch hẹn</SelectItem>
                <SelectItem value="upcoming">Có lịch hẹn sắp tới</SelectItem>
                <SelectItem value="none">Không có lịch hẹn</SelectItem>
                <SelectItem value="overdue">Quá hạn liên hệ</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Desktop Table View */}
      <div className="hidden lg:block">
        <Card className="card-modern shadow-lg">
          <CardContent className="p-0">
            <div className="overflow-x-auto relative">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort("name")} className="h-auto p-0 font-semibold text-slate-700">
                        Tên
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>Thông tin liên hệ</TableHead>
                    <TableHead>Công ty</TableHead>
                    <TableHead>Sản phẩm</TableHead>
                    <TableHead>Giai đoạn</TableHead>
                    <TableHead>Mức độ</TableHead>
                    <TableHead>Lịch hẹn</TableHead>
                    <TableHead>Nhân viên</TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort("latest_contact")} className="h-auto p-0">
                       Liên hệ lần cuối
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort("created")} className="h-auto p-0">
                        Tạo
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-right sticky right-0 bg-white z-10 border-l border-slate-200">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-8">
                        <div className="animate-pulse">Đang tải khách hàng...</div>
                      </TableCell>
                    </TableRow>
                  ) : customersData?.customers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-8">
                        Không có khách hàng nào...
                      </TableCell>
                    </TableRow>
                  ) : (
                    customersData?.customers.map((customer: Customer) => (
                      <TableRow key={customer.id} className="hover:bg-muted/50">
                        <TableCell>
                          <Link 
                            to={`/customers/${customer.id}`}
                            className="font-medium text-primary hover:underline"
                          >
                            {customer.name}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {customer.phone && <div>{customer.phone}</div>}
                            {customer.email && <div>{customer.email}</div>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{customer.companyName}</div>
                            {customer.province && (
                              <div className="text-muted-foreground">
                                {customer.province.name}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {customer.products.slice(0, 2).map(product => (
                              <Badge key={product.id} variant="secondary" className="font-normal">
                                {product.name}
                              </Badge>
                            ))}
                            {customer.products.length > 2 && (
                              <Badge variant="outline">+{customer.products.length - 2} nữa</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {customer.stage && (
                            <Badge variant="outline">{customer.stage.name}</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {customer.temperature && (
                            <Badge variant={getTemperatureBadgeColor(customer.temperature.name)}>
                              {customer.temperature.name}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm space-y-1">
                            {customer.appointmentInfo?.nextAppointment ? (
                              <div className="space-y-1">
                                <div className="flex items-center gap-1 text-green-600">
                                  <Calendar className="h-3 w-3" />
                                  <span className="font-medium">
                                    {new Date(customer.appointmentInfo.nextAppointment.date).toLocaleDateString('vi-VN')}
                                  </span>
                                </div>
                                <div className="text-xs text-muted-foreground truncate max-w-32">
                                  {customer.appointmentInfo.nextAppointment.title}
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                <span className="text-xs">Không có lịch hẹn</span>
                              </div>
                            )}
                            {customer.appointmentInfo && customer.appointmentInfo.totalAppointments > 0 && (
                              <div className="flex items-center gap-2 text-xs">
                                <Badge variant="outline" className="text-xs px-1 py-0">
                                  {customer.appointmentInfo.totalAppointments} tổng
                                </Badge>
                                {customer.appointmentInfo.upcomingAppointments > 0 && (
                                  <Badge variant="secondary" className="text-xs px-1 py-0">
                                    {customer.appointmentInfo.upcomingAppointments} sắp tới
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {customer.assignedSalesperson?.name}
                        </TableCell>
                        <TableCell>
                          {customer.latestContact ? (
                            <div className="text-sm">
                              <div className="font-medium">{customer.latestContact.type}</div>
                              <div className="text-muted-foreground">
                                {new Date(customer.latestContact.createdAt).toLocaleDateString()}
                              </div>
                              {customer.latestContact.snippet && (
                                <div className="text-xs text-muted-foreground truncate max-w-32">
                                  {customer.latestContact.snippet}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Không có liên hệ</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(customer.createdAt).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell className="text-right sticky right-0 bg-white z-10 border-l border-slate-200">
                          <div className="flex justify-end gap-1">
                            <Link to={`/customers/${customer.id}`}>
                              <Button variant="outline" size="sm" className="h-8 px-2">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            {canEditCustomer(customer) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingCustomer(customer)}
                                className="h-8 px-2"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                            {canDeleteCustomer() && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteCustomer(customer)}
                                disabled={deleteMutation.isPending}
                                className="h-8 px-2 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
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
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : customersData?.customers.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">Không có khách hàng nào...</p>
            </CardContent>
          </Card>
        ) : (
          customersData?.customers.map((customer: Customer) => (
            <Card key={customer.id} className="card-modern shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 min-w-0">
                    <Link 
                      to={`/customers/${customer.id}`}
                      className="font-semibold text-primary hover:underline block truncate"
                    >
                      {customer.name}
                    </Link>
                    <p className="text-sm text-muted-foreground truncate">{customer.companyName}</p>
                  </div>
                  <div className="flex gap-1 ml-2 flex-shrink-0">
                    <Link to={`/customers/${customer.id}`}>
                      <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    {canEditCustomer(customer) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingCustomer(customer)}
                        className="h-8 w-8 p-0"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {canDeleteCustomer() && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteCustomer(customer)}
                        disabled={deleteMutation.isPending}
                        className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  {(customer.phone || customer.email) && (
                    <div>
                      {customer.phone && <p className="text-muted-foreground">{customer.phone}</p>}
                      {customer.email && <p className="text-muted-foreground truncate">{customer.email}</p>}
                    </div>
                  )}
                  
                  {customer.province && (
                    <p className="text-muted-foreground">
                      {customer.province.name}
                    </p>
                  )}
                  
                  <div className="flex flex-wrap gap-1 mt-2">
                    {customer.stage && (
                      <Badge variant="outline" className="text-xs">{customer.stage.name}</Badge>
                    )}
                    {customer.temperature && (
                      <Badge variant={getTemperatureBadgeColor(customer.temperature.name)} className="text-xs">
                        {customer.temperature.name}
                      </Badge>
                    )}
                  </div>
                  
                  {customer.products.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {customer.products.slice(0, 2).map(product => (
                        <Badge key={product.id} variant="secondary" className="text-xs font-normal">
                          {product.name}
                        </Badge>
                      ))}
                      {customer.products.length > 2 && (
                        <Badge variant="outline" className="text-xs">+{customer.products.length - 2} nữa</Badge>
                      )}
                    </div>
                  )}
                  
                  {customer.appointmentInfo && (
                    <div className="space-y-1">
                      {customer.appointmentInfo?.nextAppointment ? (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 text-green-600">
                            <Calendar className="h-3 w-3" />
                            <span className="text-xs font-medium">
                              Lịch hẹn tiếp theo: {new Date(customer.appointmentInfo.nextAppointment.date).toLocaleDateString('vi-VN')}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span className="text-xs">Không có lịch hẹn</span>
                        </div>
                      )}
                      {customer.appointmentInfo.totalAppointments > 0 && (
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {customer.appointmentInfo.totalAppointments} tổng lịch hẹn
                          </Badge>
                          {customer.appointmentInfo.upcomingAppointments > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {customer.appointmentInfo.upcomingAppointments} sắp tới
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {customer.assignedSalesperson && (
                    <p className="text-muted-foreground">
                      Nhân viên: {customer.assignedSalesperson.name}
                    </p>
                  )}
                  
                  <div className="flex justify-between items-center text-xs text-muted-foreground mt-3 pt-2 border-t border-slate-100">
                    <span>Tạo: {new Date(customer.createdAt).toLocaleDateString()}</span>
                    {customer.latestContact && (
                      <span>Liên hệ cuối: {new Date(customer.latestContact.createdAt).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {customersData && customersData.totalPages > 1 && (
        <div className="flex justify-center mt-4 lg:mt-6">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
              className="text-xs lg:text-sm"
            >
              Trước
            </Button>
            <span className="text-xs lg:text-sm text-muted-foreground px-2">
              Trang {page} của {customersData.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page >= customersData.totalPages}
              className="text-xs lg:text-sm"
            >
              Tiếp
            </Button>
          </div>
        </div>
      )}

      <CreateCustomerDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={() => {
          refetch();
          setShowCreateDialog(false);
        }}
      />

      {editingCustomer && (
        <EditCustomerDialog
          customer={editingCustomer}
          open={!!editingCustomer}
          onOpenChange={(open) => !open && setEditingCustomer(null)}
          onSuccess={() => {
            refetch();
            setEditingCustomer(null);
          }}
        />
      )}
      </div>
    </div>
  );
}
