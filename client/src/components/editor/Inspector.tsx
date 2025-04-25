import { useState, useEffect } from "react";
import { useEditor } from "@/lib/stores/useEditor";
import { useProject } from "@/lib/stores/useProject";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Vector2 } from "@/lib/engine/utils/Vector2";
import { Transform } from "@/lib/engine/components/Transform";
import { SpriteRenderer } from "@/lib/engine/components/SpriteRenderer";
import { RigidBody } from "@/lib/engine/components/RigidBody";
import { Collider } from "@/lib/engine/components/Collider";
import { Script } from "@/lib/engine/components/Script";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BlockScriptEditor from "./BlockScriptEditor";
import { 
  Settings,
  Plus,
  Trash2,
  AlignVerticalJustifyCenter,
  Box,
  Circle,
  Image as ImageIcon,
  CircleOff,
  ArrowDown,
  Hash,
  Code
} from "lucide-react";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger 
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useAudio } from "@/lib/stores/useAudio";

interface VectorInputProps {
  label: string;
  value: Vector2;
  onChange: (value: Vector2) => void;
  step?: number;
  disabled?: boolean;
}

interface NumberInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
  disabled?: boolean;
}

interface ColorInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const ComponentTypes = [
  { name: "Sprite Renderer", type: "SpriteRenderer" },
  { name: "Rigid Body", type: "RigidBody" },
  { name: "Box Collider", type: "Collider", subtype: "box" },
  { name: "Circle Collider", type: "Collider", subtype: "circle" },
  { name: "Animator", type: "Animator" },
  { name: "Script", type: "Script" }
];

