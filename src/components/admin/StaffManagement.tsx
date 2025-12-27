import React, { useState, useEffect } from 'react';
import { Users, Clock } from 'lucide-react';
import { supabase, User, Shift } from '../../lib/supabase';

interface UserWithShifts extends User {
  totalHours?: number;
  currentShift?: Shift;
}

export function StaffManagement() {
  const [users, setUsers] = useState<UserWithShifts[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    const { data: usersData, error } = await supabase
      .from('users')
      .select('*')
      .order('full_name');

    if (error || !usersData) {
      setLoading(false);
      return;
    }

    const usersWithData = await Promise.all(
      usersData.map(async (user) => {
        const { data: shifts } = await supabase
          .from('shifts')
          .select('*')
          .eq('user_id', user.id)
          .not('end_time', 'is', null);

        const totalHours = shifts?.reduce((sum, shift) => sum + (shift.total_hours || 0), 0) || 0;

        const { data: currentShift } = await supabase
          .from('shifts')
          .select('*')
          .eq('user_id', user.id)
          .is('end_time', null)
          .maybeSingle();

        return {
          ...user,
          totalHours,
          currentShift: currentShift || undefined
        };
      })
    );

    setUsers(usersWithData);
    setLoading(false);
  };

  const formatDuration = (start: string) => {
    const startTime = new Date(start);
    const now = new Date();
    const hours = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    return hours.toFixed(2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff6a2b]"></div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto space-y-6">
      <div className="flex items-center gap-3">
        <Users className="w-8 h-8 text-[#ff6a2b]" />
        <h2 className="text-3xl font-bold text-white">Gestion du Personnel</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {users.map(user => (
          <div
            key={user.id}
            className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">{user.full_name}</h3>
                <p className="text-gray-400 text-sm">@{user.username}</p>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                user.role === 'admin'
                  ? 'bg-[#ff6a2b]/20 text-[#ff6a2b]'
                  : 'bg-blue-500/20 text-blue-400'
              }`}>
                {user.role === 'admin' ? 'Admin' : 'Employé'}
              </div>
            </div>

            {user.currentShift ? (
              <div className="bg-green-500/10 border border-green-500/50 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-green-400 font-semibold text-sm">En service</span>
                </div>
                <p className="text-white text-sm">
                  Depuis {formatDuration(user.currentShift.start_time)}h
                </p>
              </div>
            ) : (
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4">
                <span className="text-gray-400 text-sm">Hors service</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
              <div>
                <p className="text-gray-400 text-sm mb-1">Taux horaire</p>
                <p className="text-white font-bold">{user.hourly_rate.toFixed(2)}$/h</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Heures totales</p>
                <p className="text-white font-bold flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {user.totalHours?.toFixed(2)}h
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
