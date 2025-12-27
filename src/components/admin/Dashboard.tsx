import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, DollarSign, Package, Users } from 'lucide-react';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '../../lib/supabase';

interface DailySales {
  date: string;
  revenue: number;
}

interface TopProduct {
  name: string;
  quantity: number;
  revenue: number;
}

export function Dashboard() {
  const [dailySales, setDailySales] = useState<DailySales[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalSales: 0,
    lowStock: 0,
    activeEmployees: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    await Promise.all([
      loadDailySales(),
      loadTopProducts(),
      loadStats()
    ]);
    setLoading(false);
  };

  const loadDailySales = async () => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data } = await supabase
      .from('sales')
      .select('created_at, total')
      .eq('status', 'completed')
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at');

    if (data) {
      const salesByDay: { [key: string]: number } = {};

      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        salesByDay[dateStr] = 0;
      }

      data.forEach(sale => {
        const dateStr = sale.created_at.split('T')[0];
        salesByDay[dateStr] = (salesByDay[dateStr] || 0) + sale.total;
      });

      const chartData = Object.entries(salesByDay).map(([date, revenue]) => ({
        date: new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
        revenue: Number(revenue.toFixed(2))
      }));

      setDailySales(chartData);
    }
  };

  const loadTopProducts = async () => {
    const { data } = await supabase
      .from('sale_items')
      .select('product_id, quantity, subtotal, products(name)')
      .order('created_at', { ascending: false });

    if (data) {
      const productStats: { [key: string]: TopProduct } = {};

      data.forEach((item: any) => {
        const name = item.products?.name || 'Unknown';
        if (!productStats[name]) {
          productStats[name] = { name, quantity: 0, revenue: 0 };
        }
        productStats[name].quantity += item.quantity;
        productStats[name].revenue += item.subtotal;
      });

      const sorted = Object.values(productStats)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

      setTopProducts(sorted);
    }
  };

  const loadStats = async () => {
    const [salesData, productsData, usersData] = await Promise.all([
      supabase
        .from('sales')
        .select('total')
        .eq('status', 'completed'),
      supabase
        .from('products')
        .select('stock')
        .lte('stock', 10),
      supabase
        .from('users')
        .select('is_on_duty')
        .eq('is_on_duty', true)
    ]);

    const totalRevenue = salesData.data?.reduce((sum, sale) => sum + sale.total, 0) || 0;
    const totalSales = salesData.data?.length || 0;
    const lowStock = productsData.data?.length || 0;
    const activeEmployees = usersData.data?.length || 0;

    setStats({ totalRevenue, totalSales, lowStock, activeEmployees });
  };

  const COLORS = ['#ff6a2b', '#ff8c4f', '#ffa873', '#ffc497', '#ffe0bb'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff6a2b]"></div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="w-8 h-8 text-[#ff6a2b]" />
        <h2 className="text-3xl font-bold text-white">Dashboard Analytics</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="backdrop-blur-xl bg-gradient-to-br from-green-500/20 to-emerald-600/20 rounded-2xl p-6 border border-green-500/30">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-8 h-8 text-green-400" />
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <p className="text-gray-300 text-sm mb-1">Revenu Total</p>
          <p className="text-3xl font-bold text-white">{stats.totalRevenue.toFixed(2)}$</p>
        </div>

        <div className="backdrop-blur-xl bg-gradient-to-br from-blue-500/20 to-indigo-600/20 rounded-2xl p-6 border border-blue-500/30">
          <div className="flex items-center justify-between mb-2">
            <BarChart3 className="w-8 h-8 text-blue-400" />
          </div>
          <p className="text-gray-300 text-sm mb-1">Ventes Totales</p>
          <p className="text-3xl font-bold text-white">{stats.totalSales}</p>
        </div>

        <div className="backdrop-blur-xl bg-gradient-to-br from-orange-500/20 to-red-600/20 rounded-2xl p-6 border border-orange-500/30">
          <div className="flex items-center justify-between mb-2">
            <Package className="w-8 h-8 text-orange-400" />
          </div>
          <p className="text-gray-300 text-sm mb-1">Stock Faible</p>
          <p className="text-3xl font-bold text-white">{stats.lowStock}</p>
        </div>

        <div className="backdrop-blur-xl bg-gradient-to-br from-purple-500/20 to-pink-600/20 rounded-2xl p-6 border border-purple-500/30">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-8 h-8 text-purple-400" />
          </div>
          <p className="text-gray-300 text-sm mb-1">Employés en Service</p>
          <p className="text-3xl font-bold text-white">{stats.activeEmployees}</p>
        </div>
      </div>

      <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10">
        <h3 className="text-xl font-bold text-white mb-4">Chiffre d'Affaires (7 derniers jours)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dailySales}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis
              dataKey="date"
              stroke="rgba(255,255,255,0.5)"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="rgba(255,255,255,0.5)"
              style={{ fontSize: '12px' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(15, 17, 21, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                color: '#fff'
              }}
              formatter={(value: number) => [`${value.toFixed(2)}$`, 'Revenue']}
            />
            <Legend wrapperStyle={{ color: '#fff' }} />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#ff6a2b"
              strokeWidth={3}
              dot={{ fill: '#ff6a2b', r: 5 }}
              activeDot={{ r: 7 }}
              name="Revenu"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10">
        <h3 className="text-xl font-bold text-white mb-4">Top 5 Produits Vendus</h3>
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={topProducts}
                  dataKey="quantity"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => entry.name}
                >
                  {topProducts.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 17, 21, 0.9)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    color: '#fff'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex-1 space-y-2">
            {topProducts.map((product, index) => (
              <div
                key={product.name}
                className="bg-white/5 rounded-xl p-4 border border-white/10 flex items-center gap-4"
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index] }}
                ></div>
                <div className="flex-1">
                  <p className="text-white font-semibold">{product.name}</p>
                  <p className="text-sm text-gray-400">
                    {product.quantity} vendus • {product.revenue.toFixed(2)}$
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
