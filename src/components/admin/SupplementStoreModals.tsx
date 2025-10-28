import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { ShoppingCart, Plus, Edit, Trash2, Minus } from 'lucide-react';
import type { Supplement, CreateSupplementRequest, SupplementSale, CreateSupplementSaleRequest } from '../../types/supplement';

interface SupplementStoreModalsProps {
  // Main modal
  isOpen: boolean;
  onClose: () => void;
  supplements: Supplement[];
  sales: SupplementSale[];
  loading: boolean;
  onAdd: () => void;
  onEdit: (supplement: Supplement) => void;
  onDelete: (id: string) => void;
  onSell: (supplement: Supplement) => void;

  // Add modal
  isAddOpen: boolean;
  setIsAddOpen: (open: boolean) => void;
  addFormData: Partial<CreateSupplementRequest>;
  setAddFormData: (data: Partial<CreateSupplementRequest>) => void;
  onSubmitAdd: (e: React.FormEvent) => void;

  // Edit modal
  isEditOpen: boolean;
  setIsEditOpen: (open: boolean) => void;
  editFormData: Partial<CreateSupplementRequest>;
  setEditFormData: (data: Partial<CreateSupplementRequest>) => void;
  onSubmitEdit: (e: React.FormEvent) => void;

  // Sale modal
  isSaleOpen: boolean;
  setIsSaleOpen: (open: boolean) => void;
  selectedSupplement: Supplement | null;
  saleFormData: Partial<CreateSupplementSaleRequest>;
  setSaleFormData: (data: Partial<CreateSupplementSaleRequest>) => void;
  onSubmitSale: (e: React.FormEvent) => void;

  isSubmitting: boolean;
}

