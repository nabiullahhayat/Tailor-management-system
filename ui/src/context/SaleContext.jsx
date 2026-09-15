import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { saleService } from '../services/index.js';

const SaleContext = createContext(null);

export function SaleProvider({ children }) {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* ─── Fetch all sales on mount ─────────────────────────── */
  const fetchSales = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await saleService.getAll();
      
      // Transform API data to match UI expectations
      const transformedSales = (Array.isArray(data) ? data : []).map(sale => ({
        ...sale,
        date: sale.saleDate ? new Date(sale.saleDate).toISOString().split('T')[0] : '',
      }));
      
      setSales(transformedSales);
    } catch (err) {
      console.error('Error fetching sales:', err);
      setError(err.message);
      setSales([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  /* ─── add sale ──────────────────────────────────────────── */
  const addSale = useCallback(async (data) => {
    try {
      const saleData = {
        customerId: data.customerId || null,
        salesCustomerId: data.salesCustomerId || null,
        customerName: data.customerName,
        saleType: data.saleType,
        productName: data.productName,
        fabricId: data.fabricId || null,
        machineryId: data.machineryId || null,
        meters: data.meters ? parseFloat(data.meters) : null,
        quantity: data.quantity ? parseFloat(data.quantity) : null,
        unitPrice: parseFloat(data.unitPrice),
        totalAmount: parseFloat(data.totalAmount),
        paymentStatus: data.paymentStatus || 'Pending',
        paidAmount: data.paidAmount ? parseFloat(data.paidAmount) : 0,
        notes: data.notes || '',
      };
      
      const newSale = await saleService.create({
        ...saleData,
        paidAmount: 0,
        paymentStatus: 'Pending',
      });

      let finalSale = newSale;
      const payAmount = parseFloat(saleData.paidAmount || 0);
      const totalAmount = parseFloat(saleData.totalAmount || 0);
      if (payAmount > 0) {
        finalSale = await saleService.recordPayment(newSale.id, {
          paidAmount: payAmount,
          markPaid: payAmount >= totalAmount && totalAmount > 0,
        });
      } else if (saleData.paymentStatus === 'Paid' && totalAmount > 0) {
        finalSale = await saleService.recordPayment(newSale.id, {
          paidAmount: totalAmount,
          markPaid: true,
        });
      }

      const transformedSale = {
        ...finalSale,
        date: finalSale.saleDate ? new Date(finalSale.saleDate).toISOString().split('T')[0] : '',
      };

      setSales(prev => [transformedSale, ...prev]);
      return transformedSale;
    } catch (err) {
      console.error('Error adding sale:', err);
      throw err;
    }
  }, []);

  /* ─── update sale ───────────────────────────────────────── */
  const updateSale = useCallback(async (id, data) => {
    try {
      const updatedSale = await saleService.update(id, data);
      
      // Update local state
      setSales(prev => prev.map(s => s.id === id ? { ...updatedSale, ...s } : s));
      
      return updatedSale;
    } catch (err) {
      console.error('Error updating sale:', err);
      throw err;
    }
  }, []);

  /* ─── update payment status ─────────────────────────────── */
  const updatePaymentStatus = useCallback(async (id, paymentData) => {
    try {
      const updatedSale = await saleService.recordPayment(id, {
        paidAmount: paymentData.paidAmount ?? paymentData.totalAmount,
        markPaid: paymentData.paymentStatus === 'Paid',
      });

      const transformed = {
        ...updatedSale,
        date: updatedSale.saleDate
          ? new Date(updatedSale.saleDate).toISOString().split('T')[0]
          : '',
      };

      setSales(prev => prev.map(s => (s.id === id ? { ...s, ...transformed } : s)));
      return transformed;
    } catch (err) {
      console.error('Error updating payment status:', err);
      throw err;
    }
  }, []);

  /* ─── delete sale ───────────────────────────────────────── */
  const deleteSale = useCallback(async (id) => {
    try {
      await saleService.delete(id);
      
      // Remove from local state
      setSales(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      console.error('Error deleting sale:', err);
      throw err;
    }
  }, []);

  return (
    <SaleContext.Provider value={{ 
      sales, 
      loading, 
      error, 
      addSale,
      updateSale,
      updatePaymentStatus,
      deleteSale,
      refreshSales: fetchSales,
    }}>
      {children}
    </SaleContext.Provider>
  );
}

export function useSales() {
  const ctx = useContext(SaleContext);
  if (!ctx) throw new Error('useSales must be used inside SaleProvider');
  return ctx;
}
