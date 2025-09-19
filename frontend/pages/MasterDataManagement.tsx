import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Pencil, Trash2, Settings, ToggleLeft, ToggleRight, Calendar, Clock } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useBackend, useAuth } from "../contexts/AuthContext";
import { CreateMasterDataDialog } from "../components/CreateMasterDataDialog";
import { EditMasterDataDialog } from "../components/EditMasterDataDialog";
import type { MasterDataItem } from "~backend/masterdata/list_items";

const MASTER_DATA_TABLES = [
  { key: "customer_types", label: "Loại khách hàng", description: "Các loại khách hàng (Cá nhân, Kinh doanh, vv...)" },
  { key: "business_types", label: "Loại hình kinh doanh", description: "Loại hình kinh doanh của doanh nghiệp" },
  { key: "stages", label: "Giai đoạn", description: "Giai đoạn chăm sóc khách hàng (Chăm sóc, Gửi báo giá, Cân nhắc, Mua hàng)" },
  { key: "temperatures", label: "Mức độ", description: "Mức độ (Lạnh, Ấm, Nóng)" },
  { key: "contact_statuses", label: "Trạng thái liên hệ", description: "Theo dõi trạng thái liên hệ khách hàng" },
  { key: "lead_sources", label: "Nguồn", description: "Cách khách hàng tìm thấy doanh nghiệp của bạn" },
  { key: "company_sizes", label: "Quy mô công ty", description: "Phạm vi nhân viên của khách hàng doanh nghiệp" },
  { key: "products", label: "Sản phẩm", description: "Sản phẩm và dịch vụ của bạn" },
];

