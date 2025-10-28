// Supplement Store Types

export interface Supplement {
  id: string;
  name: string;
  brand: string;
  category: 'protein' | 'pre-workout' | 'vitamins' | 'creatine' | 'bcaa' | 'fat-burner' | 'mass-gainer' | 'other';
  description: string;
  price: number;
  costPrice: number; // Purchase cost for profit calculation
  stockQuantity: number;
  unit: 'kg' | 'lbs' | 'pieces' | 'bottles' | 'sachets';
  reorderLevel: number; // Minimum stock level before reorder alert
  expiryDate?: Date;
  imageUrl?: string;
  barcode?: string;
  sku: string; // Stock Keeping Unit
  isActive: boolean;
  nutritionInfo?: {
    servingSize: string;
    servingsPerContainer: number;
    calories?: number;
    protein?: number;
    carbs?: number;
    fats?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSupplementRequest {
  name: string;
  brand: string;
  category: 'protein' | 'pre-workout' | 'vitamins' | 'creatine' | 'bcaa' | 'fat-burner' | 'mass-gainer' | 'other';
  description: string;
  price: number;
  costPrice: number;
  stockQuantity: number;
  unit: 'kg' | 'lbs' | 'pieces' | 'bottles' | 'sachets';
  reorderLevel: number;
  expiryDate?: Date;
  imageUrl?: string;
  barcode?: string;
  sku: string;
  nutritionInfo?: {
    servingSize: string;
    servingsPerContainer: number;
    calories?: number;
    protein?: number;
    carbs?: number;
    fats?: number;
  };
}

export interface UpdateSupplementRequest {
  name?: string;
  brand?: string;
  category?: 'protein' | 'pre-workout' | 'vitamins' | 'creatine' | 'bcaa' | 'fat-burner' | 'mass-gainer' | 'other';
  description?: string;
  price?: number;
  costPrice?: number;
  stockQuantity?: number;
  unit?: 'kg' | 'lbs' | 'pieces' | 'bottles' | 'sachets';
  reorderLevel?: number;
  expiryDate?: Date;
  imageUrl?: string;
  barcode?: string;
  sku?: string;
  isActive?: boolean;
  nutritionInfo?: {
    servingSize: string;
    servingsPerContainer: number;
    calories?: number;
    protein?: number;
    carbs?: number;
    fats?: number;
  };
}

export interface SupplementSale {
  id: string;
  supplementId: string;
  supplementName: string;
  memberId?: string; // Optional: not all sales are to members
  memberName?: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  discountApplied: number;
  finalAmount: number;
  paymentMethod: 'cash' | 'card' | 'upi' | 'online';
  paymentStatus: 'completed' | 'pending' | 'refunded';
  soldBy: string; // Admin/Staff user ID
  soldByName: string;
  notes?: string;
  saleDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSupplementSaleRequest {
  supplementId: string;
  memberId?: string;
  quantity: number;
  unitPrice: number;
  discountApplied?: number;
  paymentMethod: 'cash' | 'card' | 'upi' | 'online';
  paymentStatus?: 'completed' | 'pending' | 'refunded';
  notes?: string;
}

export interface SupplementStockHistory {
  id: string;
  supplementId: string;
  supplementName: string;
  action: 'added' | 'sold' | 'adjusted' | 'expired' | 'returned';
  quantityChange: number; // Positive for add, negative for sale/expiry
  previousStock: number;
  newStock: number;
  reason?: string;
  performedBy: string; // User ID
  performedByName: string;
  relatedSaleId?: string; // If action is 'sold'
  createdAt: Date;
}

export interface CreateStockHistoryRequest {
  supplementId: string;
  action: 'added' | 'sold' | 'adjusted' | 'expired' | 'returned';
  quantityChange: number;
  previousStock: number;
  newStock: number;
  reason?: string;
  relatedSaleId?: string;
}

export interface SupplementStats {
  totalProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  totalRevenue: number;
  totalProfit: number;
  topSellingProducts: Array<{
    id: string;
    name: string;
    category: string;
    quantitySold: number;
    revenue: number;
  }>;
  recentSales: SupplementSale[];
  categoryBreakdown: Array<{
    category: string;
    count: number;
    revenue: number;
  }>;
}
