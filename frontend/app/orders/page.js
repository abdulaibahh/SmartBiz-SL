"use client";

import { useState, useEffect, useMemo } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ordersAPI, inventoryAPI } from "@/services/api";
import toast from "react-hot-toast";
import { 
  Package, 
  Plus, 
  Trash2, 
  CheckCircle, 
  Clock, 
  Truck, 
  DollarSign,
  Calendar,
  Phone,
  User,
  X,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Search
} from "lucide-react";


function OrdersContent() {
  const [orders, setOrders] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);
  
  // Form states
  const [supplierName, setSupplierName] = useState("");
  const [supplierContact, setSupplierContact] = useState("");
  const [expectedDelivery, setExpectedDelivery] = useState("");
  const [notes, setNotes] = useState("");
  const [orderItems, setOrderItems] = useState([{ product: "", quantity: 1, unitPrice: 0, productId: null }]);
  const [searchProduct, setSearchProduct] = useState("");
  const [activeItemIndex, setActiveItemIndex] = useState(null);
  
  // Payment form

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");

  useEffect(() => {
    fetchOrders();
    fetchInventory();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await ordersAPI.getAll();
      setOrders(res.data || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const fetchInventory = async () => {
    try {
      const res = await inventoryAPI.getAll();
      setInventory(res.data || []);
    } catch (error) {
      console.error("Error fetching inventory:", error);
    }
  };

  const handleAddItem = () => {
    setOrderItems([...orderItems, { product: "", quantity: 1, unitPrice: 0 }]);
  };

  const handleRemoveItem = (index) => {
    if (orderItems.length > 1) {
      setOrderItems(orderItems.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...orderItems];
    newItems[index][field] = value;
    setOrderItems(newItems);
  };

  const handleProductSelect = (index, product) => {
    const newItems = [...orderItems];
    newItems[index] = {
      ...newItems[index],
      product: product.product,
      productId: product.id,
      unitPrice: product.cost_price || product.selling_price || 0
    };
    setOrderItems(newItems);
    setSearchProduct("");
    setActiveItemIndex(null);
  };

  // Filter inventory based on search
  const filteredInventory = useMemo(() => {
    if (!searchProduct) return inventory;
    return inventory.filter(item => 
      item.product.toLowerCase().includes(searchProduct.toLowerCase())
    );
  }, [inventory, searchProduct]);


  const handleCreateOrder = async (e) => {
    e.preventDefault();
    
    if (!supplierName.trim()) {
      toast.error("Supplier name is required");
      return;
    }

    const validItems = orderItems.filter(item => item.product.trim() && item.quantity > 0);
    if (validItems.length === 0) {
      toast.error("At least one valid item is required");
      return;
    }

    try {
      await ordersAPI.create({
        supplier_name: supplierName,
        supplier_contact: supplierContact,
        expected_delivery_date: expectedDelivery,
        notes: notes,
        items: validItems.map(item => ({
          product: item.product,
          quantity: parseInt(item.quantity),
          unit_price: parseFloat(item.unitPrice)
        }))
      });

      toast.success("Order created successfully!");
      setShowCreateModal(false);
      resetForm();
      fetchOrders();
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error(error.response?.data?.message || "Failed to create order");
    }
  };

  const handleReceiveOrder = async (order) => {
    try {
      await ordersAPI.receive(order.id);
      toast.success("Order received! Inventory stock increased.");
      fetchOrders();
      fetchInventory(); // Refresh inventory to show updated stock
    } catch (error) {
      console.error("Error receiving order:", error);
      toast.error(error.response?.data?.message || "Failed to receive order");
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!confirm("Are you sure you want to delete this order?")) return;

    try {
      await ordersAPI.delete(orderId);
      toast.success("Order deleted successfully");
      fetchOrders();
    } catch (error) {
      console.error("Error deleting order:", error);
      toast.error(error.response?.data?.message || "Failed to delete order");
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast.error("Valid payment amount is required");
      return;
    }

    try {
      await ordersAPI.recordPayment(selectedOrder.id, {
        amount: parseFloat(paymentAmount),
        payment_method: paymentMethod,
        reference_number: paymentReference,
        notes: paymentNotes
      });

      toast.success("Payment recorded successfully!");
      setShowPaymentModal(false);
      resetPaymentForm();
      
      // Refresh order details
      const res = await ordersAPI.getById(selectedOrder.id);
      setSelectedOrder(res.data);
    } catch (error) {
      console.error("Error recording payment:", error);
      toast.error(error.response?.data?.message || "Failed to record payment");
    }
  };

  const resetForm = () => {
    setSupplierName("");
    setSupplierContact("");
    setExpectedDelivery("");
    setNotes("");
    setOrderItems([{ product: "", quantity: 1, unitPrice: 0 }]);
  };

  const resetPaymentForm = () => {
    setPaymentAmount("");
    setPaymentMethod("cash");
    setPaymentReference("");
    setPaymentNotes("");
  };

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => {
      return sum + (parseFloat(item.quantity) * parseFloat(item.unitPrice || 0));
    }, 0);
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', day: 'numeric', year: 'numeric' 
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-SL', {
      style: 'currency',
      currency: 'SLE'
    }).format(amount || 0);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'received':
        return <CheckCircle size={18} className="text-emerald-400" />;
      case 'pending':
        return <Clock size={18} className="text-amber-400" />;
      default:
        return <Truck size={18} className="text-blue-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'received':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'pending':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Supplier Orders</h1>
          <p className="text-zinc-500">Manage orders from suppliers and track inventory</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-colors"
        >
          <Plus size={20} />
          New Order
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Clock className="text-amber-400" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {orders.filter(o => o.status === 'pending').length}
              </p>
              <p className="text-sm text-zinc-500">Pending Orders</p>
            </div>
          </div>
        </div>
        
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle className="text-emerald-400" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {orders.filter(o => o.status === 'received').length}
              </p>
              <p className="text-sm text-zinc-500">Received Orders</p>
            </div>
          </div>
        </div>
        
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <DollarSign className="text-blue-400" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(orders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0))}
              </p>
              <p className="text-sm text-zinc-500">Total Order Value</p>
            </div>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-zinc-800">
          <h2 className="text-lg font-semibold text-white">All Orders</h2>
        </div>
        
        {orders.length === 0 ? (
          <div className="p-8 text-center">
            <Package className="mx-auto h-12 w-12 text-zinc-600 mb-4" />
            <p className="text-zinc-500">No orders yet. Create your first supplier order!</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {orders.map((order) => (
              <div key={order.id} className="p-4 hover:bg-zinc-800/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-white">{order.supplier_name}</h3>
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-500">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {formatDate(order.created_at)}
                      </span>
                      {order.supplier_contact && (
                        <span className="flex items-center gap-1">
                          <Phone size={14} />
                          {order.supplier_contact}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Package size={14} />
                        {formatCurrency(order.total_amount)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {order.status === 'pending' && (
                      <button
                        onClick={() => handleReceiveOrder(order)}
                        className="p-2 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 transition-colors"
                        title="Receive Order"
                      >
                        <CheckCircle size={18} />
                      </button>
                    )}
                    
                    <button
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowDetailsModal(true);
                      }}
                      className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:bg-zinc-700 transition-colors"
                      title="View Details"
                    >
                      <ChevronDown size={18} />
                    </button>
                    
                    {order.status === 'pending' && (
                      <button
                        onClick={() => handleDeleteOrder(order.id)}
                        className="p-2 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-colors"
                        title="Delete Order"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Order Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Create New Order</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">
                    <User size={14} className="inline mr-1" />
                    Supplier Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-zinc-800/50 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    placeholder="Enter supplier name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">
                    <Phone size={14} className="inline mr-1" />
                    Contact Number
                  </label>
                  <input
                    type="text"
                    value={supplierContact}
                    onChange={(e) => setSupplierContact(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-zinc-800/50 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    placeholder="e.g., +232 76 123456"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  <Calendar size={14} className="inline mr-1" />
                  Expected Delivery Date
                </label>
                <input
                  type="date"
                  value={expectedDelivery}
                  onChange={(e) => setExpectedDelivery(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-800/50 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>

              {/* Order Items */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-zinc-400">
                    <Package size={14} className="inline mr-1" />
                    Order Items *
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    <Plus size={14} />
                    Add Item
                  </button>
                </div>
                
                <div className="space-y-3">
                  {orderItems.map((item, index) => (
                    <div key={index} className="flex gap-3 items-start">
                      <div className="flex-1 relative">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
                          <input
                            type="text"
                            placeholder="Search or enter product name..."
                            value={item.product}
                            onChange={(e) => {
                              handleItemChange(index, 'product', e.target.value);
                              setSearchProduct(e.target.value);
                              setActiveItemIndex(index);
                            }}
                            onFocus={() => {
                              setActiveItemIndex(index);
                              setSearchProduct(item.product);
                            }}
                            className="w-full pl-9 pr-3 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                          />
                        </div>
                        
                        {/* Product Dropdown */}
                        {activeItemIndex === index && searchProduct && filteredInventory.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 max-h-40 overflow-y-auto rounded-lg bg-zinc-800 border border-zinc-700 shadow-lg">
                            {filteredInventory.slice(0, 5).map(product => (
                              <button
                                key={product.id}
                                type="button"
                                onClick={() => handleProductSelect(index, product)}
                                className="w-full px-3 py-2 text-left hover:bg-zinc-700 text-white text-sm flex justify-between items-center"
                              >
                                <span>{product.product}</span>
                                <span className="text-zinc-500 text-xs">Stock: {product.quantity}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="w-24">
                        <input
                          type="number"
                          placeholder="Qty"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                        />
                      </div>
                      <div className="w-28">
                        <input
                          type="number"
                          placeholder="Price"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                        />
                      </div>
                      {orderItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="p-2 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="mt-3 p-3 rounded-lg bg-zinc-800/50 border border-zinc-700">
                  <p className="text-sm text-zinc-400">
                    Total: <span className="text-white font-semibold">{formatCurrency(calculateTotal())}</span>
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-800/50 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  placeholder="Any additional notes..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition-colors"
                >
                  Create Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {showDetailsModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Order Details</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/50">
                {getStatusIcon(selectedOrder.status)}
                <div>
                  <p className="font-medium text-white">{selectedOrder.supplier_name}</p>
                  <p className={`text-sm ${selectedOrder.status === 'received' ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {selectedOrder.status === 'received' ? 'Received' : 'Pending'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-zinc-500">Order Date</p>
                  <p className="text-white">{formatDate(selectedOrder.created_at)}</p>
                </div>
                <div>
                  <p className="text-zinc-500">Expected Delivery</p>
                  <p className="text-white">{formatDate(selectedOrder.expected_delivery_date)}</p>
                </div>
                {selectedOrder.supplier_contact && (
                  <div>
                    <p className="text-zinc-500">Contact</p>
                    <p className="text-white">{selectedOrder.supplier_contact}</p>
                  </div>
                )}
                <div>
                  <p className="text-zinc-500">Total Amount</p>
                  <p className="text-white font-semibold">{formatCurrency(selectedOrder.total_amount)}</p>
                </div>
              </div>

              {selectedOrder.notes && (
                <div className="p-3 rounded-xl bg-zinc-800/50">
                  <p className="text-sm text-zinc-500 mb-1">Notes</p>
                  <p className="text-sm text-white">{selectedOrder.notes}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                {selectedOrder.status === 'pending' && (
                  <>
                    <button
                      onClick={() => {
                        setShowDetailsModal(false);
                        handleReceiveOrder(selectedOrder);
                      }}
                      className="flex-1 py-3 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={18} />
                      Receive Order
                    </button>
                    <button
                      onClick={() => {
                        setShowDetailsModal(false);
                        setShowPaymentModal(true);
                      }}
                      className="flex-1 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-500 transition-colors flex items-center justify-center gap-2"
                    >
                      <CreditCard size={18} />
                      Record Payment
                    </button>
                  </>
                )}
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="flex-1 py-3 rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Record Payment</h2>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  <DollarSign size={14} className="inline mr-1" />
                  Payment Amount *
                </label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-800/50 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="Enter amount"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  <CreditCard size={14} className="inline mr-1" />
                  Payment Method *
                </label>
                <select
                  required
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-800/50 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="mobile_money">Mobile Money</option>
                  <option value="check">Check</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Reference Number
                </label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-800/50 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="Transaction ID, Check number, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Notes
                </label>
                <textarea
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-800/50 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="Additional payment notes..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 py-3 rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-500 transition-colors"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Orders() {
  return (
    <ProtectedRoute>
      <OrdersContent />
    </ProtectedRoute>
  );
}
