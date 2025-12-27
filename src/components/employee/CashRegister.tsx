import React, { useState, useEffect } from 'react';
import { ShoppingCart, Trash2, Plus, Minus, DollarSign, CreditCard, Banknote } from 'lucide-react';
import { supabase, Product } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../Toast';
import { playAddToCartSound, playCashRegisterSound, playErrorSound } from '../../lib/sounds';
import { notifySale, notifyLowStock } from '../../lib/discord';

interface CartItem {
  product: Product;
  quantity: number;
}

export function CashRegister() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { showToast, ToastComponent } = useToast();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (!error && data) {
      setProducts(data);
    }
    setLoading(false);
  };

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      playErrorSound();
      showToast('Stock insuffisant', 'error');
      return;
    }

    const existingItem = cart.find(item => item.product.id === product.id);

    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        playErrorSound();
        showToast('Stock insuffisant', 'error');
        return;
      }
      setCart(cart.map(item =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }

    playAddToCartSound();
  };

  const updateQuantity = (productId: string, delta: number) => {
    const item = cart.find(i => i.product.id === productId);
    if (!item) return;

    const newQuantity = item.quantity + delta;

    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    if (newQuantity > item.product.stock) {
      playErrorSound();
      showToast('Stock insuffisant', 'error');
      return;
    }

    setCart(cart.map(item =>
      item.product.id === productId
        ? { ...item, quantity: newQuantity }
        : item
    ));

    if (delta > 0) {
      playAddToCartSound();
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  };

  const completeSale = async (paymentMethod: 'cash' | 'card' | 'banking') => {
    if (cart.length === 0) {
      playErrorSound();
      showToast('Le panier est vide', 'error');
      return;
    }

    setLoading(true);

    try {
      const total = calculateTotal();

      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert({
          user_id: user!.id,
          total,
          status: 'completed',
          payment_method: paymentMethod
        })
        .select()
        .single();

      if (saleError) throw saleError;

      const saleItems = cart.map(item => ({
        sale_id: sale.id,
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.product.price,
        subtotal: item.product.price * item.quantity
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems);

      if (itemsError) throw itemsError;

      for (const item of cart) {
        const newStock = item.product.stock - item.quantity;
        await supabase
          .from('products')
          .update({ stock: newStock })
          .eq('id', item.product.id);

        if (newStock <= 10) {
          notifyLowStock(item.product.name, newStock);
        }
      }

      const paymentLabels = { cash: 'Espèces', card: 'Carte', banking: 'Banque' };
      notifySale(user!.full_name, total, paymentLabels[paymentMethod]);

      playCashRegisterSound();
      showToast(`Vente complétée: ${total.toFixed(2)}$`, 'success');
      setCart([]);
      loadProducts();
    } catch (error) {
      playErrorSound();
      showToast('Erreur lors de la vente', 'error');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff6a2b]"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex gap-6">
      {ToastComponent}

      <div className="flex-1 overflow-hidden flex flex-col">
        <h2 className="text-2xl font-bold text-white mb-4">Produits</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pr-2">
          {products.map(product => (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              disabled={product.stock <= 0}
              className="group relative backdrop-blur-xl bg-white/5 rounded-2xl p-4 border border-white/10 hover:border-[#ff6a2b] transition-all hover:shadow-lg hover:shadow-[#ff6a2b]/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="aspect-square rounded-xl overflow-hidden mb-3 bg-white/5">
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="font-semibold text-white mb-1">{product.name}</h3>
              <p className="text-2xl font-bold text-[#ff6a2b] mb-1">
                {product.price.toFixed(2)}$
              </p>
              <p className="text-sm text-gray-400">
                Stock: {product.stock}
              </p>
              {product.stock <= 0 && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <span className="text-white font-bold">Rupture</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="w-96 backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10 flex flex-col">
        <div className="flex items-center gap-3 mb-6">
          <ShoppingCart className="w-6 h-6 text-[#ff6a2b]" />
          <h2 className="text-2xl font-bold text-white">Panier</h2>
        </div>

        <div className="flex-1 overflow-y-auto mb-6 space-y-3">
          {cart.length === 0 ? (
            <div className="text-center text-gray-400 py-12">
              Panier vide
            </div>
          ) : (
            cart.map(item => (
              <div key={item.product.id} className="bg-white/5 rounded-xl p-3 border border-white/10">
                <div className="flex items-start gap-3 mb-2">
                  <img
                    src={item.product.image_url}
                    alt={item.product.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">{item.product.name}</h3>
                    <p className="text-[#ff6a2b] font-bold">
                      {item.product.price.toFixed(2)}$
                    </p>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.product.id, -1)}
                      className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-12 text-center text-white font-bold">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, 1)}
                      className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-white font-bold">
                    {(item.product.price * item.quantity).toFixed(2)}$
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-white/10 pt-4 space-y-4">
          <div className="flex justify-between items-center text-2xl font-bold">
            <span className="text-gray-300">Total</span>
            <span className="text-[#ff6a2b]">{calculateTotal().toFixed(2)}$</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => completeSale('cash')}
              disabled={cart.length === 0 || loading}
              className="flex flex-col items-center gap-2 bg-gradient-to-br from-green-500 to-emerald-600 text-white py-3 px-4 rounded-xl font-semibold hover:shadow-lg hover:shadow-green-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <DollarSign className="w-6 h-6" />
              <span className="text-xs">Cash</span>
            </button>
            <button
              onClick={() => completeSale('card')}
              disabled={cart.length === 0 || loading}
              className="flex flex-col items-center gap-2 bg-gradient-to-br from-blue-500 to-indigo-600 text-white py-3 px-4 rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CreditCard className="w-6 h-6" />
              <span className="text-xs">Carte</span>
            </button>
            <button
              onClick={() => completeSale('banking')}
              disabled={cart.length === 0 || loading}
              className="flex flex-col items-center gap-2 bg-gradient-to-br from-purple-500 to-pink-600 text-white py-3 px-4 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Banknote className="w-6 h-6" />
              <span className="text-xs">Banque</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
