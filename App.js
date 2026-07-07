import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AppProvider } from './src/context/AppContext';
import RootNavigation from './src/navigation';

export default function App() {
  return (
    <AppProvider>
      <StatusBar style="dark" />
      <RootNavigation />
    </AppProvider>
  );
}
