import { useEffect, useState, useRef } from "react";
import { useEditor } from "@/lib/stores/useEditor";
import { useProject } from "@/lib/stores/useProject";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable-panel";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import Toolbar from "./Toolbar";
import Canvas from "./Canvas";
import GameView from "./GameView";
import SceneHierarchy from "./SceneHierarchy";
import Inspector from "./Inspector";
import AssetBrowser from "./AssetBrowser";
import ProjectManager from "./ProjectManager";
import AnimationEditor from "./AnimationEditor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MoveHorizontal, Save, Undo, Redo, Home, Eye, Play, Pause, Gamepad2 } from "lucide-react";
import { useAudio } from "@/lib/stores/useAudio";
import { KeyboardControls } from "@react-three/drei";
import { keyMap } from "@/lib/engine/utils/Controls";

const Editor = () => {
  const [selectedTab, setSelectedTab] = useState("hierarchy");
  const [showAnimationEditor, setShowAnimationEditor] = useState(false);
  const [showProjectManager, setShowProjectManager] = useState(false);
  const { playHit, playSuccess } = useAudio();
  
  const {
    mode,
    isPlaying,
    selectedGameObject,
    setMode,
    togglePlay,
    toggleGrid,
    toggleSnapToGrid,
    duplicateSelected,
    deleteSelected,
    clearSelection,
    canUndo,
    canRedo,
    undo,
    redo
  } = useEditor();
  
  const { 
    currentProject,
    hasUnsavedChanges,
    saveProject 
  } = useProject();

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle shortcuts if a form input is focused
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      // Delete key - remove selected objects
      if (e.key === "Delete" && selectedGameObject) {
        deleteSelected();
        playHit();
      }

      // Ctrl+D - duplicate selected object
      if (e.key === "d" && (e.ctrlKey || e.metaKey) && selectedGameObject) {
        e.preventDefault();
        duplicateSelected();
        playHit();
      }

      // Ctrl+S - save project
      if (e.key === "s" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSave();
      }

      // Ctrl+Z - undo
      if (e.key === "z" && (e.ctrlKey || e.metaKey) && !e.shiftKey && canUndo) {
        e.preventDefault();
        undo();
        playHit();
      }

      // Ctrl+Shift+Z or Ctrl+Y - redo
      if (
        ((e.key === "z" && e.shiftKey) || e.key === "y") &&
        (e.ctrlKey || e.metaKey) && 
        canRedo
      ) {
        e.preventDefault();
        redo();
        playHit();
      }

      // Escape - clear selection or exit play mode
      if (e.key === "Escape") {
        if (isPlaying) {
          togglePlay();
          playHit();
        } else if (selectedGameObject) {
          clearSelection();
          playHit();
        }
      }

      // Space - toggle play mode
      if (e.key === " " && e.target === document.body) {
        e.preventDefault();
        togglePlay();
        playHit();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    selectedGameObject, 
    deleteSelected, 
    duplicateSelected, 
    undo, 
    redo, 
    canUndo, 
    canRedo, 
    togglePlay, 
    isPlaying, 
    clearSelection, 
    playHit
  ]);

  const handleSave = () => {
    saveProject();
    toast.success("Project saved successfully");
    playSuccess();
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header with project name and main controls */}
      <header className="h-10 px-4 border-b flex items-center justify-between bg-slate-900 text-white">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-1 hover:text-blue-400">
            <Home className="w-4 h-4" />
            <span className="text-sm">Home</span>
          </Link>
          <span className="text-gray-400 text-sm">|</span>
          <h1 className="text-sm font-semibold">
            {currentProject?.name || "Untitled Project"}
            {hasUnsavedChanges && " *"}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleSave}
            title="Save Project (Ctrl+S)"
          >
            <Save className="h-4 w-4 mr-1" />
            Save
          </Button>

          <Button
            size="sm"
            variant={isPlaying ? "destructive" : "default"}
            onClick={togglePlay}
            title={isPlaying ? "Stop (Space)" : "Play (Space)"}
          >
            {isPlaying ? <Pause className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />}
            {isPlaying ? "Stop" : "Play"}
          </Button>
        </div>
      </header>

      {/* Toolbar */}
      <Toolbar 
        mode={mode} 
        setMode={setMode} 
        showGrid={useEditor.getState().showGrid}
        snapToGrid={useEditor.getState().snapToGrid}
        toggleGrid={toggleGrid}
        toggleSnapToGrid={toggleSnapToGrid}
        canUndo={canUndo}
        canRedo={canRedo}
        undo={undo}
        redo={redo}
      />

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* Left sidebar */}
          <ResizablePanel defaultSize={20} minSize={15} maxSize={25}>
            <Tabs defaultValue="hierarchy" value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="w-full">
                <TabsTrigger value="hierarchy" className="flex-1">Hierarchy</TabsTrigger>
                <TabsTrigger value="assets" className="flex-1">Assets</TabsTrigger>
              </TabsList>
              <TabsContent value="hierarchy" className="h-full overflow-hidden">
                <SceneHierarchy />
              </TabsContent>
              <TabsContent value="assets" className="h-full overflow-hidden">
                <AssetBrowser />
              </TabsContent>
            </Tabs>
          </ResizablePanel>

          <ResizableHandle withHandle>
            <MoveHorizontal className="h-4 w-4" />
          </ResizableHandle>

          {/* Center content - Canvas & Game View */}
          <ResizablePanel defaultSize={60}>
            <Tabs defaultValue="canvas" className="h-full flex flex-col">
              <TabsList className="mx-2 mt-2 mb-0">
                <TabsTrigger value="canvas" className="flex-1">
                  <Eye className="h-4 w-4 mr-2" />
                  Canvas
                </TabsTrigger>
                <TabsTrigger value="game" className="flex-1">
                  <Gamepad2 className="h-4 w-4 mr-2" />
                  Game
                </TabsTrigger>
              </TabsList>
              <TabsContent value="canvas" className="flex-1 p-0 m-0">
                <Canvas />
              </TabsContent>
              <TabsContent value="game" className="flex-1 p-0 m-0">
                <KeyboardControls map={keyMap}>
                  <GameView />
                </KeyboardControls>
              </TabsContent>
            </Tabs>
          </ResizablePanel>

          <ResizableHandle withHandle>
            <MoveHorizontal className="h-4 w-4" />
          </ResizableHandle>

          {/* Right sidebar - Inspector */}
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
            <Inspector />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Animation Editor Dialog */}
      {showAnimationEditor && (
        <AnimationEditor
          isOpen={showAnimationEditor}
          onClose={() => setShowAnimationEditor(false)}
        />
      )}

      {/* Project Manager Dialog */}
      {showProjectManager && (
        <ProjectManager
          isOpen={showProjectManager}
          onClose={() => setShowProjectManager(false)}
        />
      )}
    </div>
  );
};

export default Editor;
