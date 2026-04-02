import ProjectListScreen from '@/components/ProjectListScreen';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';

export default function ProjectsRoute() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth');
    }
  }, [user, loading]);

  if (!user) return null;

  return <ProjectListScreen />;
}
