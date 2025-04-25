import { create } from "zustand";
import { Scene } from "../engine/Scene";
import { useEditor } from "./useEditor";
import { Engine } from "../engine/Engine";
import { GameObject } from "../engine/GameObject";
import { generateUUID } from "../engine/utils/UUID";

export interface Project {
  id: string;
  name: string;
  description: string;
  scenes: Scene[];
  activeSceneIndex: number;
  assets: ProjectAsset[];
  createdAt: Date;
  lastEdited: Date;
}

export interface ProjectAsset {
  id: string;
  name: string;
  type: "sprite" | "audio" | "script" | "prefab" | "animation";
  path: string;
  metadata: Record<string, any>;
}

interface ProjectState {
  // Project data
  currentProject: Project | null;
  hasUnsavedChanges: boolean;
  
  // Actions
  createNewProject: () => void;
  loadProject: (projectId: string) => void;
  saveProject: () => void;
  exportProject: () => string;
  importProject: (projectData: string) => void;
  
  // Scene management
  createScene: (name: string) => Scene;
  deleteScene: (sceneIndex: number) => void;
  setActiveScene: (sceneIndex: number) => void;
  renameScene: (sceneIndex: number, newName: string) => void;
  
  // Asset management
  importAsset: (file: File) => Promise<ProjectAsset | null>;
  deleteAsset: (assetId: string) => void;
  
  // Project metadata
  updateProjectName: (name: string) => void;
  updateProjectDescription: (description: string) => void;
  
  // Project state
  markUnsavedChanges: () => void;
  clearUnsavedChanges: () => void;
}

