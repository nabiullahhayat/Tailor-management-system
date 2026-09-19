import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { customerService } from '../services/index.js';

const CustomerContext = createContext(null);

/** Optional fields always available on Add Customer (not configured in Adds). */
export const CUSTOMER_OPTIONAL_MEASUREMENT_KEYS = [];

export const EMPTY_MEASUREMENTS = {};

export function CustomerProvider({ children }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* ─── Fetch all customers on mount ─────────────────────── */
  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await customerService.getAll();
      
      // Transform API data to match UI expectations
      const transformedCustomers = (Array.isArray(data) ? data : []).map(customer => ({
        ...customer,
        measurements: typeof customer.measurements === 'string'
          ? (() => { try { return JSON.parse(customer.measurements); } catch { return EMPTY_MEASUREMENTS; } })()
          : (customer.measurements || EMPTY_MEASUREMENTS),
      }));
      
      setCustomers(transformedCustomers);
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError(err.message);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  /* ─── add customer ─────────────────────────────────────── */
  const addCustomer = useCallback(
    async (name, phone, measurements = {}) => {
      try {
        const customerData = {
          name: name.trim(),
          phone: phone.trim(),
          measurements: JSON.stringify(measurements),
        };
        
        const newCustomer = await customerService.create(customerData);
        
        // Add to local state
        setCustomers((prev) => [newCustomer, ...prev]);
        return newCustomer;
      } catch (err) {
        console.error('Error adding customer:', err);
        throw err;
      }
    },
    []
  );

  /* ─── update customer ──────────────────────────────────── */
  const updateCustomer = useCallback(async (id, name, phone, measurements) => {
    try {
      const updateData = {
        name: name.trim(),
        phone: phone.trim(),
      };
      
      if (measurements !== undefined) {
        updateData.measurements = JSON.stringify(measurements);
      }
      
      const updatedCustomer = await customerService.update(id, updateData);
      
      // Update local state
      setCustomers((prev) =>
        prev.map((c) => (c.id === id ? updatedCustomer : c))
      );
      
      return updatedCustomer;
    } catch (err) {
      console.error('Error updating customer:', err);
      throw err;
    }
  }, []);

  /* ─── delete customer ──────────────────────────────────── */
  const adjustCreditBalance = useCallback(async (id, delta) => {
    try {
      const updated = await customerService.adjustCreditBalance(id, delta);
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                ...updated,
                measurements:
                  typeof updated.measurements === 'object'
                    ? updated.measurements
                    : c.measurements,
              }
            : c,
        ),
      );
      return updated;
    } catch (err) {
      console.error('Error adjusting customer credit:', err);
      throw err;
    }
  }, []);

  const deleteCustomer = useCallback(async (id) => {
    try {
      await customerService.delete(id);
      
      // Remove from local state
      setCustomers((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error('Error deleting customer:', err);
      throw err;
    }
  }, []);

  return (
    <CustomerContext.Provider
      value={{ 
        customers, 
        loading, 
        error, 
        addCustomer, 
        updateCustomer, 
        deleteCustomer,
        adjustCreditBalance,
        refreshCustomers: fetchCustomers,
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
}

export function useCustomers() {
  const ctx = useContext(CustomerContext);
  if (!ctx) throw new Error('useCustomers must be used inside CustomerProvider');
  return ctx;
}
