import React, { useState, useEffect } from 'react';
import { Package, Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { supabase, Product } from '../../lib/supabase';
import { useToast } from '../Toast';
import { playSuccessSound, playErrorSound } from '../../lib/sounds';

export function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const { showToast, ToastComponent } = useToast();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name');

    if (!error && data) {
      setProducts(data);
    }
    setLoading(false);
  };

  const startCreate = () => {
    setEditingProduct({
      name: '',
      description: '',
      price: 0,
      cost: 0,
      stock: 0,
      image_url: '',
      is_active: true
    });
    setIsCreating(true);
  };

  const startEdit = (product: Product) => {
    setEditingProduct(product);
    setIsCreating(false);
  };

  const cancelEdit = () => {
    setEditingProduct(null);
    setIsCreating(false);
  };

  const saveProduct = async () => {
    if (!editingProduct) return;

    setLoading(true);

    try {
      if (isCreating) {
        const { error } = await supabase
          .from('products')
          .insert(editingProduct);

        if (error) throw error;
        playSuccessSound();
        showToast('Produit créé', 'success');
      } else {
        const { error } = await supabase
          .from('products')
          .update({
            ...editingProduct,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingProduct.id!);

        if (error) throw error;
        playSuccessSound();
        showToast('Produit mis à jour', 'success');
      }

      cancelEdit();
      loadProducts();
    } catch (error) {
      playErrorSound();
      showToast('Erreur lors de la sauvegarde', 'error');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      playSuccessSound();
      showToast('Produit supprimé', 'success');
      loadProducts();
    } catch (error) {
      playErrorSound();
      showToast('Erreur lors de la suppression', 'error');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && products.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff6a2b]"></div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto space-y-6">
      {ToastComponent}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package className="w-8 h-8 text-[#ff6a2b]" />
          <h2 className="text-3xl font-bold text-white">Gestion des Produits</h2>
        </div>
        <button
          onClick={startCreate}
          className="bg-gradient-to-r from-[#ff6a2b] to-[#ff8c4f] text-white py-2 px-4 rounded-xl font-semibold hover:shadow-lg hover:shadow-[#ff6a2b]/50 transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nouveau Produit
        </button>
      </div>

      {editingProduct && (
        <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10">
          <h3 className="text-xl font-bold text-white mb-4">
            {isCreating ? 'Créer un produit' : 'Modifier le produit'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Nom</label>
              <input
                type="text"
                value={editingProduct.name || ''}
                onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Prix de vente</label>
              <input
                type="number"
                value={editingProduct.price || 0}
                onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Coût</label>
              <input
                type="number"
                value={editingProduct.cost || 0}
                onChange={(e) => setEditingProduct({ ...editingProduct, cost: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Stock</label>
              <input
                type="number"
                value={editingProduct.stock || 0}
                onChange={(e) => setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value) })}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">URL de l'image</label>
              <input
                type="text"
                value={editingProduct.image_url || ''}
                onChange={(e) => setEditingProduct({ ...editingProduct, image_url: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
              <textarea
                value={editingProduct.description || ''}
                onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white"
                rows={3}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editingProduct.is_active}
                onChange={(e) => setEditingProduct({ ...editingProduct, is_active: e.target.checked })}
                className="w-5 h-5 rounded"
              />
              <label className="text-sm font-medium text-gray-300">Actif</label>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={saveProduct}
              disabled={loading}
              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2 px-4 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              Enregistrer
            </button>
            <button
              onClick={cancelEdit}
              className="bg-white/5 text-white py-2 px-4 rounded-xl font-semibold hover:bg-white/10 transition-all flex items-center gap-2"
            >
              <X className="w-5 h-5" />
              Annuler
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map(product => (
          <div
            key={product.id}
            className="backdrop-blur-xl bg-white/5 rounded-2xl p-4 border border-white/10 hover:border-white/20 transition-all"
          >
            <div className="aspect-square rounded-xl overflow-hidden mb-3 bg-white/5">
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            <h3 className="font-semibold text-white mb-2">{product.name}</h3>
            <div className="space-y-1 text-sm mb-3">
              <p className="text-gray-400">
                Prix: <span className="text-[#ff6a2b] font-bold">{product.price.toFixed(2)}$</span>
              </p>
              <p className="text-gray-400">
                Stock: <span className="text-white font-bold">{product.stock}</span>
              </p>
              <p className="text-gray-400">
                Statut: <span className={product.is_active ? 'text-green-400' : 'text-red-400'}>
                  {product.is_active ? 'Actif' : 'Inactif'}
                </span>
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => startEdit(product)}
                className="flex-1 bg-blue-500/20 text-blue-400 py-2 px-3 rounded-xl font-semibold hover:bg-blue-500/30 transition-all flex items-center justify-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Modifier
              </button>
              <button
                onClick={() => deleteProduct(product.id)}
                className="bg-red-500/20 text-red-400 py-2 px-3 rounded-xl font-semibold hover:bg-red-500/30 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