export const SupplementStoreModals: React.FC<SupplementStoreModalsProps> = ({
  isOpen,
  onClose,
  supplements,
  sales,
  loading,
  onAdd,
  onEdit,
  onDelete,
  onSell,
  isAddOpen,
  setIsAddOpen,
  addFormData,
  setAddFormData,
  onSubmitAdd,
  isEditOpen,
  setIsEditOpen,
  editFormData,
  setEditFormData,
  onSubmitEdit,
  isSaleOpen,
  setIsSaleOpen,
  selectedSupplement,
  saleFormData,
  setSaleFormData,
  onSubmitSale,
  isSubmitting
}) => {
  return (
    <>
      {/* Main Store Modal */}
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-gray-900/95 border-white/20 backdrop-blur-md max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
              <ShoppingCart className="w-6 h-6 text-pink-400" />
              Supplement Store Management
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              Manage supplements inventory, sales, and stock levels
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mr-3"></div>
              <p className="text-gray-300">Loading supplement data...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button onClick={onAdd} className="bg-pink-600 hover:bg-pink-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Supplement
                </Button>
              </div>

              {/* Supplements List */}
              <div className="space-y-4 border border-gray-700 rounded-lg p-4 bg-gray-800/30">
                <h3 className="text-lg font-semibold text-white">Products ({supplements.length})</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                  {supplements.length === 0 ? (
                    <p className="text-gray-400 text-center py-8 col-span-2">No supplements found</p>
                  ) : (
                    supplements.map((supplement) => (
                      <div
                        key={supplement.id}
                        className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg hover:border-gray-600 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h4 className="text-white font-medium">{supplement.name}</h4>
                            <p className="text-sm text-gray-400">{supplement.brand}</p>
                            <span className="inline-block mt-1 px-2 py-1 text-xs bg-pink-500/20 text-pink-400 rounded">
                              {supplement.category}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-white">₹{supplement.price}</div>
                            <div className="text-xs text-gray-400">Cost: ₹{supplement.costPrice}</div>
                          </div>
                        </div>
                        
                        <div className="mt-3 pt-3 border-t border-gray-700 flex items-center justify-between">
                          <div>
                            <div className={`text-sm font-medium ${
                              supplement.stockQuantity === 0 ? 'text-red-400' :
                              supplement.stockQuantity <= supplement.reorderLevel ? 'text-orange-400' :
                              'text-green-400'
                            }`}>
                              Stock: {supplement.stockQuantity} {supplement.unit}
                            </div>
                            {supplement.stockQuantity <= supplement.reorderLevel && supplement.stockQuantity > 0 && (
                              <div className="text-xs text-orange-400 mt-1">⚠️ Low stock!</div>
                            )}
                            {supplement.stockQuantity === 0 && (
                              <div className="text-xs text-red-400 mt-1">❌ Out of stock</div>
                            )}
                          </div>
                          
                          <div className="flex gap-2">
                            <button
                              onClick={() => onSell(supplement)}
                              disabled={supplement.stockQuantity === 0}
                              className="px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded hover:bg-green-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                              Sell
                            </button>
                            <button
                              onClick={() => onEdit(supplement)}
                              className="px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded hover:bg-blue-500/30 transition-colors text-sm"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onDelete(supplement.id)}
                              className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded hover:bg-red-500/30 transition-colors text-sm"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Recent Sales */}
              <div className="space-y-4 border border-gray-700 rounded-lg p-4 bg-gray-800/30">
                <h3 className="text-lg font-semibold text-white">Recent Sales ({sales.length})</h3>
                
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {sales.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">No sales recorded</p>
                  ) : (
                    sales.map((sale) => (
                      <div
                        key={sale.id}
                        className="flex items-center justify-between p-3 bg-gray-800/50 border border-gray-700 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="text-white font-medium">{sale.supplementName}</div>
                          <div className="text-sm text-gray-400">
                            Qty: {sale.quantity} • {new Date(sale.saleDate).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-medium">₹{sale.finalAmount}</div>
                          <div className="text-xs text-gray-400">{sale.paymentMethod}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" onClick={onClose} className="bg-gray-700 hover:bg-gray-600 text-white">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Supplement Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="bg-gray-900/95 border-white/20 backdrop-blur-md max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white">Add New Supplement</DialogTitle>
            <DialogDescription className="text-gray-300">
              Add a new product to your supplement inventory
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmitAdd} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Product Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={addFormData.name || ''}
                  onChange={(e) => setAddFormData({...addFormData, name: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none"
                  placeholder="Whey Protein"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Brand <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={addFormData.brand || ''}
                  onChange={(e) => setAddFormData({...addFormData, brand: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none"
                  placeholder="Optimum Nutrition"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Category <span className="text-red-400">*</span>
                </label>
                <select
                  required
                  value={addFormData.category || 'protein'}
                  onChange={(e) => setAddFormData({...addFormData, category: e.target.value as 'protein' | 'pre-workout' | 'vitamins' | 'creatine' | 'bcaa' | 'fat-burner' | 'mass-gainer' | 'other'})}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none"
                >
                  <option value="protein">Protein</option>
                  <option value="pre-workout">Pre-Workout</option>
                  <option value="vitamins">Vitamins</option>
                  <option value="creatine">Creatine</option>
                  <option value="bcaa">BCAA</option>
                  <option value="fat-burner">Fat Burner</option>
                  <option value="mass-gainer">Mass Gainer</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  SKU <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={addFormData.sku || ''}
                  onChange={(e) => setAddFormData({...addFormData, sku: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none"
                  placeholder="SUP-001"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={addFormData.description || ''}
                onChange={(e) => setAddFormData({...addFormData, description: e.target.value})}
                className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none"
                rows={3}
                placeholder="Product description..."
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Selling Price (₹) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={addFormData.price || ''}
                  onChange={(e) => setAddFormData({...addFormData, price: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Cost Price (₹) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={addFormData.costPrice || ''}
                  onChange={(e) => setAddFormData({...addFormData, costPrice: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Unit <span className="text-red-400">*</span>
                </label>
                <select
                  required
                  value={addFormData.unit || 'kg'}
                  onChange={(e) => setAddFormData({...addFormData, unit: e.target.value as 'kg' | 'lbs' | 'pieces' | 'bottles' | 'sachets'})}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none"
                >
                  <option value="kg">kg</option>
                  <option value="lbs">lbs</option>
                  <option value="pieces">Pieces</option>
                  <option value="bottles">Bottles</option>
                  <option value="sachets">Sachets</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Initial Stock <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={addFormData.stockQuantity || ''}
                  onChange={(e) => setAddFormData({...addFormData, stockQuantity: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Reorder Level <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={addFormData.reorderLevel || ''}
                  onChange={(e) => setAddFormData({...addFormData, reorderLevel: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="bg-gray-700 hover:bg-gray-600 text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-pink-600 hover:bg-pink-700 text-white"
              >
                {isSubmitting ? 'Adding...' : 'Add Supplement'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Supplement Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="bg-gray-900/95 border-white/20 backdrop-blur-md max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white">Edit Supplement</DialogTitle>
            <DialogDescription className="text-gray-300">
              Update product details and stock levels
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmitEdit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Product Name
                </label>
                <input
                  type="text"
                  value={editFormData.name || ''}
                  onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Price (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editFormData.price || ''}
                  onChange={(e) => setEditFormData({...editFormData, price: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Stock Quantity
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditFormData({
                      ...editFormData, 
                      stockQuantity: Math.max(0, (editFormData.stockQuantity || 0) - 1)
                    })}
                    className="px-3 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    min="0"
                    value={editFormData.stockQuantity || ''}
                    onChange={(e) => setEditFormData({...editFormData, stockQuantity: parseInt(e.target.value) || 0})}
                    className="flex-1 px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white text-center focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setEditFormData({
                      ...editFormData, 
                      stockQuantity: (editFormData.stockQuantity || 0) + 1
                    })}
                    className="px-3 py-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Reorder Level
                </label>
                <input
                  type="number"
                  min="0"
                  value={editFormData.reorderLevel || ''}
                  onChange={(e) => setEditFormData({...editFormData, reorderLevel: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="bg-gray-700 hover:bg-gray-600 text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-pink-600 hover:bg-pink-700 text-white"
              >
                {isSubmitting ? 'Updating...' : 'Update Supplement'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Sell Supplement Modal */}
      <Dialog open={isSaleOpen} onOpenChange={setIsSaleOpen}>
        <DialogContent className="bg-gray-900/95 border-white/20 backdrop-blur-md max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white">Record Sale</DialogTitle>
            <DialogDescription className="text-gray-300">
              {selectedSupplement && `Selling: ${selectedSupplement.name}`}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmitSale} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Quantity <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                required
                min="1"
                max={selectedSupplement?.stockQuantity || 1}
                value={saleFormData.quantity || 1}
                onChange={(e) => setSaleFormData({...saleFormData, quantity: parseInt(e.target.value)})}
                className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none"
              />
              {selectedSupplement && (
                <p className="text-xs text-gray-400 mt-1">
                  Available: {selectedSupplement.stockQuantity} {selectedSupplement.unit}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Unit Price (₹)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={saleFormData.unitPrice || selectedSupplement?.price || 0}
                onChange={(e) => setSaleFormData({...saleFormData, unitPrice: parseFloat(e.target.value)})}
                className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Discount (₹)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={saleFormData.discountApplied || 0}
                onChange={(e) => setSaleFormData({...saleFormData, discountApplied: parseFloat(e.target.value)})}
                className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Payment Method
              </label>
              <select
                value={saleFormData.paymentMethod || 'cash'}
                onChange={(e) => setSaleFormData({...saleFormData, paymentMethod: e.target.value as 'cash' | 'card' | 'upi' | 'online'})}
                className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none"
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="upi">UPI</option>
                <option value="online">Online</option>
              </select>
            </div>

            {saleFormData.quantity && saleFormData.unitPrice && (
              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <div className="text-sm text-gray-300 mb-1">Total Amount:</div>
                <div className="text-2xl font-bold text-green-400">
                  ₹{((saleFormData.quantity * saleFormData.unitPrice) - (saleFormData.discountApplied || 0)).toFixed(2)}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                onClick={() => setIsSaleOpen(false)}
                className="bg-gray-700 hover:bg-gray-600 text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isSubmitting ? 'Processing...' : 'Complete Sale'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