export function MasterDataManagement() {
  const [activeTab, setActiveTab] = useState("customer_types");
  const [search, setSearch] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<MasterDataItem | null>(null);

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

  const { data: itemsData, isLoading, error } = useQuery({
    queryKey: ["masterdata", activeTab],
    queryFn: async () => {
      try {
        return await backend.masterdata.listItems({ table: activeTab });
      } catch (err) {
        console.error("Không thể tải dữ liệu:", err);
        toast({
          title: "Lỗi",
          description: "Không thể tải dữ liệu gốc",
          variant: "destructive",
        });
        throw err;
      }
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (item: MasterDataItem) => 
      backend.masterdata.updateItem({ 
        table: activeTab, 
        id: item.id, 
        name: item.name, 
        active: !item.active 
      }),
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Cập nhật trạng thái thành công",
      });
      queryClient.invalidateQueries({ queryKey: ["masterdata", activeTab] });
      queryClient.invalidateQueries({ queryKey: ["masterdata"] }); // Refresh main master data
      queryClient.refetchQueries({ queryKey: ["masterdata"] }); // Force refetch
    },
    onError: (error: any) => {
      console.error("Có lỗi xảy ra:", error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật mục",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => backend.masterdata.deleteItem({ table: activeTab, id }),
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Xóa mục thành công",
      });
      queryClient.invalidateQueries({ queryKey: ["masterdata", activeTab] });
      queryClient.invalidateQueries({ queryKey: ["masterdata"] }); // Refresh main master data
      queryClient.refetchQueries({ queryKey: ["masterdata"] }); // Force refetch
    },
    onError: (error: any) => {
      console.error("Có lỗi xảy ra:", error);
      toast({
        title: "Error",
        description: error.message || "Có lỗi xảy ra",
        variant: "destructive",
      });
    },
  });

  const currentTable = MASTER_DATA_TABLES.find(t => t.key === activeTab);
  const filteredItems = itemsData?.items.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const handleToggleActive = (item: MasterDataItem) => {
    toggleActiveMutation.mutate(item);
  };

  const handleDelete = (item: MasterDataItem) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa "${item.name}"? Hành động không thể hoàn tác.`)) {
      deleteMutation.mutate(item.id);
    }
  };

  return (
    <div className="p-4 lg:p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="mx-auto">
        <div className="mb-6 lg:mb-8">
          <div className="flex items-center gap-2 lg:gap-3 mb-2">
            <div className="p-1.5 lg:p-2 bg-blue-100 rounded-lg">
              <Settings className="h-5 w-5 lg:h-6 lg:w-6 text-blue-600" />
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">Quản lý dữ liệu gốc</h1>
          </div>
          <p className="text-sm lg:text-base text-slate-600">
           Quản lý dữ liệu tham chiếu trên hệ thống của bạn
          </p>
        </div>

        <Card className="card-modern shadow-lg">
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="p-3 lg:p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50">
                <TabsList className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 w-full bg-white shadow-sm gap-1">
                  {MASTER_DATA_TABLES.map((table) => (
                    <TabsTrigger 
                      key={table.key} 
                      value={table.key}
                      className="text-[10px] sm:text-xs lg:text-sm data-[state=active]:bg-blue-500 data-[state=active]:text-white px-1 lg:px-2 py-1.5 lg:py-2"
                    >
                     <span className="truncate">{table.label}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {MASTER_DATA_TABLES.map((table) => (
                <TabsContent key={table.key} value={table.key} className="p-3 lg:p-6">
                  <div className="mb-4 lg:mb-6">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-3 lg:mb-4 gap-3">
                      <div className="flex-1 min-w-0">
                        <h2 className="text-xl lg:text-2xl font-semibold text-slate-800 mb-1 lg:mb-2 truncate">{table.label}</h2>
                        <p className="text-sm lg:text-base text-slate-600 hidden lg:block">{table.description}</p>
                        <p className="text-xs lg:text-sm text-slate-500 mt-1">
                          {filteredItems.length} bản ghi • {filteredItems.filter(i => i.active).length} hoạt động
                        </p>
                      </div>
                      <Button 
                        onClick={() => setShowCreateDialog(true)}
                        className="btn-gradient flex-shrink-0 w-full lg:w-auto"
                        size="sm"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        <span className="lg:hidden">Thêm</span>
                        <span className="hidden lg:inline">Thêm {table.label}</span>
                      </Button>
                    </div>

                    {/* Search */}
                    <div className="relative max-w-full lg:max-w-md">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder={`Tìm kiếm ${table.label.toLowerCase()}...`}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 border-slate-300 focus:border-blue-500 focus:ring-blue-500 text-sm lg:text-base"
                      />
                    </div>
                  </div>

                  {/* Items Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4">
                    {isLoading ? (
                      // Loading skeleton cards
                      [...Array(8)].map((_, index) => (
                        <Card key={index} className="card-modern animate-pulse">
                          <CardHeader className="pb-2 lg:pb-3">
                            <div className="flex items-center justify-between">
                              <div className="h-3 lg:h-4 bg-slate-200 rounded w-3/4"></div>
                              <div className="h-5 lg:h-6 bg-slate-200 rounded w-12 lg:w-16"></div>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="space-y-2">
                              <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                              <div className="h-3 bg-slate-200 rounded w-3/4"></div>
                              <div className="flex gap-1 lg:gap-2 mt-3 lg:mt-4">
                                <div className="h-7 lg:h-8 bg-slate-200 rounded w-7 lg:w-8"></div>
                                <div className="h-7 lg:h-8 bg-slate-200 rounded w-7 lg:w-8"></div>
                                <div className="h-7 lg:h-8 bg-slate-200 rounded w-7 lg:w-8"></div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : filteredItems.length === 0 ? (
                      <div className="col-span-full">
                        <Card className="card-modern">
                          <CardContent className="p-4 lg:p-8 text-center">
                            <div className="text-sm lg:text-base text-slate-500">
                              {search ? `Không tìm thấy "${search}"` : `Không có ${table.label.toLowerCase()}`}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    ) : (
                      filteredItems.map((item) => (
                        <Card key={item.id} className="card-modern hover:shadow-lg transition-all duration-200 group">
                          <CardHeader className="pb-2 lg:pb-3">
                            <div className="flex items-start justify-between gap-2">
                              <CardTitle className="text-sm lg:text-lg font-semibold text-slate-800 truncate flex-1 min-w-0">
                                {item.name}
                              </CardTitle>
                              <Badge 
                                variant={item.active ? "default" : "secondary"}
                                className={`${item.active ? "badge-success" : "badge-warning"} text-xs flex-shrink-0`}
                              >
                                {item.active ? "Hoạt động" : "Tạm dừng"}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="space-y-2 lg:space-y-3">
                              <div className="flex items-center text-xs lg:text-sm text-slate-600">
                                <Calendar className="h-3 w-3 lg:h-4 lg:w-4 mr-1.5 lg:mr-2 flex-shrink-0" />
                                <span className="truncate">Tạo: {new Date(item.createdAt).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center text-xs lg:text-sm text-slate-600">
                                <Clock className="h-3 w-3 lg:h-4 lg:w-4 mr-1.5 lg:mr-2 flex-shrink-0" />
                                <span className="truncate">Cập nhật: {new Date(item.updatedAt).toLocaleDateString()}</span>
                              </div>
                              
                              {/* Action buttons */}
                              <div className="flex gap-1 lg:gap-2 pt-1 lg:pt-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-200">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleToggleActive(item)}
                                  disabled={toggleActiveMutation.isPending}
                                  className="h-7 lg:h-8 px-2 lg:px-3 flex-1 text-xs lg:text-sm"
                                  title={item.active ? "Tạm dừng" : "Kích hoạt"}
                                >
                                  {item.active ? (
                                    <ToggleRight className="h-3 w-3 lg:h-4 lg:w-4 text-green-600" />
                                  ) : (
                                    <ToggleLeft className="h-3 w-3 lg:h-4 lg:w-4 text-slate-400" />
                                  )}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setEditingItem(item)}
                                  className="h-7 lg:h-8 px-2 lg:px-3 text-xs lg:text-sm"
                                  title="Sửa"
                                >
                                  <Pencil className="h-3 w-3 lg:h-4 lg:w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDelete(item)}
                                  disabled={deleteMutation.isPending}
                                  className="h-7 lg:h-8 px-2 lg:px-3 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-xs lg:text-sm"
                                  title="Xóa"
                                >
                                  <Trash2 className="h-3 w-3 lg:h-4 lg:w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        <CreateMasterDataDialog
          table={activeTab}
          tableLabel={currentTable?.label || ""}
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["masterdata", activeTab] });
            queryClient.invalidateQueries({ queryKey: ["masterdata"] }); // Refresh all master data
            queryClient.refetchQueries({ queryKey: ["masterdata"] }); // Force refetch
            setShowCreateDialog(false);
          }}
        />

        {editingItem && (
          <EditMasterDataDialog
            table={activeTab}
            tableLabel={currentTable?.label || ""}
            item={editingItem}
            open={!!editingItem}
            onOpenChange={(open) => !open && setEditingItem(null)}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ["masterdata", activeTab] });
              queryClient.invalidateQueries({ queryKey: ["masterdata"] }); // Refresh all master data
              queryClient.refetchQueries({ queryKey: ["masterdata"] }); // Force refetch
              setEditingItem(null);
            }}
          />
        )}
      </div>
    </div>
  );
}
