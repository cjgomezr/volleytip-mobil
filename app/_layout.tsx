import '../src/i18n';

import {
  Roboto_400Regular,
  Roboto_500Medium,
  Roboto_700Bold,
  Roboto_900Black,
  useFonts,
} from '@expo-google-fonts/roboto';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { queryClient } from '../src/lib/query-client';

import { loadSavedLanguage } from '../src/i18n';
import { configureRevenueCat, loginRevenueCat } from '../src/lib/revenuecat';
import { useProtectedRoute } from '../src/hooks/useProtectedRoute';
import { useAuthStore } from '../src/store';
import { useLanguageStore } from '../src/store/language.store';
import { usePurchasesStore } from '../src/store/purchases.store';

SplashScreen.preventAutoHideAsync();

// Separated so useProtectedRoute runs inside the navigation context
function RootNavigator() {
  useProtectedRoute();
  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  const [langReady, setLangReady] = useState(false);
  const syncFromI18n       = useLanguageStore((s) => s.syncFromI18n);
  const authInitialized    = useAuthStore((s) => s.initialized);
  const session            = useAuthStore((s) => s.session);
  const initialize         = useAuthStore((s) => s.initialize);
  const initializePurchases = usePurchasesStore((s) => s.initialize);
  const resetPurchases      = usePurchasesStore((s) => s.reset);

  const [fontsLoaded, fontError] = useFonts({
    Roboto_400Regular,
    Roboto_500Medium,
    Roboto_700Bold,
    Roboto_900Black,
  });

  useEffect(() => {
    loadSavedLanguage().then(() => {
      syncFromI18n();
      setLangReady(true);
    });
  }, []);

  useEffect(() => {
    configureRevenueCat();
    initialize();
  }, []);

  // Sync purchases whenever auth state changes
  useEffect(() => {
    if (!authInitialized) return;
    if (session?.user.id) {
      loginRevenueCat(session.user.id);
      initializePurchases(session.user.id);
    } else {
      resetPurchases();
    }
  }, [authInitialized, session?.user.id]);

  useEffect(() => {
    if ((fontsLoaded || fontError) && langReady && authInitialized) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, langReady, authInitialized]);

  if ((!fontsLoaded && !fontError) || !langReady || !authInitialized) {
    return <View style={{ flex: 1, backgroundColor: '#111116' }} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#111116' }}>
        <SafeAreaProvider>
          <StatusBar style="light" backgroundColor="#111116" />
          <RootNavigator />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
