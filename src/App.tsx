import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './components/Login';
import { CashRegister } from './components/employee/CashRegister';
import { ClockInOut } from './components/employee/ClockInOut';
import { Dashboard } from './components/admin/Dashboard';
import { ProductManagement } from './components/admin/ProductManagement';
import { StaffManagement } from './components/admin/StaffManagement';
import {
  LayoutDashboard,
  ShoppingCart,
  Clock,
  Package,
  Users,
  LogOut,
  ChevronRight
} from 'lucide-react';

type Screen = 'dashboard' | 'cash-register' | 'clock' | 'products' | 'staff';

function AppContent() {
  const { user, logout } = useAuth();
  const [activeScreen, setActiveScreen] = useState<Screen>(
    user?.role === 'admin' ? 'dashboard' : 'cash-register'
  );

  if (!user) {
    return <Login />;
  }

  const employeeMenuItems = [
    { id: 'cash-register' as Screen, label: 'Caisse', icon: ShoppingCart },
    { id: 'clock' as Screen, label: 'Pointeuse', icon: Clock },
  ];

  const adminMenuItems = [
    { id: 'dashboard' as Screen, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'cash-register' as Screen, label: 'Caisse', icon: ShoppingCart },
    { id: 'clock' as Screen, label: 'Pointeuse', icon: Clock },
    { id: 'products' as Screen, label: 'Produits', icon: Package },
    { id: 'staff' as Screen, label: 'Personnel', icon: Users },
  ];

  const menuItems = user.role === 'admin' ? adminMenuItems : employeeMenuItems;

  const renderScreen = () => {
    switch (activeScreen) {
      case 'dashboard':
        return user.role === 'admin' ? <Dashboard /> : <CashRegister />;
      case 'cash-register':
        return <CashRegister />;
      case 'clock':
        return <ClockInOut />;
      case 'products':
        return user.role === 'admin' ? <ProductManagement /> : <CashRegister />;
      case 'staff':
        return user.role === 'admin' ? <StaffManagement /> : <CashRegister />;
      default:
        return <CashRegister />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f1115] via-[#1a1d24] to-[#0f1115] flex">
      <div className="w-64 backdrop-blur-xl bg-white/5 border-r border-white/10 flex flex-col">
        <div className="p-6 border-b border-white/10">
          <h1 className="text-2xl font-bold text-white mb-1">Hen House</h1>
          <p className="text-sm text-gray-400">Ultimate Edition</p>
        </div>

        <div className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeScreen === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveScreen(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-[#ff6a2b] to-[#ff8c4f] text-white shadow-lg shadow-[#ff6a2b]/30'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-5 h-5" />}
              </button>
            );
          })}
        </div>

        <div className="p-4 border-t border-white/10">
          <div className="bg-white/5 rounded-xl p-4 mb-4">
            <p className="text-sm text-gray-400 mb-1">Connecté en tant que</p>
            <p className="text-white font-semibold">{user.full_name}</p>
            <p className="text-xs text-gray-400">
              {user.role === 'admin' ? 'Administrateur' : 'Employé'}
            </p>
          </div>
          <button
            onClick={logout}
            className="w-full bg-white/5 hover:bg-white/10 text-white py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
          >
            <LogOut className="w-5 h-5" />
            Déconnexion
          </button>
        </div>
      </div>

      <div className="flex-1 p-8">
        {renderScreen()}
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
