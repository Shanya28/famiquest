import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useApp } from '../context/AppContext';
import PinModal from '../components/PinModal';
import Tutorial from '../components/Tutorial';
import { C } from '../theme';

import AuthScreen from '../screens/AuthScreen';
import ProfileSelectScreen from '../screens/ProfileSelectScreen';
import DashboardScreen from '../screens/parent/DashboardScreen';
import TasksScreen from '../screens/parent/TasksScreen';
import ValidationScreen from '../screens/parent/ValidationScreen';
import SettingsScreen from '../screens/parent/SettingsScreen';
import MissionsScreen from '../screens/child/MissionsScreen';
import RewardsScreen from '../screens/child/RewardsScreen';
import ShopScreen from '../screens/child/ShopScreen';

const Tab = createBottomTabNavigator();

const tabIcon = (icon) => ({ focused }) => (
  <View style={{
    width: 44, height: 30, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    backgroundColor: focused ? C.violetSoft : 'transparent',
  }}>
    <Text style={{ fontSize: 18 }}>{icon}</Text>
  </View>
);

function Header({ title }) {
  const { setSession } = useApp();
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 16, paddingTop: 54, paddingBottom: 10, backgroundColor: C.bg,
    }}>
      <Text style={{ fontSize: 18, fontWeight: '800', color: C.ink }}>
        Fami<Text style={{ color: C.violet }}>Quest</Text>
        <Text style={{ fontSize: 11, color: C.inkSoft }}>  · {title}</Text>
      </Text>
      <TouchableOpacity
        onPress={() => setSession(null)}
        style={{
          backgroundColor: '#fff', borderWidth: 2, borderColor: C.violetSoft,
          borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5,
        }}
      >
        <Text style={{ fontSize: 11, fontWeight: '800', color: C.inkSoft }}>Changer ⇄</Text>
      </TouchableOpacity>
    </View>
  );
}

const tabOptions = {
  headerShown: false,
  tabBarActiveTintColor: C.violet,
  tabBarInactiveTintColor: C.inkSoft,
  tabBarLabelStyle: { fontSize: 10, fontWeight: '800' },
  tabBarStyle: { backgroundColor: '#fff', borderTopColor: C.violetSoft, height: 62, paddingBottom: 8 },
};

function ParentTabs() {
  const { tasks, redemptions } = useApp();
  const pending =
    tasks.filter((t) => t.status === 'pending').length +
    redemptions.filter((r) => r.status === 'pending').length;
  return (
    <>
      <Header title="Espace Parent" />
      <Tutorial mode="parent" />
      <Tab.Navigator screenOptions={tabOptions}>
        <Tab.Screen name="Tableau" component={DashboardScreen} options={{ tabBarIcon: tabIcon('📊') }} />
        <Tab.Screen name="Tâches" component={TasksScreen} options={{ tabBarIcon: tabIcon('📋') }} />
        <Tab.Screen
          name="Valider" component={ValidationScreen}
          options={{
            tabBarIcon: tabIcon('✅'),
            tabBarBadge: pending > 0 ? pending : undefined,
            tabBarBadgeStyle: { backgroundColor: C.coral },
          }}
        />
        <Tab.Screen name="Réglages" component={SettingsScreen} options={{ tabBarIcon: tabIcon('⚙️') }} />
      </Tab.Navigator>
    </>
  );
}

function ChildTabs() {
  const { session, children } = useApp();
  const child = children.find((c) => c.id === session.childId);
  return (
    <>
      <Header title={child?.name || 'Enfant'} />
      <Tutorial mode="child" />
      <Tab.Navigator screenOptions={tabOptions}>
        <Tab.Screen name="Missions" component={MissionsScreen} options={{ tabBarIcon: tabIcon('🏠') }} />
        <Tab.Screen name="Boutique" component={ShopScreen} options={{ tabBarIcon: tabIcon('🛍️') }} />
        <Tab.Screen name="Trophées" component={RewardsScreen} options={{ tabBarIcon: tabIcon('🏆') }} />
      </Tab.Navigator>
    </>
  );
}

export default function RootNavigation() {
  const { user, session, setSession, family } = useApp();
  const [pinRequest, setPinRequest] = useState(false);

  if (user === undefined) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={C.violet} />
      </View>
    );
  }

  // Verrouillage de l'Espace Parent par PIN : intercepte l'entrée en mode parent
  const guardedSession = session?.mode === 'parent' && family?.pin && !session.pinOk
    ? null
    : session;

  return (
    <NavigationContainer>
      {!user ? (
        <AuthScreen />
      ) : !guardedSession ? (
        <>
          <ProfileSelectScreen />
          {/* Demande de PIN quand l'utilisateur a choisi "Espace Parent" */}
          <PinModal
            visible={session?.mode === 'parent' && !!family?.pin && !session?.pinOk}
            expectedPin={family?.pin}
            title="Code parent requis"
            onSuccess={() => setSession({ mode: 'parent', pinOk: true })}
            onCancel={() => setSession(null)}
          />
        </>
      ) : guardedSession.mode === 'parent' ? (
        <ParentTabs />
      ) : (
        <ChildTabs />
      )}
    </NavigationContainer>
  );
}
