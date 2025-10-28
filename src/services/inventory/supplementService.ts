import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../core/firebase';
import type { 
  Supplement, 
  CreateSupplementRequest,
  UpdateSupplementRequest,
  SupplementSale,
  CreateSupplementSaleRequest,
  SupplementStockHistory,
  CreateStockHistoryRequest,
  SupplementStats
} from '../../types/supplement';

// Helper to convert Firestore timestamp to Date
const convertTimestamp = (timestamp: Timestamp | Date | undefined): Date | undefined => {
  if (!timestamp) return undefined;
  if (timestamp instanceof Date) return timestamp;
  return timestamp.toDate();
};

// Helper to strip undefined values
const omitUndefined = <T extends Record<string, unknown>>(obj: T): Partial<T> => {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as Partial<T>;
};

// ============================================
// SUPPLEMENT CRUD OPERATIONS
// ============================================

export const createSupplement = async (request: CreateSupplementRequest): Promise<string> => {
  try {
    const supplementData = omitUndefined({
      ...request,
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    const docRef = await addDoc(collection(db, 'supplements'), supplementData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating supplement:', error);
    throw new Error('Failed to create supplement');
  }
};

export const getSupplement = async (id: string): Promise<Supplement | null> => {
  try {
    const docRef = doc(db, 'supplements', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        expiryDate: convertTimestamp(data.expiryDate),
        createdAt: convertTimestamp(data.createdAt) || new Date(),
        updatedAt: convertTimestamp(data.updatedAt) || new Date(),
      } as Supplement;
    }
    return null;
  } catch (error) {
    console.error('Error getting supplement:', error);
    throw new Error('Failed to get supplement');
  }
};

export const getAllSupplements = async (activeOnly: boolean = false): Promise<Supplement[]> => {
  try {
    let q = query(collection(db, 'supplements'), orderBy('name'));
    
    if (activeOnly) {
      q = query(collection(db, 'supplements'), where('isActive', '==', true), orderBy('name'));
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        expiryDate: convertTimestamp(data.expiryDate),
        createdAt: convertTimestamp(data.createdAt) || new Date(),
        updatedAt: convertTimestamp(data.updatedAt) || new Date(),
      } as Supplement;
    });
  } catch (error) {
    console.error('Error getting supplements:', error);
    return [];
  }
};

export const getSupplementsByCategory = async (category: string): Promise<Supplement[]> => {
  try {
    const q = query(
      collection(db, 'supplements'),
      where('category', '==', category),
      where('isActive', '==', true),
      orderBy('name')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        expiryDate: convertTimestamp(data.expiryDate),
        createdAt: convertTimestamp(data.createdAt) || new Date(),
        updatedAt: convertTimestamp(data.updatedAt) || new Date(),
      } as Supplement;
    });
  } catch (error) {
    console.error('Error getting supplements by category:', error);
    return [];
  }
};

export const getLowStockSupplements = async (): Promise<Supplement[]> => {
  try {
    const allSupplements = await getAllSupplements(true);
    return allSupplements.filter(
      supplement => supplement.stockQuantity <= supplement.reorderLevel
    );
  } catch (error) {
    console.error('Error getting low stock supplements:', error);
    return [];
  }
};

export const updateSupplement = async (id: string, updates: UpdateSupplementRequest): Promise<void> => {
  try {
    const docRef = doc(db, 'supplements', id);
    const cleanUpdates = omitUndefined({
      ...updates,
      updatedAt: serverTimestamp()
    });
    
    await updateDoc(docRef, cleanUpdates);
  } catch (error) {
    console.error('Error updating supplement:', error);
    throw new Error('Failed to update supplement');
  }
};

export const deleteSupplement = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, 'supplements', id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting supplement:', error);
    throw new Error('Failed to delete supplement');
  }
};

