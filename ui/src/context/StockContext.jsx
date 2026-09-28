import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { stockService } from '../services/index.js';

const StockContext = createContext(null);

export function StockProvider({ children }) {
  const [fabrics, setFabrics] = useState([]);
  const [machinery, setMachinery] = useState([]);
  const [stockLog, setStockLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* ─── Fetch all stock data on mount ────────────────────── */
  const fetchStock = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch fabrics and machinery in parallel
      const [fabricData, machineryData, logsData] = await Promise.all([
        stockService.fabric.getAll(),
        stockService.machinery.getAll(),
        stockService.getLogs().catch(() => []), // Logs are optional
      ]);
      
      setFabrics(Array.isArray(fabricData) ? fabricData : []);
      setMachinery(Array.isArray(machineryData) ? machineryData : []);
      setStockLog(Array.isArray(logsData) ? logsData : []);
    } catch (err) {
      console.error('Error fetching stock:', err);
      setError(err.message);
      setFabrics([]);
      setMachinery([]);
      setStockLog([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStock();
  }, [fetchStock]);

  const createFabricItem = useCallback(async (data) => {
    try {
      const newFabric = await stockService.fabric.create({
        name: data.name,
        pricePerMeter: parseFloat(data.pricePerMeter),
        purchasePrice:
          data.purchasePrice !== undefined && data.purchasePrice !== ''
            ? parseFloat(data.purchasePrice)
            : undefined,
        stock: parseFloat(data.stock || 0),
        supplier: data.supplier || '',
        supplierContact: data.supplierContact || '',
        notes: data.notes || '',
        warningQuantity:
          data.warningQuantity !== undefined && data.warningQuantity !== ''
            ? parseFloat(data.warningQuantity)
            : undefined,
      });
      setFabrics(prev => [newFabric, ...prev]);
      return newFabric;
    } catch (err) {
      console.error('Error creating fabric item:', err);
      throw err;
    }
  }, []);

  const createMachineryItem = useCallback(async (data) => {
    try {
      const newMachinery = await stockService.machinery.create({
        name: data.name,
        unitPrice: parseFloat(data.unitPrice),
        purchasePrice:
          data.purchasePrice !== undefined && data.purchasePrice !== ''
            ? parseFloat(data.purchasePrice)
            : undefined,
        stock: parseFloat(data.stock || 0),
        supplier: data.supplier || '',
        supplierContact: data.supplierContact || '',
        notes: data.notes || '',
        warningQuantity:
          data.warningQuantity !== undefined && data.warningQuantity !== ''
            ? parseFloat(data.warningQuantity)
            : undefined,
      });
      setMachinery(prev => [newMachinery, ...prev]);
      return newMachinery;
    } catch (err) {
      console.error('Error creating machinery item:', err);
      throw err;
    }
  }, []);

  /* ── Add fabric stock ───────────────────────────────────── */
  const addFabricStock = useCallback(async (entry) => {
    try {
      if (entry.fabricId) {
        const result = await stockService.fabric.purchaseStock(entry);
        try {
          await fetchStock();
        } catch (fetchErr) {
          console.error('Stock refresh after purchase:', fetchErr);
        }
        return result;
      }

      const fabricData = {
        name: entry.name,
        pricePerMeter: parseFloat(entry.pricePerMeter),
        stock: parseFloat(entry.stock || entry.quantity),
        supplier: entry.supplier || '',
        supplierContact: entry.supplierContact || '',
        notes: entry.notes || '',
      };

      const newFabric = await stockService.fabric.create(fabricData);
      setFabrics(prev => [newFabric, ...prev]);

      return newFabric;
    } catch (err) {
      console.error('Error adding fabric stock:', err);
      throw err;
    }
  }, [fetchStock]);

  /* ── Add machinery stock ────────────────────────────────── */
  const addMachineryStock = useCallback(async (entry) => {
    try {
      if (entry.machineryId) {
        const result = await stockService.machinery.purchaseStock(entry);
        try {
          await fetchStock();
        } catch (fetchErr) {
          console.error('Stock refresh after purchase:', fetchErr);
        }
        return result;
      }

      const machineryData = {
        name: entry.name,
        unitPrice: parseFloat(entry.unitPrice),
        stock: parseFloat(entry.stock || entry.quantity),
        supplier: entry.supplier || '',
        supplierContact: entry.supplierContact || '',
        notes: entry.notes || '',
      };

      const newMachinery = await stockService.machinery.create(machineryData);
      setMachinery(prev => [newMachinery, ...prev]);

      return newMachinery;
    } catch (err) {
      console.error('Error adding machinery stock:', err);
      throw err;
    }
  }, [fetchStock]);

  /* ── Update fabric ──────────────────────────────────────── */
  const updateFabric = useCallback(async (id, updates) => {
    try {
      const updateData = {
        name: updates.name,
        pricePerMeter: parseFloat(updates.pricePerMeter),
        stock: parseFloat(updates.stock),
        supplier: updates.supplier || '',
        supplierContact: updates.supplierContact || '',
        notes: updates.notes || '',
        warningQuantity:
          updates.warningQuantity !== undefined && updates.warningQuantity !== ''
            ? parseFloat(updates.warningQuantity)
            : undefined,
      };
      
      const updatedFabric = await stockService.fabric.update(id, updateData);
      setFabrics(prev => prev.map(f => f.id === id ? updatedFabric : f));
      
      return updatedFabric;
    } catch (err) {
      console.error('Error updating fabric:', err);
      throw err;
    }
  }, []);

  /* ── Update machinery ───────────────────────────────────── */
  const updateMachinery = useCallback(async (id, updates) => {
    try {
      const updateData = {
        name: updates.name,
        unitPrice: parseFloat(updates.unitPrice),
        stock: parseFloat(updates.stock),
        supplier: updates.supplier || '',
        supplierContact: updates.supplierContact || '',
        notes: updates.notes || '',
        warningQuantity:
          updates.warningQuantity !== undefined && updates.warningQuantity !== ''
            ? parseFloat(updates.warningQuantity)
            : undefined,
      };
      
      const updatedMachinery = await stockService.machinery.update(id, updateData);
      setMachinery(prev => prev.map(m => m.id === id ? updatedMachinery : m));
      
      return updatedMachinery;
    } catch (err) {
      console.error('Error updating machinery:', err);
      throw err;
    }
  }, []);

  /* ── Delete fabric ──────────────────────────────────────── */
  const deleteFabric = useCallback(async (id) => {
    try {
      await stockService.fabric.delete(id);
      setFabrics(prev => prev.filter(f => f.id !== id));
    } catch (err) {
      console.error('Error deleting fabric:', err);
      throw err;
    }
  }, []);

  /* ── Delete machinery ───────────────────────────────────── */
  const deleteMachinery = useCallback(async (id) => {
    try {
      await stockService.machinery.delete(id);
      setMachinery(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      console.error('Error deleting machinery:', err);
      throw err;
    }
  }, []);

  return (
    <StockContext.Provider value={{
      fabrics, 
      machinery, 
      stockLog,
      loading,
      error,
      addFabricStock, 
      addMachineryStock,
      createFabricItem,
      createMachineryItem,
      updateFabric, 
      updateMachinery,
      deleteFabric, 
      deleteMachinery,
      refreshStock: fetchStock,
    }}>
      {children}
    </StockContext.Provider>
  );
}

export function useStock() {
  const ctx = useContext(StockContext);
  if (!ctx) throw new Error('useStock must be used inside StockProvider');
  return ctx;
}
