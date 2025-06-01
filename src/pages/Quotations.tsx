
import { useState, useEffect } from "react";
import { Plus, Search, Filter, Eye, Edit, Send, Download, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { quotationsApi } from "@/services/api";
import { useToast } from "@/components/ui/use-toast";
import QuotationForm from "@/components/quotations/QuotationForm";

export default function Quotations() {
  const [quotations, setQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    sent: 0,
    accepted: 0,
    totalValue: 0,
  });
  const { toast } = useToast();
  const itemsPerPage = 10;

  useEffect(() => {
    fetchQuotations();
  }, [currentPage, statusFilter]);

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit: itemsPerPage,
      };

      if (statusFilter) {
        params.status = statusFilter;
      }

      const response = await quotationsApi.getAll(params);
      console.log("Quotations response:", response);

      if (response.success && response.data) {
        const quotationsData = response.data.quotations || [];
        setQuotations(quotationsData);
        
        // Calculate stats
        const totalQuotations = quotationsData.length;
        const pendingCount = quotationsData.filter((q: any) => q.status === 'draft' || q.status === 'pending').length;
        const sentCount = quotationsData.filter((q: any) => q.status === 'sent').length;
        const acceptedCount = quotationsData.filter((q: any) => q.status === 'accepted').length;
        const totalValue = quotationsData.reduce((sum: number, q: any) => sum + (q.total || 0), 0);

        setStats({
          total: totalQuotations,
          pending: pendingCount,
          sent: sentCount,
          accepted: acceptedCount,
          totalValue: totalValue,
        });

        // Set pagination info if available
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.totalPages || 1);
        }
      }
    } catch (error) {
      console.error("Error fetching quotations:", error);
      toast({
        title: "Error",
        description: "Failed to load quotations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuotation = async (data: any) => {
    try {
      setSubmitting(true);
      const response = await quotationsApi.create(data);
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Quotation created successfully",
        });
        setShowForm(false);
        fetchQuotations();
      } else {
        throw new Error(response.message || "Failed to create quotation");
      }
    } catch (error) {
      console.error("Error creating quotation:", error);
      toast({
        title: "Error",
        description: "Failed to create quotation",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleConvertToSale = async (quotationId: number) => {
    try {
      const response = await quotationsApi.convertToSale(quotationId);
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Quotation converted to sale successfully",
        });
        fetchQuotations();
      } else {
        throw new Error(response.message || "Failed to convert quotation");
      }
    } catch (error) {
      console.error("Error converting quotation:", error);
      toast({
        title: "Error",
        description: "Failed to convert quotation to sale",
        variant: "destructive",
      });
    }
  };

  const getStatusBadgeProps = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft':
      case 'pending':
        return { className: 'bg-yellow-100 text-yellow-800' };
      case 'sent':
        return { className: 'bg-blue-100 text-blue-800' };
      case 'accepted':
        return { className: 'bg-green-100 text-green-800' };
      case 'rejected':
        return { className: 'bg-red-100 text-red-800' };
      case 'expired':
        return { className: 'bg-gray-100 text-gray-800' };
      default:
        return { className: 'bg-gray-100 text-gray-800' };
    }
  };

  const filteredQuotations = quotations.filter(quotation =>
    quotation.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quotation.quoteNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quotations</h1>
          <p className="text-gray-600">Manage customer quotations and estimates</p>
        </div>
        <Button 
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => setShowForm(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Quotation
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Badge className="bg-blue-600">{stats.total}</Badge>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Quotations</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Badge className="bg-yellow-600">{stats.pending}</Badge>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Badge className="bg-green-600">{stats.accepted}</Badge>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Accepted</p>
                <p className="text-2xl font-bold text-gray-900">{stats.accepted}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Badge className="bg-blue-600">Rs. {Math.round(stats.totalValue / 1000)}K</Badge>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-gray-900">Rs. {stats.totalValue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Quotation Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input 
                placeholder="Search quotations..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="text-gray-500">Loading quotations...</div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quote Number</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Valid Until</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuotations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="text-gray-500">No quotations found</div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredQuotations.map((quotation) => (
                      <TableRow key={quotation.id}>
                        <TableCell className="font-medium">{quotation.quoteNumber}</TableCell>
                        <TableCell>{quotation.customerName}</TableCell>
                        <TableCell>{quotation.items?.length || 0}</TableCell>
                        <TableCell>Rs. {quotation.total?.toLocaleString() || 0}</TableCell>
                        <TableCell>{quotation.date}</TableCell>
                        <TableCell>{quotation.validUntil}</TableCell>
                        <TableCell>
                          <Badge {...getStatusBadgeProps(quotation.status)}>
                            {quotation.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Send className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Download className="h-4 w-4" />
                            </Button>
                            {quotation.status === 'sent' && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleConvertToSale(quotation.id)}
                                className="text-green-600 hover:text-green-700"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="mt-6">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPage > 1) setCurrentPage(currentPage - 1);
                          }}
                        />
                      </PaginationItem>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink 
                            href="#"
                            isActive={page === currentPage}
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage(page);
                            }}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext 
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                          }}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Quotation Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Quotation</DialogTitle>
          </DialogHeader>
          <QuotationForm 
            onSubmit={handleCreateQuotation}
            onCancel={() => setShowForm(false)}
            isLoading={submitting}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
