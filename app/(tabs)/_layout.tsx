import AppHeader from '@/components/AppHeader';
import CartShortcut from '@/components/CartShortcut';
import FloatingTabBar from '@/components/FloatingTabBar';
import { FEATURE_FLAGS } from '@/constants/featureFlags';
import { useAuth } from '@/context/AuthContext';
import { CamperProvider, useCamper } from '@/context/CamperContext';
import { useProjects } from '@/context/ProjectContext';
import { TabNavProvider, useTabNav } from '@/context/TabNavContext';
import { useTheme } from '@/context/ThemeContext';
import WelcomeScreen from '@/components/WelcomeScreen';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs, useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { View, TouchableOpacity, Text } from 'react-native';

function TabContentWithHeader() {
  const theme = useTheme();
  const { currentIndex } = useTabNav();
  const showEstimate = currentIndex === 1;

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <AppHeader showEstimate={showEstimate} />
      <View style={{ flex: 1 }}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: { display: 'none' },
            animation: 'fade',
            sceneStyle: { backgroundColor: theme.background },
          }}
          tabBar={() => null}
        >
          <Tabs.Screen name="index" />
          <Tabs.Screen name="two" />
          <Tabs.Screen name="insulation" />
          <Tabs.Screen name="water" />
          {FEATURE_FLAGS.THREE_D_KITS_ENABLED && <Tabs.Screen name="furniture" />}
          <Tabs.Screen name="three" />
        </Tabs>
      </View>
      <CartShortcut />
      <FloatingTabBar />
    </View>
  );
}

function ProjectTabContent() {
  const theme = useTheme();
  const { state } = useCamper();
  const hasLevel = state.experienceLevel !== null;

  if (!hasLevel) {
    return <WelcomeScreen />;
  }

  return (
    <TabNavProvider>
      <TabContentWithHeader />
    </TabNavProvider>
  );
}

function ProjectCamperWrapper() {
  const { currentProject, saveProjectState } = useProjects();
  const { user, loading } = useAuth();
  const router = useRouter();
  const theme = useTheme();

  const handleStateChange = useCallback((state: any) => {
    saveProjectState(state);
  }, [saveProjectState]);

  if (loading) {
    return <View style={{ flex: 1, backgroundColor: theme.background }} />;
  }

  if (!user) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
        <FontAwesome name="lock" size={48} color={theme.textSecondary} style={{ opacity: 0.4, marginBottom: 16 }} />
        <Text style={{ fontSize: 18, fontWeight: '700', color: theme.text, marginBottom: 8 }}>Sign In Required</Text>
        <Text style={{ fontSize: 13, color: theme.textSecondary, textAlign: 'center', marginBottom: 24 }}>
          Create an account to access build tools, pricing, and bespoke package recommendations.
        </Text>
        <TouchableOpacity
          style={{ backgroundColor: theme.accent, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 10 }}
          onPress={() => router.replace('/auth')}
          activeOpacity={0.85}
        >
          <Text style={{ color: '#1A1A1A', fontSize: 15, fontWeight: '700' }}>Sign In / Register</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!currentProject) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
        <FontAwesome name="folder-open-o" size={48} color={theme.textSecondary} style={{ opacity: 0.4, marginBottom: 16 }} />
        <Text style={{ fontSize: 18, fontWeight: '700', color: theme.text, marginBottom: 8 }}>No Project Selected</Text>
        <Text style={{ fontSize: 13, color: theme.textSecondary, textAlign: 'center', marginBottom: 24 }}>Select or create a project to get started.</Text>
        <TouchableOpacity style={{ backgroundColor: theme.accent, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 10 }} onPress={() => router.replace('/projects')} activeOpacity={0.85}>
          <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>Go to Projects</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <CamperProvider projectState={currentProject.camper_state} onStateChange={handleStateChange}>
      <ProjectTabContent />
    </CamperProvider>
  );
}

export default function TabLayout() {
  return <ProjectCamperWrapper />;
}

