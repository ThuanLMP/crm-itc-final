import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, Phone, Mail, MapPin, Building, MessageCircle, Calendar, Receipt, CreditCard, Clock, User, DollarSign, Plus, Search } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useBackend, useAuth } from "../contexts/AuthContext";
import { EditCustomerDialog } from "../components/EditCustomerDialog";
import CreateContactWithAppointmentDialog from "../components/CreateContactWithAppointmentDialog";
import { CreateOrderDialog } from "../components/CreateOrderDialog";
import { CreatePaymentDialog } from "../components/CreatePaymentDialog";
import { CustomerAppointments } from "../components/CustomerAppointments";
import type { ContactHistory } from "~backend/contacts/types";
import type { Order } from "~backend/orders/types";
import type { Payment } from "~backend/payments/types";

export function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const [showEditDialog, setShowEditDialog] = useState(false);

  const [showCreateOrderDialog, setShowCreateOrderDialog] = useState(false);
  const [showCreatePaymentDialog, setShowCreatePaymentDialog] = useState(false);
  const [contactSearch, setContactSearch] = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [paymentSearch, setPaymentSearch] = useState("");
  const backend = useBackend();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: customer, isLoading, error, refetch } = useQuery({
    queryKey: ["customer", id],
    queryFn: async () => {
      if (!id) throw new Error("Customer ID is required");
      try {
        return await backend.customers.get({ id });
      } catch (err) {
        console.error("Failed to fetch customer:", err);
        toast({
          title: "Lỗi",
          description: "Không thể tải thông tin khách hàng",
          variant: "destructive",
        });
        throw err;
      }
    },
    enabled: !!id,
  });

  const { data: contactHistory } = useQuery({
    queryKey: ["contacts", id],
    queryFn: async () => {
      if (!id) return { contacts: [], total: 0, page: 1, limit: 50, totalPages: 0 };
      return await backend.contacts.list({ customerId: id, limit: 50 });
    },
    enabled: !!id,
  });

  const { data: orderHistory } = useQuery({
    queryKey: ["orders", id],
    queryFn: async () => {
      if (!id) return { orders: [], total: 0, page: 1, limit: 50, totalPages: 0 };
      return await backend.orders.list({ customerId: id, limit: 50 });
    },
    enabled: !!id,
  });

  const { data: paymentHistory } = useQuery({
    queryKey: ["payments", id],
    queryFn: async () => {
      if (!id) return { payments: [], total: 0, page: 1, limit: 50, totalPages: 0 };
      return await backend.payments.list({ customerId: id, limit: 50 });
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="h-48 bg-muted rounded"></div>
            <div className="h-48 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-destructive">Không thể tải thông tin khách hàng</p>
        </div>
      </div>
    );
  }

  const getTemperatureBadgeColor = (temp: string) => {
    switch (temp) {
      case "Hot": return "destructive";
      case "Warm": return "secondary";
      case "Cold": return "outline";
      default: return "outline";
    }
  };

  // Check if user can edit this customer
  const canEdit = user?.role === "admin" || 
    (user?.role === "employee" && customer.assignedSalesperson?.id === user.id);

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">{customer.name}</h1>
            <p className="text-slate-600">{customer.companyName}</p>
          </div>
          {canEdit && (
            <Button onClick={() => setShowEditDialog(true)} className="btn-gradient">
              <Edit className="h-4 w-4 mr-2" />
              Chỉnh sửa
            </Button>
          )}
        </div>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 mb-4 lg:mb-6">
            <TabsTrigger value="details" className="text-xs lg:text-sm">Chi tiết</TabsTrigger>
            <TabsTrigger value="appointments" className="text-xs lg:text-sm">Lịch hẹn</TabsTrigger>
            <TabsTrigger value="contacts" className="text-xs lg:text-sm">Liên hệ</TabsTrigger>
            <TabsTrigger value="orders" className="text-xs lg:text-sm">Đơn hàng</TabsTrigger>
            <TabsTrigger value="payments" className="text-xs lg:text-sm">Thanh toán</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
          {/* Basic Information */}
          <Card className="card-modern">
            <CardHeader>
              <CardTitle className="text-slate-800">Thông tin liên hệ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {customer.phone && (
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-3 text-slate-500" />
                  <span>{customer.phone}</span>
                </div>
              )}
              {customer.email && (
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-3 text-slate-500" />
                  <span>{customer.email}</span>
                </div>
              )}
              {customer.address && (
                <div className="flex items-start">
                  <MapPin className="h-4 w-4 mr-3 mt-0.5 text-slate-500" />
                  <div>
                    <div>{customer.address}</div>
                    {customer.province && (
                      <div className="text-sm text-slate-500">
                        {customer.province.name}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {customer.companyName && (
                <div className="flex items-center">
                  <Building className="h-4 w-4 mr-3 text-slate-500" />
                  <span>{customer.companyName}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Business Details */}
          <Card className="card-modern">
            <CardHeader>
              <CardTitle className="text-slate-800">Thông tin doanh nghiệp</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {customer.customerType && (
                  <div>
                    <label className="text-sm font-medium text-slate-600">Loại khách hàng</label>
                    <div>{customer.customerType.name}</div>
                  </div>
                )}
                {customer.businessType && (
                  <div>
                    <label className="text-sm font-medium text-slate-600">Loại doanh nghiệp</label>
                    <div>{customer.businessType.name}</div>
                  </div>
                )}
                {customer.companySize && (
                  <div>
                    <label className="text-sm font-medium text-slate-600">Quy mô công ty</label>
                    <div>{customer.companySize.name}</div>
                  </div>
                )}
                {customer.leadSource && (
                  <div>
                    <label className="text-sm font-medium text-slate-600">Nguồn khách hàng</label>
                    <div>{customer.leadSource.name}</div>
                  </div>
                )}
              </div>
              
              {customer.products.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-slate-600">Sản phẩm quan tâm</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {customer.products.map((product) => (
                      <Badge key={product.id} variant="outline">
                        {product.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sales Information */}
          <Card className="card-modern">
            <CardHeader>
              <CardTitle className="text-slate-800">Thông tin bán hàng</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {customer.stage && (
                  <div>
                    <label className="text-sm font-medium text-slate-600">Giai đoạn</label>
                    <div>
                      <Badge variant="outline">{customer.stage.name}</Badge>
                    </div>
                  </div>
                )}
                {customer.temperature && (
                  <div>
                    <label className="text-sm font-medium text-slate-600">Mức độ</label>
                    <div>
                      <Badge variant={getTemperatureBadgeColor(customer.temperature.name)}>
                        {customer.temperature.name}
                      </Badge>
                    </div>
                  </div>
                )}
                {customer.contactStatus && (
                  <div>
                    <label className="text-sm font-medium text-slate-600">Trạng thái liên hệ</label>
                    <div>{customer.contactStatus.name}</div>
                  </div>
                )}
                {customer.assignedSalesperson && (
                  <div>
                    <label className="text-sm font-medium text-slate-600">Nhân viên phụ trách</label>
                    <div>{customer.assignedSalesperson.name}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Notes and Feedback */}
          <Card className="card-modern">
            <CardHeader>
              <CardTitle className="text-slate-800">Ghi chú & Phản hồi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {customer.customerFeedback && (
                <div>
                  <label className="text-sm font-medium text-slate-600">Phản hồi khách hàng</label>
                  <div className="mt-1 p-3 bg-slate-50 rounded text-sm">
                    {customer.customerFeedback}
                  </div>
                </div>
              )}
              {customer.notes && (
                <div>
                  <label className="text-sm font-medium text-slate-600">Ghi chú nội bộ</label>
                  <div className="mt-1 p-3 bg-slate-50 rounded text-sm">
                    {customer.notes}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
            </div>

            {/* Audit Information */}
            <Card className="card-modern">
              <CardHeader>
                <CardTitle className="text-slate-800">Thông tin kiểm toán</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="text-slate-600">Tạo lúc</label>
                    <div>
                      {new Date(customer.createdAt).toLocaleString()}
                      {customer.createdBy && <span className="text-slate-500"> by {customer.createdBy.name}</span>}
                    </div>
                  </div>
                  <div>
                    <label className="text-slate-600">Cập nhật cuối</label>
                    <div>
                      {new Date(customer.updatedAt).toLocaleString()}
                      {customer.updatedBy && <span className="text-slate-500"> by {customer.updatedBy.name}</span>}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appointments" className="space-y-4 lg:space-y-6">
            {id && (
              <CustomerAppointments customerId={id} customerName={customer.name} />
            )}
          </TabsContent>

          <TabsContent value="contacts" className="space-y-4 lg:space-y-6">
            <Card className="card-modern">
              <CardHeader className="pb-3 lg:pb-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <CardTitle className="flex items-center text-base lg:text-lg text-slate-800">
                    <MessageCircle className="h-4 w-4 lg:h-5 lg:w-5 mr-2" />
                    Lịch sử liên hệ
                  </CardTitle>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="Tìm kiếm liên hệ..."
                        value={contactSearch}
                        onChange={(e) => setContactSearch(e.target.value)}
                        className="pl-8 w-full sm:w-64 text-sm lg:text-base"
                      />
                    </div>
                    <CreateContactWithAppointmentDialog 
                      customerId={id!} 
                      customerName={customer.name}
                      onSuccess={() => {
                        queryClient.invalidateQueries({ queryKey: ["contacts", id] });
                        queryClient.invalidateQueries({ queryKey: ["appointments", id] });
                      }}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {contactHistory?.contacts && contactHistory.contacts
                  .filter(contact => 
                    !contactSearch || 
                    contact.subject.toLowerCase().includes(contactSearch.toLowerCase()) ||
                    contact.notes.toLowerCase().includes(contactSearch.toLowerCase()) ||
                    contact.type.toLowerCase().includes(contactSearch.toLowerCase())
                  ).length > 0 ? (
                  <div className="space-y-4">
                    {contactHistory.contacts
                      .filter(contact => 
                        !contactSearch || 
                        contact.subject.toLowerCase().includes(contactSearch.toLowerCase()) ||
                        contact.notes.toLowerCase().includes(contactSearch.toLowerCase()) ||
                        contact.type.toLowerCase().includes(contactSearch.toLowerCase())
                      )
                      .map((contact: ContactHistory) => (
                      <Card key={contact.id} className="p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Badge variant="outline" className="capitalize">
                                {contact.type === 'call' ? 'Cuộc gọi' : 
                                 contact.type === 'email' ? 'Email' :
                                 contact.type === 'meeting' ? 'Cuộc họp' :
                                 contact.type === 'zalo' ? 'Zalo' : 'Khác'}
                              </Badge>
                              <span className="text-sm text-slate-500">
                                {new Date(contact.createdAt).toLocaleString('vi-VN')}
                              </span>
                              {contact.duration && (
                                <div className="flex items-center gap-1 text-sm text-slate-500">
                                  <Clock className="h-3 w-3" />
                                  {contact.duration} phút
                                </div>
                              )}
                            </div>
                            
                            {contact.subject && (
                              <h4 className="font-semibold text-slate-800 mb-2">
                                {contact.subject}
                              </h4>
                            )}
                            
                            {contact.notes && (
                              <p className="text-slate-600 mb-3 leading-relaxed">
                                {contact.notes}
                              </p>
                            )}
                            
                            <div className="grid gap-2">
                              {contact.outcome && (
                                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                  <div className="text-sm font-medium text-green-800 mb-1">Kết quả:</div>
                                  <div className="text-sm text-green-700">{contact.outcome}</div>
                                </div>
                              )}
                              
                              {contact.nextStep && (
                                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                  <div className="text-sm font-medium text-blue-800 mb-1">Bước tiếp theo:</div>
                                  <div className="text-sm text-blue-700">{contact.nextStep}</div>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-1 text-sm text-slate-500 mt-3">
                              <User className="h-3 w-3" />
                              {contact.createdBy.name}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-center py-8">
                    {contactSearch ? "Không tìm thấy liên hệ nào" : "Chưa có lịch sử liên hệ"}
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="space-y-4 lg:space-y-6">
            <Card className="card-modern">
              <CardHeader className="pb-3 lg:pb-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <CardTitle className="flex items-center text-base lg:text-lg text-slate-800">
                    <Receipt className="h-4 w-4 lg:h-5 lg:w-5 mr-2" />
                    Lịch sử đơn hàng
                  </CardTitle>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="Tìm kiếm đơn hàng..."
                        value={orderSearch}
                        onChange={(e) => setOrderSearch(e.target.value)}
                        className="pl-8 w-full sm:w-64 text-sm lg:text-base"
                      />
                    </div>
                    <Button onClick={() => setShowCreateOrderDialog(true)} size="sm" className="text-sm">
                      <Plus className="h-4 w-4 mr-1" />
                      <span className="sm:hidden">Thêm</span>
                      <span className="hidden sm:inline">Thêm đơn hàng</span>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {orderHistory?.orders && orderHistory.orders
                  .filter(order => 
                    !orderSearch || 
                    order.orderNumber.toLowerCase().includes(orderSearch.toLowerCase()) ||
                    order.status.toLowerCase().includes(orderSearch.toLowerCase()) ||
                    order.items.some(item => item.productName.toLowerCase().includes(orderSearch.toLowerCase()))
                  ).length > 0 ? (
                  <div className="space-y-4">
                    {orderHistory.orders
                      .filter(order => 
                        !orderSearch || 
                        order.orderNumber.toLowerCase().includes(orderSearch.toLowerCase()) ||
                        order.status.toLowerCase().includes(orderSearch.toLowerCase()) ||
                        order.items.some(item => item.productName.toLowerCase().includes(orderSearch.toLowerCase()))
                      )
                      .map((order: Order) => (
                      <Card key={order.id} className="p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-slate-800">{order.orderNumber}</h4>
                              <Badge 
                                variant={order.status === 'completed' ? 'default' : 
                                        order.status === 'cancelled' ? 'destructive' : 
                                        order.status === 'active' ? 'default' : 'secondary'}
                              >
                                {order.status === 'pending' ? 'Chờ xử lý' :
                                 order.status === 'confirmed' ? 'Đã xác nhận' :
                                 order.status === 'processing' ? 'Đang xử lý' :
                                 order.status === 'active' ? 'Đang hoạt động' :
                                 order.status === 'completed' ? 'Hoàn thành' :
                                 order.status === 'cancelled' ? 'Đã hủy' :
                                 order.status === 'refunded' ? 'Đã hoàn tiền' : order.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-500">
                              {new Date(order.orderDate).toLocaleDateString('vi-VN')}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1 font-semibold text-lg">
                              <DollarSign className="h-4 w-4" />
                              {order.totalAmount.toLocaleString()} VND
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid gap-3">
                          <div>
                            <h5 className="font-medium text-sm text-slate-700 mb-2">Sản phẩm:</h5>
                            <div className="grid gap-2">
                              {order.items.map((item) => (
                                <div key={item.id} className="flex justify-between items-center p-2 bg-slate-50 rounded">
                                  <div className="flex-1">
                                    <div className="font-medium text-sm">{item.productName}</div>
                                    <div className="text-xs text-slate-500">
                                      {item.quantity} x {item.unitPrice.toLocaleString()} VND
                                    </div>
                                  </div>
                                  <div className="font-medium text-sm">
                                    {item.totalPrice.toLocaleString()} VND
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          {(order.activationDate || order.expiryDate || order.licenseType) && (
                            <div>
                              <h5 className="font-medium text-sm text-slate-700 mb-1">Thông tin license:</h5>
                              <div className="text-sm text-slate-600 space-y-1">
                                {order.licenseType && (
                                  <p>Loại: {order.licenseType === 'trial' ? 'Dùng thử' :
                                           order.licenseType === 'subscription' ? 'Đăng ký' :
                                           order.licenseType === 'perpetual' ? 'Vĩnh viễn' :
                                           order.licenseType === 'enterprise' ? 'Doanh nghiệp' : order.licenseType}</p>
                                )}
                                {order.activationDate && (
                                  <p>Kích hoạt: {new Date(order.activationDate).toLocaleDateString('vi-VN')}</p>
                                )}
                                {order.expiryDate && (
                                  <p>Hết hạn: {new Date(order.expiryDate).toLocaleDateString('vi-VN')}</p>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {order.notes && (
                            <div>
                              <h5 className="font-medium text-sm text-slate-700 mb-1">Ghi chú:</h5>
                              <p className="text-sm text-slate-600">{order.notes}</p>
                            </div>
                          )}
                          
                          {order.createdBy && (
                            <div className="flex items-center gap-1 text-sm text-slate-500 pt-2 border-t">
                              <User className="h-3 w-3" />
                              Tạo bởi: {order.createdBy.name}
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-center py-8">
                    {orderSearch ? "Không tìm thấy đơn hàng nào" : "Chưa có lịch sử đơn hàng"}
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="space-y-4 lg:space-y-6">
            <Card className="card-modern">
              <CardHeader className="pb-3 lg:pb-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <CardTitle className="flex items-center text-base lg:text-lg text-slate-800">
                    <CreditCard className="h-4 w-4 lg:h-5 lg:w-5 mr-2" />
                    Lịch sử thanh toán
                  </CardTitle>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="Tìm kiếm thanh toán..."
                        value={paymentSearch}
                        onChange={(e) => setPaymentSearch(e.target.value)}
                        className="pl-8 w-full sm:w-64 text-sm lg:text-base"
                      />
                    </div>
                    <Button onClick={() => setShowCreatePaymentDialog(true)} size="sm" className="text-sm">
                      <Plus className="h-4 w-4 mr-1" />
                      <span className="sm:hidden">Thêm</span>
                      <span className="hidden sm:inline">Thêm thanh toán</span>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {paymentHistory?.payments && paymentHistory.payments
                  .filter(payment => 
                    !paymentSearch || 
                    payment.paymentNumber.toLowerCase().includes(paymentSearch.toLowerCase()) ||
                    payment.paymentMethod.toLowerCase().includes(paymentSearch.toLowerCase()) ||
                    payment.status.toLowerCase().includes(paymentSearch.toLowerCase()) ||
                    (payment.referenceNumber && payment.referenceNumber.toLowerCase().includes(paymentSearch.toLowerCase()))
                  ).length > 0 ? (
                  <div className="space-y-4">
                    {paymentHistory.payments
                      .filter(payment => 
                        !paymentSearch || 
                        payment.paymentNumber.toLowerCase().includes(paymentSearch.toLowerCase()) ||
                        payment.paymentMethod.toLowerCase().includes(paymentSearch.toLowerCase()) ||
                        payment.status.toLowerCase().includes(paymentSearch.toLowerCase()) ||
                        (payment.referenceNumber && payment.referenceNumber.toLowerCase().includes(paymentSearch.toLowerCase()))
                      )
                      .map((payment: Payment) => (
                      <Card key={payment.id} className="p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-slate-800">{payment.paymentNumber}</h4>
                              <Badge 
                                variant={payment.status === 'completed' ? 'default' : 
                                        payment.status === 'failed' ? 'destructive' : 'secondary'}
                              >
                                {payment.status === 'pending' ? 'Chờ xử lý' :
                                 payment.status === 'completed' ? 'Hoàn thành' :
                                 payment.status === 'failed' ? 'Thất bại' :
                                 payment.status === 'cancelled' ? 'Đã hủy' :
                                 payment.status === 'refunded' ? 'Đã hoàn tiền' : payment.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-500">
                              {new Date(payment.paymentDate).toLocaleDateString('vi-VN')}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1 font-semibold text-lg">
                              <DollarSign className="h-4 w-4" />
                              {payment.amount.toLocaleString()} {payment.currency}
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid gap-3">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h5 className="font-medium text-sm text-slate-700 mb-1">Phương thức:</h5>
                              <Badge variant="outline" className="capitalize">
                                {payment.paymentMethod === 'cash' ? 'Tiền mặt' :
                                 payment.paymentMethod === 'bank_transfer' ? 'Chuyển khoản' :
                                 payment.paymentMethod === 'credit_card' ? 'Thẻ tín dụng' :
                                 payment.paymentMethod === 'check' ? 'Séc' : 'Khác'}
                              </Badge>
                            </div>
                            
                            {payment.referenceNumber && (
                              <div>
                                <h5 className="font-medium text-sm text-slate-700 mb-1">Số tham chiếu:</h5>
                                <p className="text-sm text-slate-600">{payment.referenceNumber}</p>
                              </div>
                            )}
                          </div>
                          
                          {payment.notes && (
                            <div>
                              <h5 className="font-medium text-sm text-slate-700 mb-1">Ghi chú:</h5>
                              <p className="text-sm text-slate-600">{payment.notes}</p>
                            </div>
                          )}
                          
                          {payment.createdBy && (
                            <div className="flex items-center gap-1 text-sm text-slate-500 pt-2 border-t">
                              <User className="h-3 w-3" />
                              Tạo bởi: {payment.createdBy.name}
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-center py-8">
                    {paymentSearch ? "Không tìm thấy thanh toán nào" : "Chưa có lịch sử thanh toán"}
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {showEditDialog && (
          <EditCustomerDialog
            customer={customer}
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
            onSuccess={() => {
              refetch();
              setShowEditDialog(false);
            }}
          />
        )}

        {id && (
          <>

            <CreateOrderDialog
              customerId={id}
              open={showCreateOrderDialog}
              onOpenChange={setShowCreateOrderDialog}
            />
            <CreatePaymentDialog
              customerId={id}
              open={showCreatePaymentDialog}
              onOpenChange={setShowCreatePaymentDialog}
            />
          </>
        )}
      </div>
    </div>
  );
}
