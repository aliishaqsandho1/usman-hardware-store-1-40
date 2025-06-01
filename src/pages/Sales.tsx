import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Package, Search, Plus, Minus, Pin, PinOff, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { salesApi, customersApi, productsApi } from "@/services/api";
import { QuickCustomerForm } from "@/components/QuickCustomerForm";
import { TodaysOrdersModal } from "@/components/sales/TodaysOrdersModal";

interface CartItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  sku: string;
  unit: string;
}

const Sales = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [isQuickCustomerOpen, setIsQuickCustomerOpen] = useState(false);
  const [isTodaysOrdersOpen, setIsTodaysOrdersOpen] = useState(false);
  const [todaysOrders, setTodaysOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pinnedProducts, setPinnedProducts] = useState<number[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [orderStatus, setOrderStatus] = useState("completed");
  const [quantityInputs, setQuantityInputs] = useState<{[key: number]: string}>({});

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
    fetchTodaysOrders();
    // Load pinned products from localStorage
    const saved = localStorage.getItem('pinnedProducts');
    if (saved) {
      try {
        setPinnedProducts(JSON.parse(saved));
      } catch (error) {
        console.error('Error parsing pinned products from localStorage:', error);
        setPinnedProducts([]);
      }
    }
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productsApi.getAll({ 
        limit: 100,
        status: 'active'
      });
      if (response.success && response.data) {
        const productsData = response.data?.products || response.data || [];
        const validProducts = Array.isArray(productsData) ? productsData : [];
        setProducts(validProducts);
        
        // Extract unique categories from products
        const uniqueCategories = [...new Set(
          validProducts
            .map(product => product.category)
            .filter(category => category && typeof category === 'string')
        )];
        setCategories(uniqueCategories);
      } else {
        setProducts([]);
        setCategories([]);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setProducts([]);
      setCategories([]);
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await customersApi.getAll({ limit: 100 });
      if (response.success) {
        const customersData = response.data?.customers || response.data || [];
        setCustomers(Array.isArray(customersData) ? customersData : []);
      } else {
        setCustomers([]);
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error);
      setCustomers([]);
    }
  };

  const fetchTodaysOrders = async () => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const response = await salesApi.getAll({ 
        dateFrom: today,
        dateTo: today,
        limit: 50
      });
      if (response.success) {
        const ordersData = response.data?.sales || response.data || [];
        setTodaysOrders(Array.isArray(ordersData) ? ordersData : []);
      } else {
        setTodaysOrders([]);
      }
    } catch (error) {
      console.error('Failed to fetch today\'s orders:', error);
      setTodaysOrders([]);
    }
  };

  const togglePinProduct = (productId: number) => {
    const newPinned = pinnedProducts.includes(productId)
      ? pinnedProducts.filter(id => id !== productId)
      : [...pinnedProducts, productId];
    
    setPinnedProducts(newPinned);
    localStorage.setItem('pinnedProducts', JSON.stringify(newPinned));
    
    toast({
      title: pinnedProducts.includes(productId) ? "Product Unpinned" : "Product Pinned",
      description: `Product ${pinnedProducts.includes(productId) ? 'removed from' : 'added to'} pinned items`,
    });
  };

  const addToCartWithCustomQuantity = (product: any, customQuantity?: number) => {
    const quantity = customQuantity || 1;
    const existingItem = cart.find(item => item.productId === product.id);
    
    if (existingItem) {
      setCart(cart.map(item => 
        item.productId === product.id 
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ));
    } else {
      setCart([...cart, {
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: quantity,
        sku: product.sku,
        unit: product.unit
      }]);
    }

    // Clear the quantity input for this product
    setQuantityInputs(prev => ({...prev, [product.id]: ""}));

    toast({
      title: "Added to Cart",
      description: `${quantity} ${product.unit} of ${product.name} added to cart`,
    });
  };

  const handleQuantityInputChange = (productId: number, value: string) => {
    // Allow decimal numbers
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setQuantityInputs(prev => ({...prev, [productId]: value}));
    }
  };

  const addCustomQuantityToCart = (product: any) => {
    const inputValue = quantityInputs[product.id];
    const quantity = parseFloat(inputValue);
    
    if (inputValue && !isNaN(quantity) && quantity > 0) {
      addToCartWithCustomQuantity(product, quantity);
    } else {
      toast({
        title: "Invalid Quantity",
        description: "Please enter a valid quantity",
        variant: "destructive"
      });
    }
  };

  const updateCartQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      setCart(cart.filter(item => item.productId !== productId));
    } else {
      setCart(cart.map(item => 
        item.productId === productId 
          ? { ...item, quantity }
          : item
      ));
    }
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to cart before checkout",
        variant: "destructive"
      });
      return;
    }

    try {
      const saleData = {
        customerId: selectedCustomer?.id || null,
        customerName: selectedCustomer?.name || "Walk-in Customer",
        items: cart.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.price,
          totalPrice: item.price * item.quantity
        })),
        totalAmount: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        discount: 0,
        paymentMethod: paymentMethod,
        status: orderStatus,
        saleDate: new Date().toISOString(),
        notes: selectedCustomer ? `Sale to ${selectedCustomer.name}` : "Walk-in customer sale"
      };

      console.log('Sending sale data:', saleData);

      const response = await salesApi.create(saleData);
      
      if (response.success) {
        setCart([]);
        setSelectedCustomer(null);
        setQuantityInputs({});
        setPaymentMethod("cash");
        fetchTodaysOrders();
        toast({
          title: "Sale Completed Successfully",
          description: `Order has been processed with status: ${orderStatus}. Total: PKR ${saleData.totalAmount.toFixed(2)}`,
        });
      } else {
        throw new Error(response.message || 'Failed to process sale');
      }
    } catch (error) {
      console.error('Failed to process sale:', error);
      toast({
        title: "Sale Failed",
        description: `Error: ${error.message || 'Unknown error occurred'}`,
        variant: "destructive"
      });
    }
  };

  // Filter products by category and search term
  const filteredProducts = products.filter(product => {
    const matchesSearch = product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product?.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === null || product?.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Sort products: pinned first, then by name
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const aIsPinned = pinnedProducts.includes(a.id);
    const bIsPinned = pinnedProducts.includes(b.id);
    
    if (aIsPinned && !bIsPinned) return -1;
    if (!aIsPinned && bIsPinned) return 1;
    return (a.name || '').localeCompare(b.name || '');
  });

  // Calculate total cart items
  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (loading) {
    return (
      <div className="flex-1 p-6 space-y-6 min-h-screen bg-background">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-muted-foreground">Loading POS...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Main POS Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-background shadow-sm border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                <div>
                  <h1 className="text-base font-semibold text-foreground">Sales System (POS)</h1>
                  <p className="text-xs text-muted-foreground">Usman Hardware - Hafizabad</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                {totalCartItems} items
              </span>
              <Button 
                size="sm" 
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => setIsTodaysOrdersOpen(true)}
              >
                Today's Orders
              </Button>
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div className="flex-1 p-4 overflow-auto bg-background">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Package className="h-4 w-4 text-blue-600" />
                Products
                <Badge variant="outline" className="ml-1 text-xs">{pinnedProducts.length} pinned</Badge>
              </h2>
            </div>
            
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search products by name or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10 bg-background border-input"
              />
            </div>

            {/* Dynamic Category Filter Bar */}
            <div className="bg-muted/50 border border-border rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Filter by Category:</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={selectedCategory === null ? "default" : "outline"}
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => setSelectedCategory(null)}
                >
                  All Products ({products.length})
                </Button>
                {categories.map((category) => {
                  const categoryCount = products.filter(p => p.category === category).length;
                  return (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? "default" : "outline"}
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => setSelectedCategory(category)}
                    >
                      {category} ({categoryCount})
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Enhanced Responsive Products Grid with reduced height cards */}
          <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
            {sortedProducts.map((product) => (
              <Card key={product.id} className={`relative transition-all hover:shadow-md ${pinnedProducts.includes(product.id) ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950' : ''}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-sm font-medium text-foreground line-clamp-1">
                        {product.name}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">{product.sku}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={() => togglePinProduct(product.id)}
                    >
                      {pinnedProducts.includes(product.id) ? 
                        <PinOff className="h-3 w-3 text-blue-600" /> : 
                        <Pin className="h-3 w-3 text-muted-foreground" />
                      }
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 pb-3">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-green-600">PKR {product.price}</span>
                      <Badge variant="outline" className="text-xs">
                        {product.stock} {product.unit}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Input
                        type="text"
                        placeholder="Qty"
                        value={quantityInputs[product.id] || ""}
                        onChange={(e) => handleQuantityInputChange(product.id, e.target.value)}
                        className="h-8 text-xs flex-1"
                      />
                      <Button 
                        size="sm" 
                        className="h-8 px-2"
                        onClick={() => addCustomQuantityToCart(product)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <Button 
                      size="sm" 
                      className="w-full h-7 text-xs"
                      onClick={() => addToCartWithCustomQuantity(product, 1)}
                    >
                      Add to Cart
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Cart Sidebar with Payment Method Selection */}
      <div className="w-80 bg-background border-l shadow-lg flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold text-foreground mb-4">Cart</h2>
          
          {/* Customer Selection */}
          <div className="space-y-3 mb-4">
            <Select 
              value={selectedCustomer?.id?.toString() || "walk-in"} 
              onValueChange={(value) => {
                if (value === "walk-in") {
                  setSelectedCustomer(null);
                } else {
                  const customer = customers.find(c => c.id.toString() === value);
                  setSelectedCustomer(customer || null);
                }
              }}
            >
              <SelectTrigger className="w-full h-9">
                <SelectValue placeholder="Select Customer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="walk-in">Walk-in Customer</SelectItem>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id.toString()}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full h-8"
              onClick={() => setIsQuickCustomerOpen(true)}
            >
              + Add New Customer
            </Button>
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-2 mb-4">
            <label className="text-sm font-medium text-foreground">Payment Method</label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger className="w-full h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="credit">Credit</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="card">Card</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Order Status */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Order Status</label>
            <Select value={orderStatus} onValueChange={setOrderStatus}>
              <SelectTrigger className="w-full h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-auto p-4">
          {cart.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              <p>No items in cart</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <Card key={item.productId} className="p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{item.name}</h4>
                      <p className="text-xs text-muted-foreground">{item.sku}</p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-6 w-6 p-0 text-red-500"
                      onClick={() => removeFromCart(item.productId)}
                    >
                      ×
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-6 w-6 p-0"
                        onClick={() => updateCartQuantity(item.productId, item.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-sm font-medium">{item.quantity} {item.unit}</span>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-6 w-6 p-0"
                        onClick={() => updateCartQuantity(item.productId, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <span className="font-bold text-green-600">PKR {(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Cart Total & Checkout */}
        {cart.length > 0 && (
          <div className="p-4 border-t bg-background">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>PKR {cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span className="text-green-600">PKR {cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}</span>
              </div>
            </div>
            
            <Button 
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              onClick={handleCheckout}
            >
              Complete Sale ({paymentMethod})
            </Button>
          </div>
        )}
      </div>

      {/* Today's Orders Modal */}
      <TodaysOrdersModal
        open={isTodaysOrdersOpen}
        onOpenChange={setIsTodaysOrdersOpen}
        orders={todaysOrders}
      />

      {/* Quick Customer Form */}
      <QuickCustomerForm
        open={isQuickCustomerOpen}
        onOpenChange={setIsQuickCustomerOpen}
        onCustomerCreated={(customer) => {
          setCustomers([...customers, customer]);
          setSelectedCustomer(customer);
        }}
      />
    </div>
  );
};

export default Sales;
