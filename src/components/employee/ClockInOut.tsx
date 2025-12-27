import React, { useState, useEffect } from 'react';
import { Clock, PlayCircle, StopCircle, Calendar } from 'lucide-react';
import { supabase, Shift } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../Toast';
import { playSuccessSound } from '../../lib/sounds';
import { notifyClockIn, notifyClockOut } from '../../lib/discord';

export function ClockInOut() {
  const [currentShift, setCurrentShift] = useState<Shift | null>(null);
  const [recentShifts, setRecentShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { showToast, ToastComponent } = useToast();

  useEffect(() => {
    loadShifts();
  }, []);

  const loadShifts = async () => {
    const { data: activeShift } = await supabase
      .from('shifts')
      .select('*')
      .eq('user_id', user!.id)
      .is('end_time', null)
      .maybeSingle();

    if (activeShift) {
      setCurrentShift(activeShift);
    }

    const { data: shifts } = await supabase
      .from('shifts')
      .select('*')
      .eq('user_id', user!.id)
      .not('end_time', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10);

    if (shifts) {
      setRecentShifts(shifts);
    }

    setLoading(false);
  };

  const clockIn = async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('shifts')
        .insert({
          user_id: user!.id,
          start_time: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      await supabase
        .from('users')
        .update({ is_on_duty: true })
        .eq('id', user!.id);

      setCurrentShift(data);
      notifyClockIn(user!.full_name);
      playSuccessSound();
      showToast('Prise de service enregistrée', 'success');
    } catch (error) {
      showToast('Erreur lors de la prise de service', 'error');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const clockOut = async () => {
    if (!currentShift) return;

    setLoading(true);

    try {
      const endTime = new Date();
      const startTime = new Date(currentShift.start_time);
      const totalHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);

      const { error } = await supabase
        .from('shifts')
        .update({
          end_time: endTime.toISOString(),
          total_hours: totalHours
        })
        .eq('id', currentShift.id);

      if (error) throw error;

      await supabase
        .from('users')
        .update({ is_on_duty: false })
        .eq('id', user!.id);

      setCurrentShift(null);
      loadShifts();
      notifyClockOut(user!.full_name, totalHours);
      playSuccessSound();
      showToast(`Fin de service: ${totalHours.toFixed(2)}h travaillées`, 'success');
    } catch (error) {
      showToast('Erreur lors de la fin de service', 'error');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (start: string, end?: string) => {
    const startTime = new Date(start);
    const endTime = end ? new Date(end) : new Date();
    const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    return hours.toFixed(2);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading && !currentShift) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff6a2b]"></div>
      </div>
    );
  }

  return (
    <div className="h-full space-y-6">
      {ToastComponent}

      <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-8 border border-white/10">
        <div className="flex items-center gap-3 mb-6">
          <Clock className="w-8 h-8 text-[#ff6a2b]" />
          <h2 className="text-3xl font-bold text-white">Pointeuse</h2>
        </div>

        {currentShift ? (
          <div className="space-y-6">
            <div className="bg-green-500/10 border border-green-500/50 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-green-400 font-semibold">En service</span>
              </div>
              <div className="space-y-2 text-white">
                <p>
                  <span className="text-gray-400">Début:</span>{' '}
                  <span className="font-bold">{formatTime(currentShift.start_time)}</span>
                </p>
                <p>
                  <span className="text-gray-400">Durée:</span>{' '}
                  <span className="font-bold">{formatDuration(currentShift.start_time)}h</span>
                </p>
              </div>
            </div>

            <button
              onClick={clockOut}
              disabled={loading}
              className="w-full bg-gradient-to-r from-red-500 to-rose-600 text-white py-4 px-6 rounded-xl font-semibold hover:shadow-lg hover:shadow-red-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              <StopCircle className="w-6 h-6" />
              Fin de Service
            </button>
          </div>
        ) : (
          <button
            onClick={clockIn}
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#ff6a2b] to-[#ff8c4f] text-white py-4 px-6 rounded-xl font-semibold hover:shadow-lg hover:shadow-[#ff6a2b]/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            <PlayCircle className="w-6 h-6" />
            Prise de Service
          </button>
        )}
      </div>

      <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-6 h-6 text-[#ff6a2b]" />
          <h3 className="text-xl font-bold text-white">Historique</h3>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {recentShifts.length === 0 ? (
            <p className="text-gray-400 text-center py-8">Aucun historique</p>
          ) : (
            recentShifts.map(shift => (
              <div
                key={shift.id}
                className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-white/20 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-gray-400">{formatDate(shift.start_time)}</span>
                  <span className="text-[#ff6a2b] font-bold">
                    {shift.total_hours?.toFixed(2)}h
                  </span>
                </div>
                <div className="flex justify-between text-sm text-white">
                  <span>{formatTime(shift.start_time)}</span>
                  <span>→</span>
                  <span>{shift.end_time ? formatTime(shift.end_time) : '-'}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
