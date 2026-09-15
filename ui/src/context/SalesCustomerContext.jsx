import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { salesCustomerService } from '../services/salesCustomerService.js';

const SalesCustomerContext = createContext(null);

export function SalesCustomerProvider({ children }) {
  const [salesCustomers, setSalesCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSalesCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await salesCustomerService.getAll();
      setSalesCustomers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching sales customers:', err);
      setSalesCustomers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSalesCustomers();
  }, [fetchSalesCustomers]);

  const addSalesCustomer = useCallback(async (name, phone = '') => {
    const created = await salesCustomerService.create({ name, phone });
    setSalesCustomers((prev) => [created, ...prev]);
    return created;
  }, []);

  const updateSalesCustomer = useCallback(async (id, name, phone) => {
    const updated = await salesCustomerService.update(id, { name, phone });
    setSalesCustomers((prev) => prev.map((c) => (c.id === id ? updated : c)));
    return updated;
  }, []);

  const deleteSalesCustomer = useCallback(async (id) => {
    await salesCustomerService.delete(id);
    setSalesCustomers((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const findOrCreateByName = useCallback(async (name) => {
    const customer = await salesCustomerService.findOrCreateByName(name);
    setSalesCustomers((prev) => {
      if (prev.some((c) => c.id === customer.id)) return prev;
      return [customer, ...prev];
    });
    return customer;
  }, []);

  const adjustCreditBalance = useCallback(async (id, delta) => {
    const updated = await salesCustomerService.adjustCreditBalance(id, delta);
    setSalesCustomers((prev) => prev.map((c) => (c.id === id ? updated : c)));
    return updated;
  }, []);

  return (
    <SalesCustomerContext.Provider
      value={{
        salesCustomers,
        loading,
        addSalesCustomer,
        updateSalesCustomer,
        deleteSalesCustomer,
        findOrCreateByName,
        adjustCreditBalance,
        refreshSalesCustomers: fetchSalesCustomers,
      }}
    >
      {children}
    </SalesCustomerContext.Provider>
  );
}

export function useSalesCustomers() {
  const ctx = useContext(SalesCustomerContext);
  if (!ctx) throw new Error('useSalesCustomers must be used inside SalesCustomerProvider');
  return ctx;
}