export const useProject = create<ProjectState>((set, get) => ({
  currentProject: null,
  hasUnsavedChanges: false,
  
  createNewProject: () => {
    const id = generateUUID();
    const newScene = new Scene("Main Scene");
    
    const newProject: Project = {
      id,
      name: "New Project",
      description: "A new 2D game project",
      scenes: [newScene],
      activeSceneIndex: 0,
      assets: [],
      createdAt: new Date(),
      lastEdited: new Date()
    };
    
    // Get engine from editor store
    const engine = useEditor.getState().engine;
    if (engine) {
      engine.loadScene(newScene);
    }
    
    set({
      currentProject: newProject,
      hasUnsavedChanges: true
    });
    
    console.log("Created new project:", newProject);
    
    // Save project to recent projects
    const recentProjects = localStorage.getItem("recentProjects");
    let recentProjectsArray = recentProjects ? JSON.parse(recentProjects) : [];
    
    // Add new project to recent projects
    const projectInfo = {
      id: newProject.id,
      name: newProject.name,
      lastEdited: newProject.lastEdited
    };
    
    // Remove if exists already and add to beginning
    recentProjectsArray = recentProjectsArray.filter((p: any) => p.id !== newProject.id);
    recentProjectsArray.unshift(projectInfo);
    
    // Keep only most recent 10
    if (recentProjectsArray.length > 10) {
      recentProjectsArray = recentProjectsArray.slice(0, 10);
    }
    
    localStorage.setItem("recentProjects", JSON.stringify(recentProjectsArray));
  },
  
  loadProject: (projectId: string) => {
    try {
      // Attempt to load from localStorage
      const savedProject = localStorage.getItem(`project_${projectId}`);
      
      if (!savedProject) {
        console.error(`Project with ID ${projectId} not found`);
        // Fall back to creating a new project
        get().createNewProject();
        return;
      }
      
      // Parse the project data and reconstruct the object graph
      const projectData = JSON.parse(savedProject);
      
      // Create scenes from the saved data
      const scenes = projectData.scenes.map((sceneData: any) => {
        const scene = new Scene(sceneData.name);
        
        // Recreate all game objects in the scene
        sceneData.gameObjects.forEach((objData: any) => {
          const gameObject = GameObject.fromJSON(objData);
          scene.addGameObject(gameObject);
        });
        
        return scene;
      });
      
      const loadedProject: Project = {
        ...projectData,
        scenes,
        createdAt: new Date(projectData.createdAt),
        lastEdited: new Date()
      };
      
      // Get engine from editor store
      const engine = useEditor.getState().engine;
      if (engine) {
        engine.loadScene(scenes[loadedProject.activeSceneIndex]);
      }
      
      set({
        currentProject: loadedProject,
        hasUnsavedChanges: false
      });
      
      console.log("Loaded project:", loadedProject);
      
      // Update recent projects
      const recentProjects = localStorage.getItem("recentProjects");
      let recentProjectsArray = recentProjects ? JSON.parse(recentProjects) : [];
      
      // Update project in recent projects
      const projectInfo = {
        id: loadedProject.id,
        name: loadedProject.name,
        lastEdited: loadedProject.lastEdited
      };
      
      // Remove if exists already and add to beginning
      recentProjectsArray = recentProjectsArray.filter((p: any) => p.id !== loadedProject.id);
      recentProjectsArray.unshift(projectInfo);
      
      // Keep only most recent 10
      if (recentProjectsArray.length > 10) {
        recentProjectsArray = recentProjectsArray.slice(0, 10);
      }
      
      localStorage.setItem("recentProjects", JSON.stringify(recentProjectsArray));
      
    } catch (error) {
      console.error("Failed to load project:", error);
      // Fall back to creating a new project
      get().createNewProject();
    }
  },
  
  saveProject: () => {
    const { currentProject } = get();
    if (!currentProject) return;
    
    try {
      // Update last edited timestamp
      const updatedProject = {
        ...currentProject,
        lastEdited: new Date()
      };
      
      // Serialize the project
      const serializedProject = {
        ...updatedProject,
        scenes: updatedProject.scenes.map(scene => ({
          name: scene.name,
          gameObjects: scene.gameObjects.map(obj => obj.toJSON())
        }))
      };
      
      // Save to localStorage
      localStorage.setItem(
        `project_${currentProject.id}`, 
        JSON.stringify(serializedProject)
      );
      
      set({
        currentProject: updatedProject,
        hasUnsavedChanges: false
      });
      
      console.log("Project saved successfully");
      
      // Update recent projects
      const recentProjects = localStorage.getItem("recentProjects");
      let recentProjectsArray = recentProjects ? JSON.parse(recentProjects) : [];
      
      // Update project in recent projects
      const projectInfo = {
        id: updatedProject.id,
        name: updatedProject.name,
        lastEdited: updatedProject.lastEdited
      };
      
      // Remove if exists already and add to beginning
      recentProjectsArray = recentProjectsArray.filter((p: any) => p.id !== updatedProject.id);
      recentProjectsArray.unshift(projectInfo);
      
      // Keep only most recent 10
      if (recentProjectsArray.length > 10) {
        recentProjectsArray = recentProjectsArray.slice(0, 10);
      }
      
      localStorage.setItem("recentProjects", JSON.stringify(recentProjectsArray));
      
    } catch (error) {
      console.error("Failed to save project:", error);
    }
  },
  
  exportProject: () => {
    const { currentProject } = get();
    if (!currentProject) return "";
    
    try {
      // Serialize the project
      const serializedProject = {
        ...currentProject,
        scenes: currentProject.scenes.map(scene => ({
          name: scene.name,
          gameObjects: scene.gameObjects.map(obj => obj.toJSON())
        }))
      };
      
      return JSON.stringify(serializedProject, null, 2);
    } catch (error) {
      console.error("Failed to export project:", error);
      return "";
    }
  },
  
  importProject: (projectData: string) => {
    try {
      const parsedData = JSON.parse(projectData);
      
      // Validate required fields
      if (!parsedData.id || !parsedData.name || !Array.isArray(parsedData.scenes)) {
        throw new Error("Invalid project data format");
      }
      
      // Create scenes from the saved data
      const scenes = parsedData.scenes.map((sceneData: any) => {
        const scene = new Scene(sceneData.name);
        
        // Recreate all game objects in the scene
        if (Array.isArray(sceneData.gameObjects)) {
          sceneData.gameObjects.forEach((objData: any) => {
            const gameObject = GameObject.fromJSON(objData);
            scene.addGameObject(gameObject);
          });
        }
        
        return scene;
      });
      
      const importedProject: Project = {
        ...parsedData,
        scenes,
        createdAt: new Date(parsedData.createdAt || new Date()),
        lastEdited: new Date(),
        activeSceneIndex: parsedData.activeSceneIndex || 0,
        assets: parsedData.assets || []
      };
      
      // Get engine from editor store
      const engine = useEditor.getState().engine;
      if (engine) {
        engine.loadScene(scenes[importedProject.activeSceneIndex]);
      }
      
      set({
        currentProject: importedProject,
        hasUnsavedChanges: true
      });
      
      console.log("Imported project:", importedProject);
      
      // Add to recent projects
      const recentProjects = localStorage.getItem("recentProjects");
      let recentProjectsArray = recentProjects ? JSON.parse(recentProjects) : [];
      
      // Add new project to recent projects
      const projectInfo = {
        id: importedProject.id,
        name: importedProject.name,
        lastEdited: importedProject.lastEdited
      };
      
      // Remove if exists already and add to beginning
      recentProjectsArray = recentProjectsArray.filter((p: any) => p.id !== importedProject.id);
      recentProjectsArray.unshift(projectInfo);
      
      // Keep only most recent 10
      if (recentProjectsArray.length > 10) {
        recentProjectsArray = recentProjectsArray.slice(0, 10);
      }
      
      localStorage.setItem("recentProjects", JSON.stringify(recentProjectsArray));
      
    } catch (error) {
      console.error("Failed to import project:", error);
      // Fall back to creating a new project
      get().createNewProject();
    }
  },
  
  createScene: (name: string) => {
    const { currentProject, markUnsavedChanges } = get();
    
    if (!currentProject) {
      throw new Error("No project is currently open");
    }
    
    const newScene = new Scene(name);
    
    set(state => ({
      currentProject: state.currentProject 
        ? {
            ...state.currentProject,
            scenes: [...state.currentProject.scenes, newScene]
          }
        : null
    }));
    
    markUnsavedChanges();
    
    return newScene;
  },
  
  deleteScene: (sceneIndex: number) => {
    const { currentProject, markUnsavedChanges } = get();
    
    if (!currentProject) return;
    
    // Prevent deleting the only scene
    if (currentProject.scenes.length <= 1) {
      console.error("Cannot delete the only scene");
      return;
    }
    
    // Update active scene index if needed
    let newActiveSceneIndex = currentProject.activeSceneIndex;
    if (sceneIndex === currentProject.activeSceneIndex) {
      newActiveSceneIndex = Math.max(0, currentProject.activeSceneIndex - 1);
    } else if (sceneIndex < currentProject.activeSceneIndex) {
      newActiveSceneIndex--;
    }
    
    // Create new scenes array without the deleted scene
    const newScenes = [...currentProject.scenes];
    newScenes.splice(sceneIndex, 1);
    
    // Update the engine with the new active scene
    const engine = useEditor.getState().engine;
    if (engine) {
      engine.loadScene(newScenes[newActiveSceneIndex]);
    }
    
    set({
      currentProject: {
        ...currentProject,
        scenes: newScenes,
        activeSceneIndex: newActiveSceneIndex
      }
    });
    
    markUnsavedChanges();
  },
  
  setActiveScene: (sceneIndex: number) => {
    const { currentProject } = get();
    
    if (!currentProject || sceneIndex < 0 || sceneIndex >= currentProject.scenes.length) {
      return;
    }
    
    // Load the scene in the engine
    const engine = useEditor.getState().engine;
    if (engine) {
      engine.loadScene(currentProject.scenes[sceneIndex]);
    }
    
    set({
      currentProject: {
        ...currentProject,
        activeSceneIndex: sceneIndex
      }
    });
  },
  
  renameScene: (sceneIndex: number, newName: string) => {
    const { currentProject, markUnsavedChanges } = get();
    
    if (!currentProject || sceneIndex < 0 || sceneIndex >= currentProject.scenes.length) {
      return;
    }
    
    const updatedScenes = [...currentProject.scenes];
    updatedScenes[sceneIndex].name = newName;
    
    set({
      currentProject: {
        ...currentProject,
        scenes: updatedScenes
      }
    });
    
    markUnsavedChanges();
  },
  
  importAsset: async (file: File): Promise<ProjectAsset | null> => {
    const { currentProject, markUnsavedChanges } = get();
    
    if (!currentProject) {
      return null;
    }
    
    try {
      // Determine asset type based on file extension
      const fileName = file.name;
      const extension = fileName.split('.').pop()?.toLowerCase() || '';
      
      let assetType: ProjectAsset['type'] = 'sprite';
      
      // Assign type based on extension
      if (['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(extension)) {
        assetType = 'sprite';
      } else if (['mp3', 'wav', 'ogg'].includes(extension)) {
        assetType = 'audio';
      } else if (['js', 'ts'].includes(extension)) {
        assetType = 'script';
      } else {
        // Unsupported file type
        throw new Error(`Unsupported file type: ${extension}`);
      }
      
      // Read file data
      const fileReader = new FileReader();
      
      const fileData = await new Promise<string>((resolve, reject) => {
        fileReader.onload = () => resolve(fileReader.result as string);
        fileReader.onerror = reject;
        
        if (assetType === 'sprite') {
          fileReader.readAsDataURL(file);
        } else {
          fileReader.readAsText(file);
        }
      });
      
      // Create asset
      const newAsset: ProjectAsset = {
        id: generateUUID(),
        name: fileName,
        type: assetType,
        path: `assets/${fileName}`,
        metadata: {
          size: file.size,
          mimeType: file.type,
          content: fileData
        }
      };
      
      // Add to project assets
      set({
        currentProject: {
          ...currentProject,
          assets: [...currentProject.assets, newAsset]
        }
      });
      
      markUnsavedChanges();
      
      return newAsset;
    } catch (error) {
      console.error("Failed to import asset:", error);
      return null;
    }
  },
  
  deleteAsset: (assetId: string) => {
    const { currentProject, markUnsavedChanges } = get();
    
    if (!currentProject) return;
    
    // Remove asset from project
    set({
      currentProject: {
        ...currentProject,
        assets: currentProject.assets.filter(asset => asset.id !== assetId)
      }
    });
    
    markUnsavedChanges();
  },
  
  updateProjectName: (name: string) => {
    const { currentProject, markUnsavedChanges } = get();
    
    if (!currentProject) return;
    
    set({
      currentProject: {
        ...currentProject,
        name
      }
    });
    
    markUnsavedChanges();
  },
  
  updateProjectDescription: (description: string) => {
    const { currentProject, markUnsavedChanges } = get();
    
    if (!currentProject) return;
    
    set({
      currentProject: {
        ...currentProject,
        description
      }
    });
    
    markUnsavedChanges();
  },
  
  markUnsavedChanges: () => {
    set({ hasUnsavedChanges: true });
  },
  
  clearUnsavedChanges: () => {
    set({ hasUnsavedChanges: false });
  }
}));