export const updateSupplementStock = async (
  id: string, 
  quantityChange: number,
  action: CreateStockHistoryRequest['action'],
  reason?: string,
  performedBy?: string,
  relatedSaleId?: string
): Promise<void> => {
  try {
    const supplement = await getSupplement(id);
    if (!supplement) throw new Error('Supplement not found');

    const newStock = supplement.stockQuantity + quantityChange;
    
    if (newStock < 0) {
      throw new Error('Insufficient stock');
    }

    // Update supplement stock
    await updateSupplement(id, { stockQuantity: newStock });

    // Create stock history record
    await createStockHistory({
      supplementId: id,
      action,
      quantityChange,
      previousStock: supplement.stockQuantity,
      newStock,
      reason,
      relatedSaleId
    }, performedBy || 'system');

  } catch (error) {
    console.error('Error updating supplement stock:', error);
    throw error;
  }
};

// ============================================
// SUPPLEMENT SALES OPERATIONS
// ============================================

export const createSupplementSale = async (
  request: CreateSupplementSaleRequest,
  soldBy: string,
  soldByName: string
): Promise<string> => {
  try {
    // Get supplement details
    const supplement = await getSupplement(request.supplementId);
    if (!supplement) throw new Error('Supplement not found');

    // Check stock availability
    if (supplement.stockQuantity < request.quantity) {
      throw new Error('Insufficient stock available');
    }

    // Calculate amounts
    const totalAmount = request.unitPrice * request.quantity;
    const discountApplied = request.discountApplied || 0;
    const finalAmount = totalAmount - discountApplied;

    const saleData = omitUndefined({
      supplementId: request.supplementId,
      supplementName: supplement.name,
      memberId: request.memberId,
      memberName: request.memberId ? 'Member' : undefined, // TODO: Get actual member name
      quantity: request.quantity,
      unitPrice: request.unitPrice,
      totalAmount,
      discountApplied,
      finalAmount,
      paymentMethod: request.paymentMethod,
      paymentStatus: request.paymentStatus || 'completed',
      soldBy,
      soldByName,
      notes: request.notes,
      saleDate: new Date(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Create sale record
    const docRef = await addDoc(collection(db, 'supplementSales'), saleData);

    // Update stock
    await updateSupplementStock(
      request.supplementId,
      -request.quantity,
      'sold',
      `Sale #${docRef.id}`,
      soldBy,
      docRef.id
    );

    return docRef.id;
  } catch (error) {
    console.error('Error creating supplement sale:', error);
    throw error;
  }
};

export const getSupplementSale = async (id: string): Promise<SupplementSale | null> => {
  try {
    const docRef = doc(db, 'supplementSales', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        saleDate: convertTimestamp(data.saleDate) || new Date(),
        createdAt: convertTimestamp(data.createdAt) || new Date(),
        updatedAt: convertTimestamp(data.updatedAt) || new Date(),
      } as SupplementSale;
    }
    return null;
  } catch (error) {
    console.error('Error getting supplement sale:', error);
    throw new Error('Failed to get supplement sale');
  }
};

export const getAllSupplementSales = async (limitCount: number = 100): Promise<SupplementSale[]> => {
  try {
    const q = query(
      collection(db, 'supplementSales'),
      orderBy('saleDate', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        saleDate: convertTimestamp(data.saleDate) || new Date(),
        createdAt: convertTimestamp(data.createdAt) || new Date(),
        updatedAt: convertTimestamp(data.updatedAt) || new Date(),
      } as SupplementSale;
    });
  } catch (error) {
    console.error('Error getting supplement sales:', error);
    return [];
  }
};

export const getSalesByMember = async (memberId: string): Promise<SupplementSale[]> => {
  try {
    const q = query(
      collection(db, 'supplementSales'),
      where('memberId', '==', memberId),
      orderBy('saleDate', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        saleDate: convertTimestamp(data.saleDate) || new Date(),
        createdAt: convertTimestamp(data.createdAt) || new Date(),
        updatedAt: convertTimestamp(data.updatedAt) || new Date(),
      } as SupplementSale;
    });
  } catch (error) {
    console.error('Error getting sales by member:', error);
    return [];
  }
};

// ============================================
// STOCK HISTORY OPERATIONS
// ============================================

