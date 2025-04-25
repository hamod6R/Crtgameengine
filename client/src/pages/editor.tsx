import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Editor from "@/components/editor/Editor";
import { useEditor } from "@/lib/stores/useEditor";
import { useProject } from "@/lib/stores/useProject";

export default function EditorPage() {
  const [searchParams] = useSearchParams();
  const { initializeEditor } = useEditor();
  const { loadProject, createNewProject } = useProject();
  
  useEffect(() => {
    // Initialize the editor with default settings
    initializeEditor();
    
    // Check if we're opening an existing project or creating a new one
    const projectId = searchParams.get("project");
    const isNewProject = searchParams.get("new") === "true";
    
    if (projectId) {
      // Load existing project
      loadProject(projectId);
    } else if (isNewProject) {
      // Create a new project
      createNewProject();
    } else {
      // Default to creating a new project if no parameters are provided
      createNewProject();
    }
    
    // Set up beforeunload event to warn about unsaved changes
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (useProject.getState().hasUnsavedChanges) {
        const message = "You have unsaved changes. Are you sure you want to leave?";
        e.returnValue = message;
        return message;
      }
    };
    
    window.addEventListener("beforeunload", handleBeforeUnload);
    
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);
  
  return <Editor />;
}
