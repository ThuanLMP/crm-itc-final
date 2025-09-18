import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useBackend } from "../contexts/AuthContext";

interface ExportDropdownProps {
  filters: {
    search: string;
    stageId: string;
    temperatureId: string;
    assignedSalespersonId: string;
    provinceId: string;
    contactStatusId: string;
  };
  sortBy: string;
  sortOrder: string;
}

export function ExportDropdown({ filters, sortBy, sortOrder }: ExportDropdownProps) {
  const [isExporting, setIsExporting] = useState(false);
  const backend = useBackend();
  const { toast } = useToast();

  const downloadFile = (data: string, filename: string, mimeType: string) => {
    const byteCharacters = atob(data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const exportData = await backend.customers.exportCustomers({
        format: "excel",
        search: filters.search || undefined,
        stageId: filters.stageId || undefined,
        temperatureId: filters.temperatureId || undefined,
        assignedSalespersonId: filters.assignedSalespersonId || undefined,
        provinceId: filters.provinceId || undefined,
        contactStatusId: filters.contactStatusId || undefined,
        sortBy,
        sortOrder: sortOrder as "asc" | "desc",
      });

      downloadFile(exportData.data, exportData.filename, exportData.mimeType);
      
      toast({
        title: "Thành công",
        description: "Đã xuất dữ liệu thành file Excel",
      });
    } catch (error: any) {
      console.error("Export failed:", error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xuất dữ liệu",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      className="border-slate-300 hover:bg-white"
      disabled={isExporting}
      onClick={handleExportExcel}
    >
      <FileSpreadsheet className="h-4 w-4 mr-2" />
      {isExporting ? "Đang xuất..." : "Xuất Excel"}
    </Button>
  );
}