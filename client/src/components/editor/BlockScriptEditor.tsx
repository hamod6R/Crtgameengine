import { useState, useRef, useEffect } from "react";
import { useEditor } from "@/lib/stores/useEditor";
import { useProject } from "@/lib/stores/useProject";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { GameObject } from "@/lib/engine/GameObject";
import { Script } from "@/lib/engine/components/Script";
import { 
  PuzzlePiece, 
  Plus, 
  Save, 
  Trash2, 
  MoveHorizontal, 
  ArrowRight, 
  MousePointer, 
  Check, 
  X
} from "lucide-react";
import { toast } from "sonner";
import { useAudio } from "@/lib/stores/useAudio";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { cn } from "@/lib/utils";

// Define block types and categories
const BLOCK_CATEGORIES = [
  { id: "events", name: "Events", color: "#4CAF50" },
  { id: "control", name: "Control", color: "#FF9800" },
  { id: "movement", name: "Movement", color: "#2196F3" },
  { id: "appearance", name: "Appearance", color: "#9C27B0" },
  { id: "variables", name: "Variables", color: "#F44336" },
  { id: "logic", name: "Logic", color: "#607D8B" }
];

// Define block templates
const BLOCK_TEMPLATES = [
  // Events
  { id: "event_start", category: "events", name: "When game starts", inputs: [], outputs: ["next"] },
  { id: "event_click", category: "events", name: "When clicked", inputs: [], outputs: ["next"] },
  { id: "event_collision", category: "events", name: "When colliding with", inputs: ["object"], outputs: ["next"] },
  
  // Control
  { id: "control_wait", category: "control", name: "Wait seconds", inputs: ["seconds"], outputs: ["next"] },
  { id: "control_repeat", category: "control", name: "Repeat times", inputs: ["times"], outputs: ["body", "next"] },
  { id: "control_if", category: "control", name: "If condition", inputs: ["condition"], outputs: ["true", "false", "next"] },
  
  // Movement
  { id: "move_forward", category: "movement", name: "Move forward steps", inputs: ["steps"], outputs: ["next"] },
  { id: "move_position", category: "movement", name: "Set position", inputs: ["x", "y"], outputs: ["next"] },
  { id: "move_rotate", category: "movement", name: "Rotate degrees", inputs: ["degrees"], outputs: ["next"] },
  
  // Appearance
  { id: "appear_show", category: "appearance", name: "Show", inputs: [], outputs: ["next"] },
  { id: "appear_hide", category: "appearance", name: "Hide", inputs: [], outputs: ["next"] },
  { id: "appear_color", category: "appearance", name: "Set color to", inputs: ["color"], outputs: ["next"] },
  
  // Variables
  { id: "var_set", category: "variables", name: "Set variable to", inputs: ["variable", "value"], outputs: ["next"] },
  { id: "var_change", category: "variables", name: "Change variable by", inputs: ["variable", "value"], outputs: ["next"] },
  
  // Logic
  { id: "logic_equals", category: "logic", name: "Equals", inputs: ["a", "b"], outputs: ["result"] },
  { id: "logic_greater", category: "logic", name: "Greater than", inputs: ["a", "b"], outputs: ["result"] },
  { id: "logic_less", category: "logic", name: "Less than", inputs: ["a", "b"], outputs: ["result"] }
];

// Interface for a block instance
interface Block {
  id: string;
  templateId: string;
  values: Record<string, any>;
  next: Record<string, string | null>;
}

// Interface for a visual script
interface VisualScript {
  name: string;
  blocks: Block[];
  variables: string[];
  rootBlockId: string | null;
}

