import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseUrl = rawUrl.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

export const isPlaceholder = !supabaseUrl || supabaseUrl.includes('placeholder') || !supabaseAnonKey || supabaseAnonKey.includes('placeholder');

if (!isPlaceholder && !supabaseAnonKey.startsWith('eyJ')) {
  console.warn('A VITE_SUPABASE_ANON_KEY configurada pode estar incorreta. Chaves do Supabase geralmente começam com "eyJ". Verifique se você copiou a chave "anon" "public" corretamente.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);
