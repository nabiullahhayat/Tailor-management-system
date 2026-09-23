import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { orderService } from '../services/index.js';

const OrderContext = createContext(null);

export function OrderProvider({ children }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* ─── Fetch all orders on mount ────────────────────────── */
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await orderService.getAll();
      
      // Transform API data to match UI expectations
      const transformedOrders = (Array.isArray(data) ? data : []).map(order => ({
        ...order,
        date: order.orderDate ? new Date(order.orderDate).toISOString().split('T')[0] : '',
        deliveryDate: order.deliveryDate ? new Date(order.deliveryDate).toISOString().split('T')[0] : '',
        measurements: typeof order.measurements === 'string' 
          ? order.measurements 
          : JSON.stringify(order.measurements || {}),
      }));
      
      setOrders(transformedOrders);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err.message);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  /* ─── add order ─────────────────────────────────────────── */
  const addOrder = useCallback(async (data) => {
    try {
      const orderData = {
        customerId: data.customerId || null,
        customerName: data.customerName,
        orderType: data.orderType,
        orderTypeId: data.orderTypeId || null,
        measurements: data.measurements,
        color: data.color || '',
        pricePerOne: data.pricePerOne ? parseFloat(data.pricePerOne) : 0,
        quantity: data.quantity ? parseFloat(data.quantity) : 1,
        deliveryDate: data.deliveryDate,
        totalAmount: parseFloat(data.totalAmount),
        employeeId: data.employeeId || null,
        employeeName: data.employeeName || '',
        orderDateSolar: data.orderDateSolar || '',
        notes: data.notes || '',
        paymentStatus: data.paymentStatus || 'Pending',
        paidAmount: data.paidAmount ? parseFloat(data.paidAmount) : 0,
        bookingCashReceived: data.bookingCashReceived ? parseFloat(data.bookingCashReceived) : 0,
        bookingAppliedToDebt: data.bookingAppliedToDebt ? parseFloat(data.bookingAppliedToDebt) : 0,
        bookingPrepaidAdded: data.bookingPrepaidAdded ? parseFloat(data.bookingPrepaidAdded) : 0,
        orderLineItems: data.orderLineItems || [],
        customerFabricMeters: data.customerFabricMeters ?? '',
      };
      
      const newOrder = await orderService.create(orderData);
      
      // Add to local state with transformed dates
      const transformedOrder = {
        ...newOrder,
        date: newOrder.orderDate ? new Date(newOrder.orderDate).toISOString().split('T')[0] : '',
        deliveryDate: newOrder.deliveryDate ? new Date(newOrder.deliveryDate).toISOString().split('T')[0] : '',
      };
      
      setOrders(prev => [transformedOrder, ...prev]);
      return transformedOrder;
    } catch (err) {
      console.error('Error adding order:', err);
      throw err;
    }
  }, []);

  /* ─── update order status ───────────────────────────────── */
  const updateOrderStatus = useCallback(async (id, status) => {
    try {
      const updatedOrder = await orderService.updateStatus(id, status);
      setOrders((prev) =>
        prev.map((o) => {
          if (o.id !== id) return o;
          return {
            ...o,
            ...updatedOrder,
            status,
            date: o.date,
            deliveryDate: updatedOrder.deliveryDate
              ? new Date(updatedOrder.deliveryDate).toISOString().split('T')[0]
              : o.deliveryDate,
          };
        }),
      );
      return { ...updatedOrder, status };
    } catch (err) {
      console.error('Error updating order status:', err);
      throw err;
    }
  }, []);

  const recordOrderPayment = useCallback(async (id, { paymentAmount, paymentReceived = true, markDelivered = false }) => {
    try {
      const updatedOrder = await orderService.recordPayment(id, {
        paymentAmount,
        paymentReceived,
        markDelivered,
      });
      const transformed = {
        ...updatedOrder,
        date: updatedOrder.orderDate
          ? new Date(updatedOrder.orderDate).toISOString().split('T')[0]
          : '',
        deliveryDate: updatedOrder.deliveryDate
          ? new Date(updatedOrder.deliveryDate).toISOString().split('T')[0]
          : '',
      };
      setOrders(prev => prev.map(o => (o.id === id ? { ...o, ...transformed } : o)));
      return transformed;
    } catch (err) {
      console.error('Error recording order payment:', err);
      throw err;
    }
  }, []);

  /* ─── update order ──────────────────────────────────────── */
  const updateOrder = useCallback(async (id, data) => {
    try {
      const updatedOrder = await orderService.update(id, data);
      
      // Update local state
      setOrders(prev => prev.map(o => o.id === id ? { ...updatedOrder, ...o } : o));
      
      return updatedOrder;
    } catch (err) {
      console.error('Error updating order:', err);
      throw err;
    }
  }, []);

  /* ─── delete order ──────────────────────────────────────── */
  const deleteOrder = useCallback(async (id) => {
    try {
      await orderService.delete(id);
      
      // Remove from local state
      setOrders(prev => prev.filter(o => o.id !== id));
    } catch (err) {
      console.error('Error deleting order:', err);
      throw err;
    }
  }, []);

  return (
    <OrderContext.Provider value={{ 
      orders, 
      loading, 
      error, 
      addOrder, 
      updateOrderStatus,
      recordOrderPayment,
      updateOrder,
      deleteOrder,
      refreshOrders: fetchOrders,
    }}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error('useOrders must be used inside OrderProvider');
  return ctx;
}