const Inspector = () => {
  const { selectedGameObject, isPlaying } = useEditor();
  const { markUnsavedChanges } = useProject();
  const [objectName, setObjectName] = useState("");
  const [tag, setTag] = useState("");
  const [isActive, setIsActive] = useState(true);
  const { playHit } = useAudio();
  
  // Reset state when selected object changes
  useEffect(() => {
    if (selectedGameObject) {
      setObjectName(selectedGameObject.name);
      setTag(selectedGameObject.tag);
      setIsActive(selectedGameObject.isActive);
    }
  }, [selectedGameObject]);
  
  // Update object name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setObjectName(e.target.value);
  };
  
  const handleNameBlur = () => {
    if (!selectedGameObject) return;
    if (objectName.trim() === "") {
      setObjectName(selectedGameObject.name);
      return;
    }
    
    selectedGameObject.name = objectName;
    markUnsavedChanges();
    playHit();
  };
  
  // Update object tag
  const handleTagChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTag(e.target.value);
  };
  
  const handleTagBlur = () => {
    if (!selectedGameObject) return;
    if (tag.trim() === "") {
      setTag(selectedGameObject.tag);
      return;
    }
    
    selectedGameObject.tag = tag;
    markUnsavedChanges();
    playHit();
  };
  
  // Toggle object active state
  const toggleActive = (checked: boolean) => {
    if (!selectedGameObject) return;
    
    selectedGameObject.isActive = checked;
    setIsActive(checked);
    markUnsavedChanges();
    playHit();
  };
  
  // Add component to selected object
  const addComponent = (componentType: string, subtype?: string) => {
    if (!selectedGameObject) return;
    
    // Check if the component already exists
    if (componentType !== "Collider" && selectedGameObject.getComponent(componentType)) {
      toast.error(`${componentType} already exists on this object`);
      return;
    }
    
    try {
      switch (componentType) {
        case "SpriteRenderer": {
          const spriteRenderer = new SpriteRenderer();
          selectedGameObject.addComponent(spriteRenderer);
          break;
        }
        case "RigidBody": {
          const rigidBody = new RigidBody();
          selectedGameObject.addComponent(rigidBody);
          break;
        }
        case "Collider": {
          const collider = new Collider(subtype as "box" | "circle");
          if (subtype === "box") {
            collider.width = 100;
            collider.height = 100;
          } else {
            collider.radius = 50;
          }
          selectedGameObject.addComponent(collider);
          break;
        }
        case "Script": {
          const script = new Script(`Script_${new Date().getTime()}`);
          selectedGameObject.addComponent(script);
          break;
        }
        // Additional component types would go here
        default:
          toast.error(`Component type ${componentType} not implemented`);
          return;
      }
      
      markUnsavedChanges();
      toast.success(`Added ${componentType} component`);
      playHit();
    } catch (error) {
      console.error("Error adding component:", error);
      toast.error("Failed to add component");
    }
  };
  
  // Remove component from selected object
  const removeComponent = (componentType: string) => {
    if (!selectedGameObject) return;
    
    try {
      const removed = selectedGameObject.removeComponent(componentType);
      if (removed) {
        markUnsavedChanges();
        toast.success(`Removed ${componentType} component`);
        playHit();
      } else {
        toast.error(`Failed to remove ${componentType} component`);
      }
    } catch (error) {
      console.error("Error removing component:", error);
      toast.error("Failed to remove component");
    }
  };
  
  // Render Vector2 input
  const VectorInput = ({ label, value, onChange, step = 1, disabled = false }: VectorInputProps) => {
    return (
      <div className="grid grid-cols-3 items-center gap-2 mb-1">
        <Label className="text-xs">{label}</Label>
        <Input
          type="number"
          value={value.x}
          onChange={(e) => {
            const newValue = parseFloat(e.target.value) || 0;
            onChange(new Vector2(newValue, value.y));
          }}
          step={step}
          disabled={disabled}
          className="h-7 text-xs"
        />
        <Input
          type="number"
          value={value.y}
          onChange={(e) => {
            const newValue = parseFloat(e.target.value) || 0;
            onChange(new Vector2(value.x, newValue));
          }}
          step={step}
          disabled={disabled}
          className="h-7 text-xs"
        />
      </div>
    );
  };
  
  // Render number input
  const NumberInput = ({ 
    label, 
    value, 
    onChange, 
    step = 1, 
    min, 
    max, 
    disabled = false 
  }: NumberInputProps) => {
    return (
      <div className="grid grid-cols-3 items-center gap-2 mb-1">
        <Label className="text-xs">{label}</Label>
        <Input
          type="number"
          value={value}
          onChange={(e) => {
            const newValue = parseFloat(e.target.value) || 0;
            onChange(newValue);
          }}
          step={step}
          min={min}
          max={max}
          disabled={disabled}
          className="h-7 text-xs col-span-2"
        />
      </div>
    );
  };
  
  // Render color input
  const ColorInput = ({ label, value, onChange, disabled = false }: ColorInputProps) => {
    return (
      <div className="grid grid-cols-3 items-center gap-2 mb-1">
        <Label className="text-xs">{label}</Label>
        <div className="col-span-2 flex gap-2">
          <div 
            className="w-7 h-7 rounded border"
            style={{ backgroundColor: value }} 
          />
          <Input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="h-7 text-xs flex-1"
          />
        </div>
      </div>
    );
  };
  
  // Render Transform component
  const TransformComponent = () => {
    if (!selectedGameObject) return null;
    
    const transform = selectedGameObject.getComponent("Transform") as Transform;
    if (!transform) return null;
    
    return (
      <AccordionItem value="transform">
        <AccordionTrigger className="py-2 px-2 text-sm">
          <div className="flex items-center">
            <AlignVerticalJustifyCenter className="h-4 w-4 mr-2" />
            Transform
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-2 py-2">
          <VectorInput
            label="Position"
            value={transform.position}
            onChange={(newPos) => {
              transform.position = newPos;
              markUnsavedChanges();
            }}
            disabled={isPlaying}
          />
          <NumberInput
            label="Rotation"
            value={transform.rotation}
            onChange={(newRot) => {
              transform.rotation = newRot;
              markUnsavedChanges();
            }}
            step={1}
            disabled={isPlaying}
          />
          <VectorInput
            label="Scale"
            value={transform.scale}
            onChange={(newScale) => {
              transform.scale = newScale;
              markUnsavedChanges();
            }}
            step={0.1}
            disabled={isPlaying}
          />
        </AccordionContent>
      </AccordionItem>
    );
  };
  
  // Render SpriteRenderer component
  const SpriteRendererComponent = () => {
    if (!selectedGameObject) return null;
    
    const spriteRenderer = selectedGameObject.getComponent("SpriteRenderer") as SpriteRenderer;
    if (!spriteRenderer) return null;
    
    return (
      <AccordionItem value="spriterenderer">
        <div className="flex justify-between items-center">
          <AccordionTrigger className="py-2 px-2 text-sm flex-1">
            <div className="flex items-center">
              <ImageIcon className="h-4 w-4 mr-2" />
              Sprite Renderer
            </div>
          </AccordionTrigger>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 mr-2"
            onClick={() => removeComponent("SpriteRenderer")}
            title="Remove Component"
            disabled={isPlaying}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
        <AccordionContent className="px-2 py-2">
          <ColorInput
            label="Color"
            value={spriteRenderer.color}
            onChange={(newColor) => {
              spriteRenderer.color = newColor;
              markUnsavedChanges();
            }}
            disabled={isPlaying}
          />
          <NumberInput
            label="Width"
            value={spriteRenderer.width}
            onChange={(newWidth) => {
              spriteRenderer.width = newWidth;
              markUnsavedChanges();
            }}
            step={1}
            min={1}
            disabled={isPlaying}
          />
          <NumberInput
            label="Height"
            value={spriteRenderer.height}
            onChange={(newHeight) => {
              spriteRenderer.height = newHeight;
              markUnsavedChanges();
            }}
            step={1}
            min={1}
            disabled={isPlaying}
          />
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="flipX"
                checked={spriteRenderer.flipX}
                onCheckedChange={(checked) => {
                  spriteRenderer.flipX = checked === true;
                  markUnsavedChanges();
                }}
                disabled={isPlaying}
              />
              <label
                htmlFor="flipX"
                className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Flip X
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="flipY"
                checked={spriteRenderer.flipY}
                onCheckedChange={(checked) => {
                  spriteRenderer.flipY = checked === true;
                  markUnsavedChanges();
                }}
                disabled={isPlaying}
              />
              <label
                htmlFor="flipY"
                className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Flip Y
              </label>
            </div>
          </div>
          <NumberInput
            label="Opacity"
            value={spriteRenderer.opacity}
            onChange={(newOpacity) => {
              spriteRenderer.opacity = Math.max(0, Math.min(1, newOpacity));
              markUnsavedChanges();
            }}
            step={0.1}
            min={0}
            max={1}
            disabled={isPlaying}
          />
        </AccordionContent>
      </AccordionItem>
    );
  };
  
  // Render Collider component
  const ColliderComponent = () => {
    if (!selectedGameObject) return null;
    
    const collider = selectedGameObject.getComponent("Collider") as Collider;
    if (!collider) return null;
    
    return (
      <AccordionItem value="collider">
        <div className="flex justify-between items-center">
          <AccordionTrigger className="py-2 px-2 text-sm flex-1">
            <div className="flex items-center">
              {collider.type === "box" ? (
                <Box className="h-4 w-4 mr-2" />
              ) : (
                <Circle className="h-4 w-4 mr-2" />
              )}
              {collider.type === "box" ? "Box Collider" : "Circle Collider"}
            </div>
          </AccordionTrigger>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 mr-2"
            onClick={() => removeComponent("Collider")}
            title="Remove Component"
            disabled={isPlaying}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
        <AccordionContent className="px-2 py-2">
          {collider.type === "box" ? (
            <>
              <NumberInput
                label="Width"
                value={collider.width}
                onChange={(newWidth) => {
                  collider.width = newWidth;
                  markUnsavedChanges();
                }}
                step={1}
                min={1}
                disabled={isPlaying}
              />
              <NumberInput
                label="Height"
                value={collider.height}
                onChange={(newHeight) => {
                  collider.height = newHeight;
                  markUnsavedChanges();
                }}
                step={1}
                min={1}
                disabled={isPlaying}
              />
            </>
          ) : (
            <NumberInput
              label="Radius"
              value={collider.radius}
              onChange={(newRadius) => {
                collider.radius = newRadius;
                markUnsavedChanges();
              }}
              step={1}
              min={1}
              disabled={isPlaying}
            />
          )}
          <VectorInput
            label="Offset"
            value={collider.offset}
            onChange={(newOffset) => {
              collider.offset = newOffset;
              markUnsavedChanges();
            }}
            disabled={isPlaying}
          />
          <div className="flex items-center justify-between mt-2">
            <Label className="text-xs">Is Trigger</Label>
            <Switch
              checked={collider.isTrigger}
              onCheckedChange={(checked) => {
                collider.isTrigger = checked;
                markUnsavedChanges();
              }}
              disabled={isPlaying}
            />
          </div>
        </AccordionContent>
      </AccordionItem>
    );
  };
  
  // Render RigidBody component
  const RigidBodyComponent = () => {
    if (!selectedGameObject) return null;
    
    const rigidBody = selectedGameObject.getComponent("RigidBody") as RigidBody;
    if (!rigidBody) return null;
    
    return (
      <AccordionItem value="rigidbody">
        <div className="flex justify-between items-center">
          <AccordionTrigger className="py-2 px-2 text-sm flex-1">
            <div className="flex items-center">
              <ArrowDown className="h-4 w-4 mr-2" />
              Rigid Body
            </div>
          </AccordionTrigger>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 mr-2"
            onClick={() => removeComponent("RigidBody")}
            title="Remove Component"
            disabled={isPlaying}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
        <AccordionContent className="px-2 py-2">
          <NumberInput
            label="Mass"
            value={rigidBody.mass}
            onChange={(newMass) => {
              rigidBody.mass = Math.max(0.001, newMass);
              markUnsavedChanges();
            }}
            step={0.1}
            min={0.001}
            disabled={isPlaying}
          />
          <NumberInput
            label="Drag"
            value={rigidBody.drag}
            onChange={(newDrag) => {
              rigidBody.drag = Math.max(0, newDrag);
              markUnsavedChanges();
            }}
            step={0.01}
            min={0}
            disabled={isPlaying}
          />
          <div className="flex items-center justify-between mt-2">
            <Label className="text-xs">Use Gravity</Label>
            <Switch
              checked={rigidBody.useGravity}
              onCheckedChange={(checked) => {
                rigidBody.useGravity = checked;
                markUnsavedChanges();
              }}
              disabled={isPlaying}
            />
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <Label className="text-xs">Is Kinematic</Label>
            <Switch
              checked={rigidBody.isKinematic}
              onCheckedChange={(checked) => {
                rigidBody.isKinematic = checked;
                markUnsavedChanges();
              }}
              disabled={isPlaying}
            />
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <Label className="text-xs">Freeze Rotation</Label>
            <Switch
              checked={rigidBody.freezeRotation}
              onCheckedChange={(checked) => {
                rigidBody.freezeRotation = checked;
                markUnsavedChanges();
              }}
              disabled={isPlaying}
            />
          </div>
          
          <NumberInput
            label="Gravity Scale"
            value={rigidBody.gravityScale}
            onChange={(newScale) => {
              rigidBody.gravityScale = newScale;
              markUnsavedChanges();
            }}
            step={0.1}
            disabled={isPlaying}
          />
        </AccordionContent>
      </AccordionItem>
    );
  };
  
  return (
    <div className="h-full flex flex-col overflow-hidden bg-slate-900 text-white">
      <div className="p-2 border-b border-slate-800 flex justify-between items-center">
        <div className="flex items-center gap-1">
          <Settings size={14} className="mr-1" />
          <h3 className="text-sm font-medium">Inspector</h3>
        </div>
        
        {selectedGameObject && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Plus size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                {ComponentTypes.map((component) => (
                  <DropdownMenuItem
                    key={component.name}
                    onClick={() => addComponent(component.type, component.subtype)}
                    disabled={isPlaying}
                  >
                    {component.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {!selectedGameObject ? (
          <div className="p-4 text-center text-gray-400 text-sm">
            No object selected
          </div>
        ) : (
          <>
            <div className="p-2 border-b border-slate-800">
              <div className="mb-2">
                <Label htmlFor="objectName" className="text-xs">Name</Label>
                <Input
                  id="objectName"
                  value={objectName}
                  onChange={handleNameChange}
                  onBlur={handleNameBlur}
                  className="h-7 text-sm"
                  disabled={isPlaying}
                />
              </div>
              
              <div className="mb-2">
                <Label htmlFor="objectTag" className="text-xs">Tag</Label>
                <Input
                  id="objectTag"
                  value={tag}
                  onChange={handleTagChange}
                  onBlur={handleTagBlur}
                  className="h-7 text-sm"
                  disabled={isPlaying}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="objectActive" className="text-xs">Active</Label>
                <Switch
                  id="objectActive"
                  checked={isActive}
                  onCheckedChange={toggleActive}
                  disabled={isPlaying}
                />
              </div>
            </div>
            
            <Tabs defaultValue="components">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="components">Components</TabsTrigger>
                <TabsTrigger value="code">Code</TabsTrigger>
              </TabsList>
              
              <TabsContent value="components" className="p-0">
                <Accordion type="multiple" defaultValue={["transform"]}>
                  <TransformComponent />
                  <SpriteRendererComponent />
                  <ColliderComponent />
                  <RigidBodyComponent />
                </Accordion>
              </TabsContent>
              
              <TabsContent value="code" className="p-0 h-full">
                <BlockScriptEditor />
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
};

export default Inspector;
