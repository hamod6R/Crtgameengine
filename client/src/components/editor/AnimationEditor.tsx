import { useState, useEffect } from "react";
import { useEditor } from "@/lib/stores/useEditor";
import { useProject } from "@/lib/stores/useProject";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { SpriteRenderer } from "@/lib/engine/components/SpriteRenderer";
import { Animator } from "@/lib/engine/components/Animator";
import { Film, Plus, Trash2, Play, Pause, Clock } from "lucide-react";
import { toast } from "sonner";
import { useAudio } from "@/lib/stores/useAudio";

interface AnimationEditorProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Frame {
  id: string;
  column: number;
  row: number;
}

const AnimationEditor = ({ isOpen, onClose }: AnimationEditorProps) => {
  const { selectedGameObject } = useEditor();
  const { markUnsavedChanges } = useProject();
  const [animName, setAnimName] = useState("New Animation");
  const [frameRate, setFrameRate] = useState(12);
  const [loop, setLoop] = useState(true);
  const [frames, setFrames] = useState<Frame[]>([]);
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [spriteSheetColumns, setSpriteSheetColumns] = useState(1);
  const [spriteSheetRows, setSpriteSheetRows] = useState(1);
  const [existingClips, setExistingClips] = useState<string[]>([]);
  const [selectedClip, setSelectedClip] = useState<string | null>(null);
  const { playHit } = useAudio();
  
  useEffect(() => {
    if (!selectedGameObject) {
      onClose();
      return;
    }
    
    // Check if the GameObject has a SpriteRenderer and Animator
    const spriteRenderer = selectedGameObject.getComponent("SpriteRenderer") as SpriteRenderer;
    const animator = selectedGameObject.getComponent("Animator") as Animator;
    
    if (!spriteRenderer) {
      toast.error("Selected GameObject does not have a SpriteRenderer component");
      onClose();
      return;
    }
    
    // Get sprite sheet dimensions
    if (spriteRenderer.spriteSheet) {
      setSpriteSheetColumns(spriteRenderer.spriteSheetColumns);
      setSpriteSheetRows(spriteRenderer.spriteSheetRows);
    }
    
    // Get existing animation clips if there's an animator
    if (animator) {
      const clips: string[] = [];
      animator.clips.forEach((_, name) => {
        clips.push(name);
      });
      setExistingClips(clips);
      
      if (clips.length > 0) {
        setSelectedClip(clips[0]);
        loadClip(clips[0], animator);
      }
    }
    
  }, [selectedGameObject, onClose]);
  
  // Load an existing animation clip
  const loadClip = (clipName: string, animator: Animator) => {
    const clip = animator.clips.get(clipName);
    if (clip) {
      setAnimName(clip.name);
      setFrameRate(clip.frameRate);
      setLoop(clip.loop);
      setFrames(clip.frames.map((frame, index) => ({
        id: index.toString(),
        column: frame.column,
        row: frame.row
      })));
    }
  };
  
  // Play animation preview
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (previewPlaying && frames.length > 0) {
      timer = setInterval(() => {
        setCurrentFrame(prev => (prev + 1) % frames.length);
      }, 1000 / frameRate);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [previewPlaying, frames, frameRate]);
  
  // Add a new frame
  const addFrame = () => {
    const newFrame: Frame = {
      id: Date.now().toString(),
      column: 0,
      row: 0
    };
    
    setFrames(prev => [...prev, newFrame]);
    playHit();
  };
  
  // Remove a frame
  const removeFrame = (id: string) => {
    setFrames(prev => prev.filter(frame => frame.id !== id));
    playHit();
  };
  
  // Update frame data
  const updateFrame = (id: string, field: 'column' | 'row', value: number) => {
    setFrames(prev => 
      prev.map(frame => 
        frame.id === id 
          ? { ...frame, [field]: value } 
          : frame
      )
    );
  };
  
  // Save animation
  const saveAnimation = () => {
    if (!selectedGameObject) return;
    
    // Validate animation name
    if (!animName.trim()) {
      toast.error("Animation name cannot be empty");
      return;
    }
    
    // Validate frames
    if (frames.length === 0) {
      toast.error("Animation must have at least one frame");
      return;
    }
    
    // Get or create animator component
    let animator = selectedGameObject.getComponent("Animator") as Animator;
    if (!animator) {
      animator = selectedGameObject.addComponent(new Animator());
    }
    
    // Add or update animation clip
    animator.addClip(
      animName,
      frames.map(frame => ({ column: frame.column, row: frame.row })),
      frameRate,
      loop
    );
    
    markUnsavedChanges();
    toast.success(`Animation "${animName}" saved`);
    playHit();
    
    // Update existing clips list
    const clips: string[] = [];
    animator.clips.forEach((_, name) => {
      clips.push(name);
    });
    setExistingClips(clips);
    setSelectedClip(animName);
  };
  
  // Update sprite sheet settings
  const updateSpriteSheet = () => {
    if (!selectedGameObject) return;
    
    const spriteRenderer = selectedGameObject.getComponent("SpriteRenderer") as SpriteRenderer;
    if (!spriteRenderer || !spriteRenderer.spriteSheet) {
      toast.error("No sprite sheet available");
      return;
    }
    
    // Update sprite sheet dimensions
    spriteRenderer.spriteSheetColumns = spriteSheetColumns;
    spriteRenderer.spriteSheetRows = spriteSheetRows;
    
    markUnsavedChanges();
    toast.success("Sprite sheet settings updated");
    playHit();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Film className="h-5 w-5 mr-2" />
            Animation Editor
          </DialogTitle>
          <DialogDescription>
            Create and edit animations for the selected game object.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Animation settings */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="animationName">Animation Name</Label>
              <Input
                id="animationName"
                value={animName}
                onChange={(e) => setAnimName(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="frameRate">Frame Rate (FPS)</Label>
                <Input
                  id="frameRate"
                  type="number"
                  min="1"
                  max="60"
                  value={frameRate}
                  onChange={(e) => setFrameRate(parseInt(e.target.value) || 12)}
                />
              </div>
              
              <div className="flex items-center space-x-2 pt-8">
                <Switch
                  id="loop"
                  checked={loop}
                  onCheckedChange={setLoop}
                />
                <Label htmlFor="loop">Loop Animation</Label>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <Label>Sprite Sheet Settings</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="columns" className="text-xs">Columns</Label>
                  <Input
                    id="columns"
                    type="number"
                    min="1"
                    value={spriteSheetColumns}
                    onChange={(e) => setSpriteSheetColumns(parseInt(e.target.value) || 1)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="rows" className="text-xs">Rows</Label>
                  <Input
                    id="rows"
                    type="number"
                    min="1"
                    value={spriteSheetRows}
                    onChange={(e) => setSpriteSheetRows(parseInt(e.target.value) || 1)}
                    className="mt-1"
                  />
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={updateSpriteSheet}
                className="w-full mt-2"
              >
                Update Sprite Sheet
              </Button>
            </div>
            
            {existingClips.length > 0 && (
              <>
                <Separator />
                
                <div className="space-y-2">
                  <Label>Existing Animations</Label>
                  <Accordion type="single" collapsible>
                    {existingClips.map((clip) => (
                      <AccordionItem key={clip} value={clip}>
                        <AccordionTrigger className="text-sm py-2">
                          {clip}
                        </AccordionTrigger>
                        <AccordionContent>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedClip(clip);
                              const animator = selectedGameObject?.getComponent("Animator") as Animator;
                              if (animator) {
                                loadClip(clip, animator);
                              }
                              playHit();
                            }}
                            className="w-full"
                          >
                            Edit Animation
                          </Button>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              </>
            )}
          </div>
          
          {/* Animation frames */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Animation Frames</Label>
              <div className="flex gap-2">
                <Button
                  variant={previewPlaying ? "destructive" : "outline"}
                  size="sm"
                  onClick={() => {
                    setPreviewPlaying(!previewPlaying);
                    playHit();
                  }}
                  disabled={frames.length === 0}
                >
                  {previewPlaying ? (
                    <>
                      <Pause className="h-4 w-4 mr-1" />
                      Stop
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-1" />
                      Preview
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addFrame}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Frame
                </Button>
              </div>
            </div>
            
            <div className="border rounded-md p-2 min-h-[200px] max-h-[400px] overflow-y-auto">
              {frames.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[200px] text-gray-400">
                  <Clock className="h-8 w-8 mb-2" />
                  <p className="text-sm">No frames added yet</p>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={addFrame}
                    className="mt-2"
                  >
                    Add your first frame
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {frames.map((frame, index) => (
                    <div
                      key={frame.id}
                      className={`
                        p-2 border rounded-md
                        ${index === currentFrame && previewPlaying ? 'bg-blue-500/20 border-blue-500' : ''}
                      `}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Frame {index + 1}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFrame(frame.id)}
                          className="h-6 w-6"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor={`column-${frame.id}`} className="text-xs">Column</Label>
                          <Input
                            id={`column-${frame.id}`}
                            type="number"
                            min="0"
                            max={spriteSheetColumns - 1}
                            value={frame.column}
                            onChange={(e) => updateFrame(frame.id, 'column', parseInt(e.target.value) || 0)}
                            className="mt-1 h-7"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`row-${frame.id}`} className="text-xs">Row</Label>
                          <Input
                            id={`row-${frame.id}`}
                            type="number"
                            min="0"
                            max={spriteSheetRows - 1}
                            value={frame.row}
                            onChange={(e) => updateFrame(frame.id, 'row', parseInt(e.target.value) || 0)}
                            className="mt-1 h-7"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={saveAnimation}>
            Save Animation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AnimationEditor;
