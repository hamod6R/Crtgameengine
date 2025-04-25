import { create } from "zustand";
import { Vector2 } from "../engine/utils/Vector2";
import { GameObject } from "../engine/GameObject";
import { Scene } from "../engine/Scene";
import { Engine } from "../engine/Engine";

type EditorMode = "select" | "move" | "scale" | "rotate" | "play";
type ViewportSize = { width: number; height: number };

interface EditorState {
  // Editor state
  mode: EditorMode;
  isPlaying: boolean;
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number;
  zoom: number;
  panOffset: Vector2;
  viewportSize: ViewportSize;
  
  // Engine reference
  engine: Engine | null;
  
  // Selection state
  selectedGameObject: GameObject | null;
  selectedGameObjects: GameObject[];
  
  // Actions
  initializeEditor: () => void;
  setMode: (mode: EditorMode) => void;
  togglePlay: () => void;
  toggleGrid: () => void;
  toggleSnapToGrid: () => void;
  setGridSize: (size: number) => void;
  setZoom: (zoom: number) => void;
  setPanOffset: (offset: Vector2) => void;
  setViewportSize: (size: ViewportSize) => void;
  
  // Selection actions
  selectGameObject: (gameObject: GameObject | null) => void;
  addToSelection: (gameObject: GameObject) => void;
  removeFromSelection: (gameObject: GameObject) => void;
  clearSelection: () => void;
  
  // Object manipulation
  duplicateSelected: () => void;
  deleteSelected: () => void;
  
  // Undo/redo functionality
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
}

export const useEditor = create<EditorState>((set, get) => ({
  // Initialize with default values
  mode: "select",
  isPlaying: false,
  showGrid: true,
  snapToGrid: false,
  gridSize: 16,
  zoom: 1,
  panOffset: new Vector2(0, 0),
  viewportSize: { width: 800, height: 600 },
  
  engine: null,
  
  selectedGameObject: null,
  selectedGameObjects: [],
  
  canUndo: false,
  canRedo: false,
  
  initializeEditor: () => {
    const engine = new Engine();
    const initialScene = new Scene("Main Scene");
    engine.loadScene(initialScene);
    
    set({
      engine,
      mode: "select",
      isPlaying: false,
      selectedGameObject: null,
      selectedGameObjects: [],
      canUndo: false,
      canRedo: false,
    });
    
    console.log("Editor initialized with engine:", engine);
  },
  
  setMode: (mode) => set({ mode }),
  
  togglePlay: () => {
    const { isPlaying, engine } = get();
    
    if (isPlaying) {
      // Stop play mode
      engine?.stop();
      set({ isPlaying: false });
    } else {
      // Start play mode
      engine?.start();
      set({ isPlaying: true });
    }
  },
  
  toggleGrid: () => set(state => ({ showGrid: !state.showGrid })),
  
  toggleSnapToGrid: () => set(state => ({ snapToGrid: !state.snapToGrid })),
  
  setGridSize: (size) => set({ gridSize: size }),
  
  setZoom: (zoom) => set({ zoom }),
  
  setPanOffset: (offset) => set({ panOffset: offset }),
  
  setViewportSize: (size) => set({ viewportSize: size }),
  
  selectGameObject: (gameObject) => set({ 
    selectedGameObject: gameObject,
    selectedGameObjects: gameObject ? [gameObject] : []
  }),
  
  addToSelection: (gameObject) => set(state => ({
    selectedGameObjects: [...state.selectedGameObjects, gameObject]
  })),
  
  removeFromSelection: (gameObject) => set(state => ({
    selectedGameObjects: state.selectedGameObjects.filter(obj => obj.id !== gameObject.id),
    selectedGameObject: state.selectedGameObject?.id === gameObject.id 
      ? null 
      : state.selectedGameObject
  })),
  
  clearSelection: () => set({ 
    selectedGameObject: null, 
    selectedGameObjects: [] 
  }),
  
  duplicateSelected: () => {
    const { selectedGameObjects, engine } = get();
    if (!engine || selectedGameObjects.length === 0) return;
    
    const scene = engine.getCurrentScene();
    if (!scene) return;
    
    const newObjects = selectedGameObjects.map(obj => obj.clone());
    newObjects.forEach(obj => {
      // Offset the position slightly for visibility
      const transform = obj.getComponent("Transform");
      if (transform) {
        transform.position.x += 20;
        transform.position.y += 20;
      }
      scene.addGameObject(obj);
    });
    
    set({
      selectedGameObject: newObjects[0],
      selectedGameObjects: newObjects
    });
  },
  
  deleteSelected: () => {
    const { selectedGameObjects, engine } = get();
    if (!engine || selectedGameObjects.length === 0) return;
    
    const scene = engine.getCurrentScene();
    if (!scene) return;
    
    selectedGameObjects.forEach(obj => {
      scene.removeGameObject(obj);
    });
    
    set({
      selectedGameObject: null,
      selectedGameObjects: []
    });
  },
  
  undo: () => {
    // Implementation will depend on command pattern
    console.log("Undo operation");
    set({ canUndo: false, canRedo: true });
  },
  
  redo: () => {
    // Implementation will depend on command pattern
    console.log("Redo operation");
    set({ canRedo: false });
  }
}));
