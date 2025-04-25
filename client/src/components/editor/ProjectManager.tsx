import { useState, useRef } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  Download, 
  Upload, 
  Save, 
  FileText,
  Trash2
} from "lucide-react";
import { toast } from "sonner";
import { useAudio } from "@/lib/stores/useAudio";

interface ProjectManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProjectManager = ({ isOpen, onClose }: ProjectManagerProps) => {
  const { 
    currentProject, 
    saveProject, 
    exportProject,
    importProject,
    updateProjectName,
    updateProjectDescription,
    createScene,
    deleteScene,
    setActiveScene
  } = useProject();
  
  const [projectName, setProjectName] = useState(currentProject?.name || "");
  const [projectDescription, setProjectDescription] = useState(currentProject?.description || "");
  const [newSceneName, setNewSceneName] = useState("");
  const [exportData, setExportData] = useState("");
  const [importData, setImportData] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { playHit, playSuccess } = useAudio();
  
  // Handle saving project details
  const handleSaveDetails = () => {
    if (!projectName.trim()) {
      toast.error("Project name cannot be empty");
      return;
    }
    
    updateProjectName(projectName);
    updateProjectDescription(projectDescription);
    saveProject();
    playSuccess();
    
    toast.success("Project details saved");
  };
  
  // Handle creating a new scene
  const handleCreateScene = () => {
    if (!newSceneName.trim()) {
      toast.error("Scene name cannot be empty");
      return;
    }
    
    createScene(newSceneName);
    setNewSceneName("");
    playHit();
    
    toast.success(`Scene "${newSceneName}" created`);
  };
  
  // Handle exporting project
  const handleExport = () => {
    const exportData = exportProject();
    setExportData(exportData);
    playHit();
    
    // Create a download link
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(exportData);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${projectName || "project"}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    
    toast.success("Project exported");
  };
  
  // Handle importing project from text
  const handleImport = () => {
    if (!importData.trim()) {
      toast.error("No import data provided");
      return;
    }
    
    try {
      importProject(importData);
      setImportData("");
      playSuccess();
      
      toast.success("Project imported successfully");
      onClose();
    } catch (error) {
      console.error("Error importing project:", error);
      toast.error("Failed to import project: Invalid JSON data");
    }
  };
  
  // Handle importing project from file
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      try {
        importProject(content);
        playSuccess();
        
        toast.success("Project imported successfully");
        onClose();
      } catch (error) {
        console.error("Error importing project:", error);
        toast.error("Failed to import project: Invalid file");
      }
    };
    reader.readAsText(file);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Project Manager
          </DialogTitle>
          <DialogDescription>
            Manage your project settings, scenes, and import/export options.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="details">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="details">Project Details</TabsTrigger>
            <TabsTrigger value="scenes">Scenes</TabsTrigger>
            <TabsTrigger value="import-export">Import/Export</TabsTrigger>
          </TabsList>
          
          {/* Project Details Tab */}
          <TabsContent value="details">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="projectName">Project Name</Label>
                <Input
                  id="projectName"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="projectDescription">Description</Label>
                <Textarea
                  id="projectDescription"
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  rows={4}
                />
              </div>
              
              <Button onClick={handleSaveDetails} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Save Project Details
              </Button>
            </div>
          </TabsContent>
          
          {/* Scenes Tab */}
          <TabsContent value="scenes">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Current Scenes</Label>
                <div className="border rounded-md max-h-[200px] overflow-y-auto">
                  {currentProject?.scenes.map((scene, index) => (
                    <div 
                      key={index}
                      className={`
                        p-2 flex justify-between items-center border-b last:border-0
                        ${index === currentProject.activeSceneIndex ? 'bg-blue-500/20' : ''}
                      `}
                    >
                      <span>{scene.name}</span>
                      <div className="flex gap-1">
                        {index !== currentProject.activeSceneIndex && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setActiveScene(index);
                                playHit();
                                toast.success(`Switched to scene "${scene.name}"`);
                              }}
                            >
                              Set Active
                            </Button>
                            
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => {
                                deleteScene(index);
                                playHit();
                                toast.success(`Deleted scene "${scene.name}"`);
                              }}
                              className="h-7 w-7 text-red-500"
                              disabled={currentProject.scenes.length <= 1}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label htmlFor="newSceneName">Create New Scene</Label>
                <div className="flex gap-2">
                  <Input
                    id="newSceneName"
                    value={newSceneName}
                    onChange={(e) => setNewSceneName(e.target.value)}
                    placeholder="Enter scene name"
                  />
                  <Button onClick={handleCreateScene}>
                    Create
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* Import/Export Tab */}
          <TabsContent value="import-export">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Export Project</Label>
                <p className="text-sm text-gray-500">
                  Save your project as a JSON file that you can share or back up.
                </p>
                <Button onClick={handleExport} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Export Project
                </Button>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label>Import Project</Label>
                <p className="text-sm text-gray-500">
                  Load a project from a JSON file or paste the JSON data directly.
                </p>
                
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Import from File
                  </Button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileImport}
                    accept=".json"
                    className="hidden"
                  />
                  
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setImportData("");
                      playHit();
                    }}
                  >
                    Paste JSON
                  </Button>
                </div>
                
                {importData !== "" && (
                  <div className="mt-4 space-y-2">
                    <Label htmlFor="importData">Project JSON Data</Label>
                    <Textarea
                      id="importData"
                      value={importData}
                      onChange={(e) => setImportData(e.target.value)}
                      rows={8}
                      placeholder="Paste project JSON data here"
                    />
                    <Button onClick={handleImport} className="w-full">
                      Import
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectManager;
