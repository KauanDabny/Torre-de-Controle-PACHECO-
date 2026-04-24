import { supabase } from '../lib/supabase';

export const vehicleService = {
  async getAll() {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async subscribe(callback: (payload: any) => void) {
    return supabase
      .channel('vehicles_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vehicles' }, callback)
      .subscribe();
  }
};

export const shipmentService = {
  async getAll() {
    const { data, error } = await supabase
      .from('shipments')
      .select('*, vehicles(*)');

    if (error) throw error;
    return data;
  }
};