const BlockScriptEditor = () => {
  const { selectedGameObject } = useEditor();
  const { markUnsavedChanges } = useProject();
  const { playHit, playSuccess } = useAudio();
  
  const [activeCategory, setActiveCategory] = useState<string>("events");
  const [scripts, setScripts] = useState<VisualScript[]>([]);
  const [currentScriptIndex, setCurrentScriptIndex] = useState<number>(-1);
  const [scriptName, setScriptName] = useState<string>("");
  const [showNewScriptForm, setShowNewScriptForm] = useState<boolean>(false);
  
  // Load scripts from the selected game object
  useEffect(() => {
    if (!selectedGameObject) return;
    
    // Look for Script components that have block-based scripts
    const scriptComponents = selectedGameObject.getComponents("Script") as Script[];
    const visualScripts: VisualScript[] = [];
    
    scriptComponents.forEach(script => {
      // Check if this script has block data in its variables
      const blockData = script.getVariable("blockData");
      if (blockData) {
        try {
          // Parse the block data (it's stored as a string)
          const parsedData = JSON.parse(blockData);
          visualScripts.push({
            name: script.name,
            blocks: parsedData.blocks || [],
            variables: parsedData.variables || [],
            rootBlockId: parsedData.rootBlockId || null
          });
        } catch (error) {
          console.error("Failed to parse block data", error);
        }
      }
    });
    
    setScripts(visualScripts);
    setCurrentScriptIndex(visualScripts.length > 0 ? 0 : -1);
  }, [selectedGameObject]);
  
  // Get the current script being edited
  const currentScript = currentScriptIndex >= 0 && currentScriptIndex < scripts.length
    ? scripts[currentScriptIndex]
    : null;
  
  // Create a new visual script
  const createNewScript = () => {
    if (!scriptName.trim()) {
      toast.error("Script name cannot be empty");
      return;
    }
    
    // Check for duplicate names
    if (scripts.some(script => script.name === scriptName)) {
      toast.error("A script with this name already exists");
      return;
    }
    
    const newScript: VisualScript = {
      name: scriptName,
      blocks: [],
      variables: [],
      rootBlockId: null
    };
    
    setScripts([...scripts, newScript]);
    setCurrentScriptIndex(scripts.length);
    setScriptName("");
    setShowNewScriptForm(false);
    playHit();
  };
  
  // Add a block to the current script
  const addBlock = (templateId: string) => {
    if (!currentScript) return;
    
    const template = BLOCK_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;
    
    const newBlock: Block = {
      id: `block_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      templateId,
      values: {},
      next: {}
    };
    
    // Initialize default values for inputs
    template.inputs.forEach(input => {
      newBlock.values[input] = "";
    });
    
    // Initialize outputs with null connections
    template.outputs.forEach(output => {
      newBlock.next[output] = null;
    });
    
    const updatedScript = {
      ...currentScript,
      blocks: [...currentScript.blocks, newBlock],
      rootBlockId: currentScript.rootBlockId || newBlock.id
    };
    
    const updatedScripts = [...scripts];
    updatedScripts[currentScriptIndex] = updatedScript;
    
    setScripts(updatedScripts);
    playHit();
  };
  
  // Save scripts to the game object
  const saveScripts = () => {
    if (!selectedGameObject) return;
    
    scripts.forEach(script => {
      let scriptComponent = selectedGameObject.getComponents("Script")
        .find((s: Script) => s.name === script.name) as Script | undefined;
      
      // If the script component doesn't exist, create it
      if (!scriptComponent) {
        scriptComponent = new Script(script.name);
        selectedGameObject.addComponent(scriptComponent);
      }
      
      // Save the block data to the script component
      const blockData = JSON.stringify({
        blocks: script.blocks,
        variables: script.variables,
        rootBlockId: script.rootBlockId
      });
      
      scriptComponent.setVariable("blockData", blockData);
      
      // Generate code from blocks (simplified for now)
      const codeCallbacks = generateCodeFromBlocks(script);
      
      // Update script callbacks
      Object.keys(codeCallbacks).forEach(key => {
        (scriptComponent as any).callbacks[key] = codeCallbacks[key];
      });
    });
    
    markUnsavedChanges();
    toast.success("Scripts saved successfully");
    playSuccess();
  };
  
  // Generate JavaScript code from block-based script
  const generateCodeFromBlocks = (script: VisualScript): Record<string, Function> => {
    // This is a simplified version - in a real implementation, 
    // this would generate proper JavaScript from the blocks
    const callbacks: Record<string, Function> = {};
    
    if (script.blocks.length > 0) {
      // Check for "When game starts" blocks and create start callback
      const startBlocks = script.blocks.filter(block => 
        block.templateId === "event_start"
      );
      
      if (startBlocks.length > 0) {
        callbacks.start = () => {
          console.log(`Script ${script.name} started`);
        };
      }
      
      // Check for "When clicked" blocks and create click callback
      const clickBlocks = script.blocks.filter(block => 
        block.templateId === "event_click"
      );
      
      if (clickBlocks.length > 0) {
        callbacks.onClick = () => {
          console.log(`Script ${script.name} clicked`);
        };
      }
      
      // Check for collision blocks
      const collisionBlocks = script.blocks.filter(block => 
        block.templateId === "event_collision"
      );
      
      if (collisionBlocks.length > 0) {
        callbacks.onCollisionEnter = (other: any) => {
          console.log(`Script ${script.name} collided with`, other);
        };
      }
    }
    
    return callbacks;
  };
  
  // Render a block in the workspace
  const renderBlock = (block: Block, index: number) => {
    const template = BLOCK_TEMPLATES.find(t => t.id === block.templateId);
    if (!template) return null;
    
    const category = BLOCK_CATEGORIES.find(c => c.id === template.category);
    
    return (
      <Draggable key={block.id} draggableId={block.id} index={index}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className="mb-2"
          >
            <div 
              className="rounded-lg p-3 shadow-md" 
              style={{ 
                backgroundColor: category?.color || "#ccc",
                borderLeft: "10px solid " + (category ? darkenColor(category.color, 30) : "#999")
              }}
            >
              <div className="font-medium text-white mb-2">{template.name}</div>
              
              {template.inputs.length > 0 && (
                <div className="space-y-2 mb-2">
                  {template.inputs.map(input => (
                    <div key={input} className="flex items-center gap-2">
                      <Label className="text-xs text-white">{input}:</Label>
                      <Input
                        value={block.values[input] || ""}
                        onChange={(e) => updateBlockValue(block.id, input, e.target.value)}
                        className="h-7 text-xs bg-white/20 text-white border-white/30"
                        placeholder={`Enter ${input}`}
                      />
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 text-white hover:bg-white/20"
                  onClick={() => removeBlock(block.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </Draggable>
    );
  };
  
  // Helper function to darken a color
  const darkenColor = (color: string, percent: number) => {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) - amt;
    const G = (num >> 8 & 0x00FF) - amt;
    const B = (num & 0x0000FF) - amt;
    
    return "#" + (
      0x1000000 +
      (R < 0 ? 0 : R) * 0x10000 +
      (G < 0 ? 0 : G) * 0x100 +
      (B < 0 ? 0 : B)
    ).toString(16).slice(1);
  };
  
  // Handle block value update
  const updateBlockValue = (blockId: string, input: string, value: any) => {
    if (!currentScript) return;
    
    const updatedBlocks = currentScript.blocks.map(block => {
      if (block.id === blockId) {
        return {
          ...block,
          values: {
            ...block.values,
            [input]: value
          }
        };
      }
      return block;
    });
    
    const updatedScript = {
      ...currentScript,
      blocks: updatedBlocks
    };
    
    const updatedScripts = [...scripts];
    updatedScripts[currentScriptIndex] = updatedScript;
    
    setScripts(updatedScripts);
  };
  
  // Remove a block
  const removeBlock = (blockId: string) => {
    if (!currentScript) return;
    
    const updatedBlocks = currentScript.blocks.filter(block => block.id !== blockId);
    
    // Update the root block ID if needed
    let rootBlockId = currentScript.rootBlockId;
    if (rootBlockId === blockId) {
      rootBlockId = updatedBlocks.length > 0 ? updatedBlocks[0].id : null;
    }
    
    const updatedScript = {
      ...currentScript,
      blocks: updatedBlocks,
      rootBlockId
    };
    
    const updatedScripts = [...scripts];
    updatedScripts[currentScriptIndex] = updatedScript;
    
    setScripts(updatedScripts);
    playHit();
  };
  
  // Handle drag and drop reordering
  const handleDragEnd = (result: any) => {
    if (!result.destination || !currentScript) return;
    
    const items = Array.from(currentScript.blocks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    const updatedScript = {
      ...currentScript,
      blocks: items
    };
    
    const updatedScripts = [...scripts];
    updatedScripts[currentScriptIndex] = updatedScript;
    
    setScripts(updatedScripts);
  };
  
  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center p-2 border-b">
        <div className="font-medium flex items-center">
          <PuzzlePiece className="h-4 w-4 mr-2" />
          Block Script Editor
        </div>
        
        <div className="flex gap-1">
          <Button
            variant="ghost" 
            size="sm"
            className="h-7"
            onClick={() => setShowNewScriptForm(true)}
          >
            <Plus className="h-3 w-3 mr-1" />
            New Script
          </Button>
          
          <Button
            variant="ghost" 
            size="sm"
            className="h-7"
            onClick={saveScripts}
          >
            <Save className="h-3 w-3 mr-1" />
            Save
          </Button>
        </div>
      </div>
      
      {showNewScriptForm ? (
        <div className="p-3 border-b">
          <Label htmlFor="scriptName">Script Name</Label>
          <div className="flex gap-2 mt-1">
            <Input
              id="scriptName"
              value={scriptName}
              onChange={(e) => setScriptName(e.target.value)}
              placeholder="Enter script name"
            />
            <Button 
              size="sm" 
              onClick={createNewScript}
              className="whitespace-nowrap"
            >
              Create
            </Button>
            <Button 
              size="sm" 
              variant="ghost"
              onClick={() => setShowNewScriptForm(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : scripts.length > 0 ? (
        <div className="p-2 border-b">
          <Label className="mb-1 block">Script</Label>
          <select
            className="w-full p-2 rounded border bg-background"
            value={currentScriptIndex}
            onChange={(e) => setCurrentScriptIndex(parseInt(e.target.value))}
          >
            {scripts.map((script, index) => (
              <option key={index} value={index}>
                {script.name}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="p-3 text-center text-muted-foreground border-b">
          No scripts found. Create a new script to get started.
        </div>
      )}
      
      <div className="flex-1 flex overflow-hidden">
        {/* Block Categories and Templates */}
        <div className="w-1/3 border-r overflow-auto">
          <Tabs defaultValue={activeCategory} value={activeCategory} onValueChange={setActiveCategory}>
            <TabsList className="w-full grid grid-cols-3">
              {BLOCK_CATEGORIES.slice(0, 3).map(category => (
                <TabsTrigger 
                  key={category.id} 
                  value={category.id}
                  className="text-xs"
                >
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsList className="w-full grid grid-cols-3">
              {BLOCK_CATEGORIES.slice(3).map(category => (
                <TabsTrigger 
                  key={category.id} 
                  value={category.id}
                  className="text-xs"
                >
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {BLOCK_CATEGORIES.map(category => (
              <TabsContent key={category.id} value={category.id} className="p-2 space-y-2">
                {BLOCK_TEMPLATES
                  .filter(template => template.category === category.id)
                  .map(template => (
                    <div
                      key={template.id}
                      className="p-2 rounded cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"
                      style={{ 
                        backgroundColor: category.color + "20",
                        borderLeft: "5px solid " + category.color
                      }}
                      onClick={() => addBlock(template.id)}
                    >
                      <span className="text-sm font-medium">{template.name}</span>
                    </div>
                  ))
                }
              </TabsContent>
            ))}
          </Tabs>
        </div>
        
        {/* Script Workspace */}
        <div className="flex-1 overflow-auto p-3 bg-slate-50 dark:bg-slate-800">
          {currentScript ? (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="blocks">
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="min-h-full"
                  >
                    {currentScript.blocks.length > 0 ? (
                      currentScript.blocks.map((block, index) => 
                        renderBlock(block, index)
                      )
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4">
                        <PuzzlePiece className="h-10 w-10 mb-2 opacity-20" />
                        <p>Drag blocks from the left panel to build your script</p>
                      </div>
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <PuzzlePiece className="h-12 w-12 mb-2 opacity-20" />
              <p>Select or create a script to start building</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlockScriptEditor;