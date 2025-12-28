import { supabase, User } from './supabase';

export async function login(username: string, password: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('username', username)
    .eq('password', password)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as User;
}

export async function getCurrentUser(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as User;
}
