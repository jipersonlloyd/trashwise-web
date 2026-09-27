import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/user';

interface AuthState {
  session: any | null;
  profile: Profile | null;
  loading: boolean;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  init: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  profile: null,
  loading: true,
  initialized: false,

  init: async () => {
    set({ loading: true });

    const { data } = await supabase.auth.getSession();

    if (data.session) {
      set({ session: data.session });
      await get().refreshProfile();
    } else {
      set({ session: null, profile: null });
    }

    // Mark as ready REGARDLESS of outcome
    set({ loading: false, initialized: true });

    // Listen for future auth changes
    supabase.auth.onAuthStateChange(async (_event, session) => {
      set({ session });
      if (session) {
        await get().refreshProfile();
      } else {
        set({ profile: null });
      }
    });
  },

  refreshProfile: async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      set({ profile: null });
      return;
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userData.user.id)
      .single();

    if (error) {
      console.error('Failed to load profile:', error);
      set({ profile: null });
      return;
    }
    set({ profile: data as Profile });
  },

  signIn: async (email, password) => {
    set({ loading: true });
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      set({ loading: false });
      throw error;
    }
    // onAuthStateChange will fire and load the profile.
    // Also proactively fetch profile + clear loading so UI can move on:
    await get().refreshProfile();
    set({ loading: false });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, profile: null });
  },
}));