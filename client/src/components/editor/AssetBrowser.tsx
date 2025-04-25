import { useState, useEffect, useRef } from "react";
import { useProject, type ProjectAsset } from "@/lib/stores/useProject";
import { 
  Button,
  buttonVariants 
} from "@/components/ui/button";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  FileUp, 
  FolderUp, 
  Image as ImageIcon, 
  FileAudio, 
  Code,
  Trash2,
  FolderOpen,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAudio } from "@/lib/stores/useAudio";

// Filter assets by type
const filterAssetsByType = (assets: ProjectAsset[], type: string) => {
  return assets.filter(asset => asset.type === type);
};

const AssetBrowser = () => {
  const { currentProject, importAsset, deleteAsset } = useProject();
  const [currentTab, setCurrentTab] = useState("all");
  const [selectedAsset, setSelectedAsset] = useState<ProjectAsset | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { playHit, playSuccess } = useAudio();
  
  // Handle file import
  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    try {
      const file = files[0];
      const asset = await importAsset(file);
      
      if (asset) {
        toast.success(`Imported ${file.name}`);
        playSuccess();
      } else {
        toast.error(`Failed to import ${file.name}`);
      }
    } catch (error) {
      console.error("Error importing file:", error);
      toast.error("Failed to import file");
    }
    
    // Clear the input value so the same file can be imported again if needed
    e.target.value = "";
  };
  
  // Trigger file input click
  const openFileDialog = () => {
    fileInputRef.current?.click();
    playHit();
  };
  
  // Handle asset deletion
  const handleDeleteAsset = () => {
    if (!selectedAsset) return;
    
    deleteAsset(selectedAsset.id);
    setSelectedAsset(null);
    setIsDeleteDialogOpen(false);
    toast.success(`Deleted ${selectedAsset.name}`);
    playHit();
  };
  
  // Get asset icon based on type
  const getAssetIcon = (type: string) => {
    switch (type) {
      case "sprite":
        return <ImageIcon className="h-4 w-4" />;
      case "audio":
        return <FileAudio className="h-4 w-4" />;
      case "script":
        return <Code className="h-4 w-4" />;
      default:
        return <FolderOpen className="h-4 w-4" />;
    }
  };
  
  // Render asset preview
  const renderAssetPreview = () => {
    if (!selectedAsset) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-400">
          <FolderOpen className="h-8 w-8 mb-2" />
          <p className="text-xs">Select an asset to preview</p>
        </div>
      );
    }
    
    switch (selectedAsset.type) {
      case "sprite":
        return (
          <div className="flex flex-col items-center h-full">
            <div className="flex-1 flex items-center justify-center">
              <img 
                src={selectedAsset.metadata.content} 
                alt={selectedAsset.name}
                className="max-w-full max-h-full object-contain"
              />
            </div>
            <div className="w-full p-2 text-xs text-center">
              {selectedAsset.name} ({Math.round(selectedAsset.metadata.size / 1024)} KB)
            </div>
          </div>
        );
      case "audio":
        return (
          <div className="flex flex-col items-center h-full">
            <div className="flex-1 flex items-center justify-center">
              <FileAudio className="h-16 w-16 text-blue-500" />
            </div>
            <div className="w-full p-2 text-xs">
              <p className="text-center">{selectedAsset.name}</p>
              <audio 
                controls 
                src={selectedAsset.metadata.content}
                className="w-full mt-2"
              />
            </div>
          </div>
        );
      case "script":
        return (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-auto p-2 bg-slate-950 rounded text-xs font-mono">
              <pre>{selectedAsset.metadata.content}</pre>
            </div>
            <div className="w-full p-2 text-xs text-center">
              {selectedAsset.name} ({Math.round(selectedAsset.metadata.size / 1024)} KB)
            </div>
          </div>
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <FolderOpen className="h-8 w-8 mb-2" />
            <p className="text-xs">Unknown asset type</p>
          </div>
        );
    }
  };
  
  return (
    <div className="h-full flex flex-col bg-slate-900 text-white overflow-hidden">
      <div className="p-2 border-b border-slate-800 flex justify-between items-center">
        <div className="flex items-center gap-1">
          <FolderOpen size={14} className="mr-1" />
          <h3 className="text-sm font-medium">Assets</h3>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            title="Import Asset"
            onClick={openFileDialog}
          >
            <FileUp size={14} />
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileImport}
            className="hidden"
            accept=".png,.jpg,.jpeg,.gif,.svg,.mp3,.wav,.ogg,.js,.ts"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            title="Refresh"
            onClick={() => playHit()}
          >
            <RefreshCw size={14} />
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="all" value={currentTab} onValueChange={setCurrentTab} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="grid grid-cols-4 h-8">
          <TabsTrigger value="all" className="text-xs py-1">All</TabsTrigger>
          <TabsTrigger value="sprites" className="text-xs py-1">Sprites</TabsTrigger>
          <TabsTrigger value="audio" className="text-xs py-1">Audio</TabsTrigger>
          <TabsTrigger value="scripts" className="text-xs py-1">Scripts</TabsTrigger>
        </TabsList>
        
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Asset list */}
          <div className="w-full md:w-1/2 overflow-y-auto border-r border-slate-800">
            <TabsContent value="all" className="m-0 p-0 h-full">
              <AssetList 
                assets={currentProject?.assets || []}
                selectedAsset={selectedAsset}
                onSelectAsset={setSelectedAsset}
                onDeleteAsset={(asset) => {
                  setSelectedAsset(asset);
                  setIsDeleteDialogOpen(true);
                }}
              />
            </TabsContent>
            <TabsContent value="sprites" className="m-0 p-0 h-full">
              <AssetList 
                assets={filterAssetsByType(currentProject?.assets || [], "sprite")}
                selectedAsset={selectedAsset}
                onSelectAsset={setSelectedAsset}
                onDeleteAsset={(asset) => {
                  setSelectedAsset(asset);
                  setIsDeleteDialogOpen(true);
                }}
              />
            </TabsContent>
            <TabsContent value="audio" className="m-0 p-0 h-full">
              <AssetList 
                assets={filterAssetsByType(currentProject?.assets || [], "audio")}
                selectedAsset={selectedAsset}
                onSelectAsset={setSelectedAsset}
                onDeleteAsset={(asset) => {
                  setSelectedAsset(asset);
                  setIsDeleteDialogOpen(true);
                }}
              />
            </TabsContent>
            <TabsContent value="scripts" className="m-0 p-0 h-full">
              <AssetList 
                assets={filterAssetsByType(currentProject?.assets || [], "script")}
                selectedAsset={selectedAsset}
                onSelectAsset={setSelectedAsset}
                onDeleteAsset={(asset) => {
                  setSelectedAsset(asset);
                  setIsDeleteDialogOpen(true);
                }}
              />
            </TabsContent>
          </div>
          
          {/* Asset preview */}
          <div className="w-full md:w-1/2 overflow-auto bg-slate-800">
            {renderAssetPreview()}
          </div>
        </div>
      </Tabs>
      
      {/* Delete confirmation dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Asset</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this asset? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteAsset}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface AssetListProps {
  assets: ProjectAsset[];
  selectedAsset: ProjectAsset | null;
  onSelectAsset: (asset: ProjectAsset) => void;
  onDeleteAsset: (asset: ProjectAsset) => void;
}

const AssetList = ({ assets, selectedAsset, onSelectAsset, onDeleteAsset }: AssetListProps) => {
  const { playHit } = useAudio();
  
  if (assets.length === 0) {
    return (
      <div className="p-4 text-center text-gray-400 text-sm">
        <FolderUp className="h-8 w-8 mx-auto mb-2" />
        <p>No assets found</p>
        <p className="text-xs mt-1">Import assets to get started</p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-2 gap-1 p-1">
      {assets.map((asset) => (
        <ContextMenu key={asset.id}>
          <ContextMenuTrigger>
            <div
              className={cn(
                "p-2 rounded cursor-pointer hover:bg-slate-700 transition-colors",
                selectedAsset?.id === asset.id ? "bg-blue-900/30" : ""
              )}
              onClick={() => {
                onSelectAsset(asset);
                playHit();
              }}
            >
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 flex items-center justify-center mb-1 text-blue-400">
                  {getAssetIcon(asset.type)}
                </div>
                <p className="text-xs text-center truncate w-full" title={asset.name}>
                  {asset.name}
                </p>
              </div>
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent className="w-32">
            <ContextMenuItem
              onClick={() => onDeleteAsset(asset)}
              className="text-red-500"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      ))}
    </div>
  );
};

export default AssetBrowser;
