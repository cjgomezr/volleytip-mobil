import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { appConfig } from './config';
import { Database } from '../types/database.types';

export const supabase = createClient<Database>(
  appConfig.supabaseUrl,
  appConfig.supabaseAnonKey,
  {
    auth: {
      storage:           AsyncStorage,
      autoRefreshToken:  true,
      persistSession:    true,
      detectSessionInUrl: false,
    },
  }
);