export const createStockHistory = async (
  request: CreateStockHistoryRequest,
  performedBy: string,
  performedByName: string = 'System'
): Promise<string> => {
  try {
    const supplement = await getSupplement(request.supplementId);
    
    const historyData = {
      ...request,
      supplementName: supplement?.name || 'Unknown',
      performedBy,
      performedByName,
      createdAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'supplementStockHistory'), historyData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating stock history:', error);
    throw new Error('Failed to create stock history');
  }
};

export const getStockHistory = async (
  supplementId?: string,
  limitCount: number = 50
): Promise<SupplementStockHistory[]> => {
  try {
    let q;
    
    if (supplementId) {
      q = query(
        collection(db, 'supplementStockHistory'),
        where('supplementId', '==', supplementId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
    } else {
      q = query(
        collection(db, 'supplementStockHistory'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: convertTimestamp(data.createdAt) || new Date(),
      } as SupplementStockHistory;
    });
  } catch (error) {
    console.error('Error getting stock history:', error);
    return [];
  }
};

// ============================================
// STATISTICS & ANALYTICS
// ============================================

export const getSupplementStats = async (): Promise<SupplementStats> => {
  try {
    const [supplements, sales] = await Promise.all([
      getAllSupplements(true),
      getAllSupplementSales()
    ]);

    const totalProducts = supplements.length;
    const lowStockProducts = supplements.filter(
      s => s.stockQuantity <= s.reorderLevel && s.stockQuantity > 0
    ).length;
    const outOfStockProducts = supplements.filter(s => s.stockQuantity === 0).length;

    // Calculate revenue and profit
    const completedSales = sales.filter(s => s.paymentStatus === 'completed');
    const totalRevenue = completedSales.reduce((sum, sale) => sum + sale.finalAmount, 0);
    
    // Calculate profit (requires cost price tracking)
    let totalProfit = 0;
    for (const sale of completedSales) {
      const supplement = supplements.find(s => s.id === sale.supplementId);
      if (supplement) {
        const profit = (sale.unitPrice - supplement.costPrice) * sale.quantity - sale.discountApplied;
        totalProfit += profit;
      }
    }

    // Top selling products
    const salesByProduct = new Map<string, { name: string; category: string; quantity: number; revenue: number }>();
    
    for (const sale of completedSales) {
      const existing = salesByProduct.get(sale.supplementId);
      if (existing) {
        existing.quantity += sale.quantity;
        existing.revenue += sale.finalAmount;
      } else {
        const supplement = supplements.find(s => s.id === sale.supplementId);
        if (supplement) {
          salesByProduct.set(sale.supplementId, {
            name: supplement.name,
            category: supplement.category,
            quantity: sale.quantity,
            revenue: sale.finalAmount
          });
        }
      }
    }

    const topSellingProducts = Array.from(salesByProduct.entries())
      .map(([id, data]) => ({ 
        id, 
        name: data.name,
        category: data.category,
        quantitySold: data.quantity,
        revenue: data.revenue
      }))
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 5);

    // Category breakdown
    const categoryMap = new Map<string, { count: number; revenue: number }>();
    
    for (const supplement of supplements) {
      const existing = categoryMap.get(supplement.category);
      if (existing) {
        existing.count++;
      } else {
        categoryMap.set(supplement.category, { count: 1, revenue: 0 });
      }
    }

    for (const sale of completedSales) {
      const supplement = supplements.find(s => s.id === sale.supplementId);
      if (supplement) {
        const categoryData = categoryMap.get(supplement.category);
        if (categoryData) {
          categoryData.revenue += sale.finalAmount;
        }
      }
    }

    const categoryBreakdown = Array.from(categoryMap.entries())
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.revenue - a.revenue);

    // Recent sales (last 10)
    const recentSales = sales.slice(0, 10);

    return {
      totalProducts,
      lowStockProducts,
      outOfStockProducts,
      totalRevenue,
      totalProfit,
      topSellingProducts,
      recentSales,
      categoryBreakdown
    };
  } catch (error) {
    console.error('Error getting supplement stats:', error);
    throw new Error('Failed to get supplement statistics');
  }
};
