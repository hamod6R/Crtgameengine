import { useState, useEffect } from "react";
import { useEditor } from "@/lib/stores/useEditor";
import { useProject } from "@/lib/stores/useProject";
import { GameObject } from "@/lib/engine/GameObject";
import { 
  ChevronRight, 
  ChevronDown, 
  Eye, 
  EyeOff,
  FilePlus,
  FolderPlus,
  Trash2,
  Copy,
  ListTree
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger 
} from "@/components/ui/context-menu";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { useAudio } from "@/lib/stores/useAudio";

interface GameObjectNodeProps {
  gameObject: GameObject;
  depth: number;
  onRename: (gameObject: GameObject, newName: string) => void;
}

const SceneHierarchy = () => {
  const { engine, selectedGameObject, selectGameObject } = useEditor();
  const { currentProject, markUnsavedChanges } = useProject();
  const [expandedObjects, setExpandedObjects] = useState<Set<string>>(new Set());
  const [gameObjects, setGameObjects] = useState<GameObject[]>([]);
  const [activeScene, setActiveScene] = useState<string | null>(null);
  const [renameMode, setRenameMode] = useState<string | null>(null);
  const [newName, setNewName] = useState<string>("");
  const { playHit } = useAudio();
  
  // Fetch game objects when the scene changes
  useEffect(() => {
    const updateGameObjects = () => {
      if (!engine) return;
      
      const scene = engine.getCurrentScene();
      if (!scene) return;
      
      setGameObjects([...scene.gameObjects]);
      setActiveScene(scene.name);
    };
    
    updateGameObjects();
    
    // Set up an interval to refresh the list occasionally
    const intervalId = setInterval(updateGameObjects, 1000);
    
    return () => clearInterval(intervalId);
  }, [engine, currentProject]);
  
  // Toggle expanded state of an object
  const toggleExpanded = (id: string) => {
    setExpandedObjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
    playHit();
  };
  
  // Toggle visibility of a game object
  const toggleVisibility = (gameObject: GameObject, e: React.MouseEvent) => {
    e.stopPropagation();
    
    gameObject.isActive = !gameObject.isActive;
    markUnsavedChanges();
    
    // Force re-render
    setGameObjects([...gameObjects]);
    playHit();
  };
  
  // Create a new game object
  const createGameObject = () => {
    if (!engine) return;
    
    const scene = engine.getCurrentScene();
    if (!scene) return;
    
    const newObject = new GameObject("New GameObject");
    scene.addGameObject(newObject);
    
    markUnsavedChanges();
    setGameObjects([...scene.gameObjects]);
    selectGameObject(newObject);
    
    // Start rename mode
    setRenameMode(newObject.id);
    setNewName("New GameObject");
    playHit();
  };
  
  // Create a new folder (empty game object for organization)
  const createFolder = () => {
    if (!engine) return;
    
    const scene = engine.getCurrentScene();
    if (!scene) return;
    
    const newFolder = new GameObject("New Folder");
    scene.addGameObject(newFolder);
    
    markUnsavedChanges();
    setGameObjects([...scene.gameObjects]);
    selectGameObject(newFolder);
    
    // Start rename mode
    setRenameMode(newFolder.id);
    setNewName("New Folder");
    playHit();
  };
  
  // Duplicate a game object
  const duplicateGameObject = (gameObject: GameObject) => {
    if (!engine) return;
    
    const scene = engine.getCurrentScene();
    if (!scene) return;
    
    const clone = gameObject.clone();
    clone.name = `${gameObject.name} (Copy)`;
    scene.addGameObject(clone);
    
    markUnsavedChanges();
    setGameObjects([...scene.gameObjects]);
    selectGameObject(clone);
    playHit();
  };
  
  // Delete a game object
  const deleteGameObject = (gameObject: GameObject) => {
    if (!engine) return;
    
    const scene = engine.getCurrentScene();
    if (!scene) return;
    
    scene.removeGameObject(gameObject);
    
    // Clear selection if the deleted object was selected
    if (selectedGameObject && selectedGameObject.id === gameObject.id) {
      selectGameObject(null);
    }
    
    markUnsavedChanges();
    setGameObjects([...scene.gameObjects]);
    toast.success(`Deleted ${gameObject.name}`);
    playHit();
  };
  
  // Rename a game object
  const handleRename = (gameObject: GameObject, newName: string) => {
    if (newName.trim() === "") {
      toast.error("Name cannot be empty");
      return;
    }
    
    gameObject.name = newName.trim();
    markUnsavedChanges();
    setRenameMode(null);
    
    // Force re-render
    setGameObjects([...gameObjects]);
    playHit();
  };
  
  // Handle rename key press
  const handleRenameKeyDown = (e: React.KeyboardEvent, gameObject: GameObject) => {
    if (e.key === "Enter") {
      handleRename(gameObject, newName);
      e.preventDefault();
    } else if (e.key === "Escape") {
      setRenameMode(null);
      e.preventDefault();
    }
  };
  
  // Render a game object node
  const GameObjectNode = ({ gameObject, depth, onRename }: GameObjectNodeProps) => {
    const isSelected = selectedGameObject && selectedGameObject.id === gameObject.id;
    const isExpanded = expandedObjects.has(gameObject.id);
    const children = gameObject.getChildren();
    const hasChildren = children.length > 0;
    
    return (
      <ContextMenu>
        <ContextMenuTrigger>
          <div 
            className={`
              flex items-center px-2 py-1 cursor-pointer select-none
              ${isSelected ? 'bg-blue-500/20 text-blue-500' : 'hover:bg-gray-100/5'}
            `}
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
            onClick={() => selectGameObject(gameObject)}
            onDoubleClick={() => {
              setRenameMode(gameObject.id);
              setNewName(gameObject.name);
            }}
          >
            <div className="flex items-center flex-1 min-w-0">
              {hasChildren ? (
                <button 
                  className="w-4 h-4 mr-1 text-gray-400 hover:text-gray-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpanded(gameObject.id);
                  }}
                >
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
              ) : (
                <div className="w-4 h-4 mr-1" />
              )}
              
              {renameMode === gameObject.id ? (
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onBlur={() => handleRename(gameObject, newName)}
                  onKeyDown={(e) => handleRenameKeyDown(e, gameObject)}
                  autoFocus
                  className="h-6 py-0 px-1 text-sm"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className="truncate">{gameObject.name}</span>
              )}
            </div>
            
            <button
              className={`w-5 h-5 text-gray-400 hover:text-gray-200 ${gameObject.isActive ? '' : 'text-gray-600'}`}
              onClick={(e) => toggleVisibility(gameObject, e)}
              title={gameObject.isActive ? "Hide" : "Show"}
            >
              {gameObject.isActive ? <Eye size={14} /> : <EyeOff size={14} />}
            </button>
          </div>
        </ContextMenuTrigger>
        
        <ContextMenuContent>
          <ContextMenuItem onClick={() => selectGameObject(gameObject)}>
            Select
          </ContextMenuItem>
          <ContextMenuItem onClick={() => {
            setRenameMode(gameObject.id);
            setNewName(gameObject.name);
          }}>
            Rename
          </ContextMenuItem>
          <ContextMenuItem onClick={() => duplicateGameObject(gameObject)}>
            <Copy size={14} className="mr-2" />
            Duplicate
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => deleteGameObject(gameObject)} className="text-red-500">
            <Trash2 size={14} className="mr-2" />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
        
        {/* Render children if expanded */}
        {isExpanded && hasChildren && children.map(child => (
          <GameObjectNode 
            key={child.id} 
            gameObject={child} 
            depth={depth + 1}
            onRename={onRename}
          />
        ))}
      </ContextMenu>
    );
  };
  
  return (
    <div className="h-full flex flex-col bg-slate-900 text-white">
      <div className="p-2 border-b border-slate-800 flex justify-between items-center">
        <div className="flex items-center gap-1">
          <ListTree size={14} className="mr-1" />
          <h3 className="text-sm font-medium">Scene: {activeScene}</h3>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            title="Create Game Object"
            onClick={createGameObject}
          >
            <FilePlus size={14} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            title="Create Folder"
            onClick={createFolder}
          >
            <FolderPlus size={14} />
          </Button>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto">
        {gameObjects.length === 0 ? (
          <div className="p-4 text-center text-gray-400 text-sm">
            No objects in scene
          </div>
        ) : (
          gameObjects
            .filter(obj => !obj.getParent()) // Only root level objects
            .map(obj => (
              <GameObjectNode 
                key={obj.id} 
                gameObject={obj} 
                depth={0}
                onRename={handleRename}
              />
            ))
        )}
      </div>
    </div>
  );
};

export default SceneHierarchy;
