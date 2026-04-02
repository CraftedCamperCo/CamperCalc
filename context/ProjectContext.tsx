import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/utils/supabase';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { CamperState } from './CamperContext';

export interface Project {
  id: string;
  user_id: string;
  name: string;
  camper_state: CamperState;
  schematic_regenerations: number;
  purchased_items?: string[];
  photos?: string[];
  created_at: string;
  updated_at: string;
}

interface ProjectContextValue {
  projects: Project[];
  currentProject: Project | null;
  loading: boolean;
  createProject: (name: string, initialState?: Partial<CamperState>) => Promise<Project | null>;
  selectProject: (project: Project) => void;
  deselectProject: () => void;
  saveProjectState: (state: CamperState) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  refreshProjects: () => Promise<void>;
  incrementSchematicRegeneration: (projectId: string) => Promise<number>;
  markPurchasedItems: (projectId: string, productIds: string[]) => Promise<void>;
  updateProjectPhotos: (projectId: string, photos: string[]) => Promise<void>;
}

const ProjectContext = createContext<ProjectContextValue>({
  projects: [],
  currentProject: null,
  loading: true,
  createProject: async () => null,
  selectProject: () => {},
  deselectProject: () => {},
  saveProjectState: async () => {},
  deleteProject: async () => {},
  refreshProjects: async () => {},
  incrementSchematicRegeneration: async () => 0,
  markPurchasedItems: async () => {},
  updateProjectPhotos: async () => {},
});

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const currentProjectRef = useRef<Project | null>(null);
  const photosColumnSupportedRef = useRef<boolean | null>(null);

  useEffect(() => {
    currentProjectRef.current = currentProject;
  }, [currentProject]);

  const fetchProjects = useCallback(async () => {
    if (!user) { setProjects([]); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (!error && data) setProjects(data as Project[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const createProject = async (name: string, initialState?: Partial<CamperState>): Promise<Project | null> => {
    if (!user) return null;
    try {
      const supportsPhotos = photosColumnSupportedRef.current !== false;
      const insertPayload = supportsPhotos
        ? { user_id: user.id, name, camper_state: initialState ?? {}, photos: [] as string[] }
        : { user_id: user.id, name, camper_state: initialState ?? {} };
      let { data, error } = await supabase
        .from('projects')
        .insert(insertPayload)
        .select()
        .single();

      const missingPhotosColumn = !!error?.message?.includes("Could not find the 'photos' column");
      if (missingPhotosColumn && supportsPhotos) {
        photosColumnSupportedRef.current = false;
        ({ data, error } = await supabase
          .from('projects')
          .insert({ user_id: user.id, name, camper_state: initialState ?? {} })
          .select()
          .single());
      } else if (!error && supportsPhotos) {
        photosColumnSupportedRef.current = true;
      }

      if (error) {
        console.warn('[ProjectContext] createProject error:', error.message);
        return null;
      }
      if (!data) return null;
      const project = {
        ...data,
        photos: Array.isArray((data as any).photos) ? (data as any).photos : [],
      } as Project;
      setProjects(prev => [project, ...prev]);
      setCurrentProject(project);
      return project;
    } catch (e: any) {
      console.warn('[ProjectContext] createProject exception:', e?.message);
      return null;
    }
  };

  const selectProject = (project: Project) => {
    setCurrentProject(project);
  };

  const deselectProject = () => {
    setCurrentProject(null);
  };

  const saveProjectState = useCallback(async (state: CamperState) => {
    const proj = currentProjectRef.current;
    if (!proj) return;
    const { error } = await supabase
      .from('projects')
      .update({ camper_state: state })
      .eq('id', proj.id);

    if (!error && currentProjectRef.current?.id === proj.id) {
      const updated = { ...proj, camper_state: state, updated_at: new Date().toISOString() };
      setCurrentProject(updated);
      setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
    }
  }, []);

  const deleteProject = async (id: string) => {
    await supabase.from('projects').delete().eq('id', id);
    setProjects(prev => prev.filter(p => p.id !== id));
    if (currentProject?.id === id) setCurrentProject(null);
  };

  const refreshProjects = fetchProjects;

  const incrementSchematicRegeneration = async (projectId: string): Promise<number> => {
    const proj = projects.find(p => p.id === projectId) || currentProject;
    const current = proj?.schematic_regenerations ?? 0;
    const next = current + 1;
    const { error } = await supabase
      .from('projects')
      .update({ schematic_regenerations: next })
      .eq('id', projectId);

    if (!error) {
      const updater = (p: Project) => p.id === projectId ? { ...p, schematic_regenerations: next } : p;
      setProjects(prev => prev.map(updater));
      if (currentProject?.id === projectId) {
        setCurrentProject(prev => prev ? { ...prev, schematic_regenerations: next } : prev);
      }
    }
    return next;
  };

  const markPurchasedItems = async (projectId: string, productIds: string[]) => {
    const proj = projects.find((p) => p.id === projectId) || currentProject;
    const existing = new Set(proj?.purchased_items ?? []);
    for (const id of productIds) existing.add(id);
    const next = Array.from(existing);
    const { error } = await supabase
      .from('projects')
      .update({ purchased_items: next })
      .eq('id', projectId);
    if (!error) {
      setProjects((prev) => prev.map((p) => p.id === projectId ? { ...p, purchased_items: next } : p));
      if (currentProject?.id === projectId) {
        setCurrentProject((prev) => prev ? { ...prev, purchased_items: next } : prev);
      }
    }
  };

  const updateProjectPhotos = async (projectId: string, photos: string[]) => {
    if (photosColumnSupportedRef.current === false) return;
    const { error } = await supabase
      .from('projects')
      .update({ photos })
      .eq('id', projectId);
    if (error?.message?.includes("Could not find the 'photos' column")) {
      photosColumnSupportedRef.current = false;
      console.warn('[ProjectContext] photos column missing in Supabase schema; skipping photo updates until migration is applied.');
      return;
    }
    if (!error) {
      setProjects((prev) => prev.map((p) => p.id === projectId ? { ...p, photos } : p));
      if (currentProject?.id === projectId) {
        setCurrentProject((prev) => prev ? { ...prev, photos } : prev);
      }
    }
  };

  return (
    <ProjectContext.Provider value={{
      projects, currentProject, loading,
      createProject, selectProject, deselectProject,
      saveProjectState, deleteProject, refreshProjects,
      incrementSchematicRegeneration, markPurchasedItems, updateProjectPhotos,
    }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjects() {
  return useContext(ProjectContext);
}
