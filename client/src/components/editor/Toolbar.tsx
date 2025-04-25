import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  MousePointer, 
  Move, 
  Maximize, 
  RotateCw, 
  Grid, 
  AlignJustify,
  Undo, 
  Redo,
  FilePlus,
  Square,
  Circle,
  Image,
  Type,
  Gamepad2
} from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useProject } from "@/lib/stores/useProject";
import { Engine } from "@/lib/engine/Engine";
import { GameObject } from "@/lib/engine/GameObject";
import { SpriteRenderer } from "@/lib/engine/components/SpriteRenderer";
import { Collider } from "@/lib/engine/components/Collider";
import { RigidBody } from "@/lib/engine/components/RigidBody";
import { useAudio } from "@/lib/stores/useAudio";

interface ToolbarProps {
  mode: string;
  setMode: (mode: any) => void;
  showGrid: boolean;
  snapToGrid: boolean;
  toggleGrid: () => void;
  toggleSnapToGrid: () => void;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
}

const Toolbar = ({
  mode,
  setMode,
  showGrid,
  snapToGrid,
  toggleGrid,
  toggleSnapToGrid,
  canUndo,
  canRedo,
  undo,
  redo
}: ToolbarProps) => {
  const { currentProject, markUnsavedChanges } = useProject();
  const { playHit } = useAudio();
  
  const engine: Engine | null = window.engineRef;

  const createGameObject = (type: string) => {
    if (!engine || !currentProject) return;
    
    const scene = engine.getCurrentScene();
    if (!scene) return;
    
    let gameObject: GameObject;
    
    switch (type) {
      case "square": {
        gameObject = new GameObject("Square");
        const spriteRenderer = gameObject.addComponent(new SpriteRenderer(null, "#3b82f6"));
        spriteRenderer.width = 100;
        spriteRenderer.height = 100;
        
        const collider = gameObject.addComponent(new Collider("box"));
        collider.width = 100;
        collider.height = 100;
        break;
      }
      case "circle": {
        gameObject = new GameObject("Circle");
        const spriteRenderer = gameObject.addComponent(new SpriteRenderer(null, "#10b981"));
        spriteRenderer.width = 100;
        spriteRenderer.height = 100;
        
        const collider = gameObject.addComponent(new Collider("circle"));
        collider.radius = 50;
        break;
      }
      case "sprite": {
        gameObject = new GameObject("Sprite");
        const spriteRenderer = gameObject.addComponent(new SpriteRenderer());
        spriteRenderer.width = 100;
        spriteRenderer.height = 100;
        spriteRenderer.color = "#ffffff";
        break;
      }
      case "text": {
        gameObject = new GameObject("Text");
        const spriteRenderer = gameObject.addComponent(new SpriteRenderer(null, "#ffffff"));
        spriteRenderer.width = 200;
        spriteRenderer.height = 50;
        break;
      }
      case "physics": {
        gameObject = new GameObject("PhysicsObject");
        const spriteRenderer = gameObject.addComponent(new SpriteRenderer(null, "#ef4444"));
        spriteRenderer.width = 100;
        spriteRenderer.height = 100;
        
        const collider = gameObject.addComponent(new Collider("box"));
        collider.width = 100;
        collider.height = 100;
        
        const rigidBody = gameObject.addComponent(new RigidBody());
        rigidBody.useGravity = true;
        rigidBody.mass = 1;
        break;
      }
      default:
        gameObject = new GameObject("GameObject");
        break;
    }
    
    scene.addGameObject(gameObject);
    
    // Center the object in view
    const transform = gameObject.getComponent("Transform");
    if (transform) {
      const viewportSize = { 
        width: document.getElementById("canvas-container")?.clientWidth || 800,
        height: document.getElementById("canvas-container")?.clientHeight || 600
      };
      
      transform.setPosition(viewportSize.width / 2, viewportSize.height / 2);
    }
    
    markUnsavedChanges();
    playHit();
  };

  return (
    <div className="h-12 px-4 border-b flex items-center gap-2 bg-slate-800 text-white">
      {/* Transform Tools */}
      <ToggleGroup type="single" value={mode} onValueChange={(val) => val && setMode(val)}>
        <ToggleGroupItem value="select" aria-label="Select Mode" title="Select (V)">
          <MousePointer className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="move" aria-label="Move Mode" title="Move (M)">
          <Move className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="scale" aria-label="Scale Mode" title="Scale (S)">
          <Maximize className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="rotate" aria-label="Rotate Mode" title="Rotate (R)">
          <RotateCw className="h-4 w-4" />
        </ToggleGroupItem>
      </ToggleGroup>

      <Separator orientation="vertical" className="h-8 bg-slate-700" />

      {/* View Options */}
      <Button
        variant="ghost"
        size="icon"
        title="Toggle Grid"
        onClick={toggleGrid}
        className={cn(showGrid ? "bg-blue-500/20" : "")}
      >
        <Grid className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        title="Snap to Grid"
        onClick={toggleSnapToGrid}
        className={cn(snapToGrid ? "bg-blue-500/20" : "")}
      >
        <AlignJustify className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="h-8 bg-slate-700" />

      {/* History Controls */}
      <Button
        variant="ghost"
        size="icon"
        title="Undo (Ctrl+Z)"
        onClick={undo}
        disabled={!canUndo}
      >
        <Undo className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        title="Redo (Ctrl+Y)"
        onClick={redo}
        disabled={!canRedo}
      >
        <Redo className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="h-8 bg-slate-700" />

      {/* Create Objects */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-1">
            <FilePlus className="h-4 w-4" />
            Create
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => createGameObject("square")}>
            <Square className="h-4 w-4 mr-2" />
            Square
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => createGameObject("circle")}>
            <Circle className="h-4 w-4 mr-2" />
            Circle
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => createGameObject("sprite")}>
            <Image className="h-4 w-4 mr-2" />
            Sprite
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => createGameObject("text")}>
            <Type className="h-4 w-4 mr-2" />
            Text
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => createGameObject("physics")}>
            <Gamepad2 className="h-4 w-4 mr-2" />
            Physics Object
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default Toolbar;
