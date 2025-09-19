import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { Upload, FileSpreadsheet, CheckCircle, XCircle } from "lucide-react";
import backend from "~backend/client";
import type { ImportCustomersResponse } from "~backend/customers/types";

interface ImportCustomersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

export default function ImportCustomersDialog({
  open,
  onOpenChange,
  onImportComplete
}: ImportCustomersDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportCustomersResponse | null>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check if it's an Excel file
      const validTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      
      if (!validTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(xlsx?|csv)$/i)) {
        toast({
          title: "Lỗi",
          description: "Vui lòng chọn file Excel (.xlsx, .xls) hoặc CSV",
          variant: "destructive"
        });
        return;
      }
      
      setFile(selectedFile);
      setImportResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    try {
      // Convert file to base64
      const arrayBuffer = await file.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');

      const result = await backend.customers.importCustomers({ fileContent: base64 });
      setImportResult(result);

      if (result.imported > 0) {
        toast({
          title: "Import thành công",
          description: `Đã import ${result.imported} khách hàng thành công`,
        });
        onImportComplete();
      }

      if (result.failed > 0) {
        toast({
          title: "Cảnh báo",
          description: `${result.failed} dòng import thất bại`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Import error:", error);
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi import file",
        variant: "destructive"
      });
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    if (!importing) {
      setFile(null);
      setImportResult(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Import khách hàng từ Excel
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertDescription>
              <strong>Định dạng file Excel yêu cầu:</strong>
              <br />
              Cột A: Nhân viên phụ trách | Cột B: Tên khách hàng* | Cột C: Điện thoại | Cột D: Email
              <br />
              Cột E: Loại khách hàng | Cột F: Tên công ty | Cột G: Sản phẩm | Cột H: Nguồn khách hàng
              <br />
              Cột I: Giai đoạn | Cột J: Ghi chú
              <br />
              <em>* Trường bắt buộc</em>
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="file">Chọn file Excel</Label>
            <Input
              id="file"
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              disabled={importing}
            />
          </div>

          {file && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <FileSpreadsheet className="h-4 w-4 text-primary" />
              <span className="text-sm">{file.name}</span>
              <span className="text-xs text-muted-foreground ml-auto">
                {(file.size / 1024).toFixed(1)} KB
              </span>
            </div>
          )}

          {importing && (
            <div className="space-y-2">
              <Label>Đang import...</Label>
              <Progress value={undefined} className="animate-pulse" />
            </div>
          )}

          {importResult && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <div>
                    <div className="text-sm font-medium text-green-700">Thành công</div>
                    <div className="text-lg font-bold text-green-600">{importResult.imported}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <div>
                    <div className="text-sm font-medium text-red-700">Thất bại</div>
                    <div className="text-lg font-bold text-red-600">{importResult.failed}</div>
                  </div>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div className="space-y-2">
                  <Label>Lỗi chi tiết:</Label>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {importResult.errors.map((error, idx) => (
                      <div key={idx} className="text-sm p-2 bg-red-50 rounded text-red-700">
                        Dòng {error.row}: {error.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose} disabled={importing}>
              Đóng
            </Button>
            <Button 
              onClick={handleImport} 
              disabled={!file || importing}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              {importing ? "Đang import..." : "Import"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}