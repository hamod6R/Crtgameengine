import { useRef, useState, useEffect } from "react";
import { useEditor } from "@/lib/stores/useEditor";
import { Vector2 } from "@/lib/engine/utils/Vector2";
import { useProject } from "@/lib/stores/useProject";
import { SpriteRenderer } from "@/lib/engine/components/SpriteRenderer";
import { Collider } from "@/lib/engine/components/Collider";
import { Transform } from "@/lib/engine/components/Transform";
import { GameObject } from "@/lib/engine/GameObject";
import { Engine } from "@/lib/engine/Engine";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAudio } from "@/lib/stores/useAudio";

const Canvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startDragPos, setStartDragPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [objectStartPos, setObjectStartPos] = useState<Vector2 | null>(null);
  const [objectStartScale, setObjectStartScale] = useState<Vector2 | null>(null);
  const [objectStartRotation, setObjectStartRotation] = useState<number>(0);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const { playHit } = useAudio();
  
  const {
    mode,
    isPlaying,
    showGrid,
    snapToGrid,
    gridSize,
    zoom,
    panOffset,
    viewportSize,
    setViewportSize,
    setZoom,
    setPanOffset,
    engine,
    selectedGameObject,
    selectGameObject,
    clearSelection
  } = useEditor();
  
  const { markUnsavedChanges } = useProject();

  // Store engine reference in window for use in other components
  useEffect(() => {
    if (engine) {
      (window as any).engineRef = engine;
    }
  }, [engine]);

  // Canvas size observer
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        if (entry.target === containerRef.current) {
          const { width, height } = entry.contentRect;
          setViewportSize({ width, height });
        }
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [setViewportSize]);

  // Main render loop
  useEffect(() => {
    if (!canvasRef.current || !engine) return;
    
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas || !ctx) return;

      // Clear the canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Apply zoom and pan
      ctx.save();
      ctx.translate(panOffset.x, panOffset.y);
      ctx.scale(zoom, zoom);

      // Draw grid if enabled
      if (showGrid) {
        drawGrid(ctx);
      }

      // Get the current scene
      const scene = engine.getCurrentScene();
      if (!scene) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      // Draw all game objects
      scene.gameObjects.forEach(gameObject => {
        if (!gameObject.isActive) return;

        const spriteRenderer = gameObject.getComponent("SpriteRenderer") as SpriteRenderer;
        if (spriteRenderer) {
          spriteRenderer.render(ctx);
        }

        // In editor mode (not playing), draw colliders for debugging
        if (!isPlaying) {
          const collider = gameObject.getComponent("Collider") as Collider;
          if (collider) {
            collider.drawDebug(ctx);
          }
        }

        // If this object is selected, draw selection outline
        if (selectedGameObject && selectedGameObject.id === gameObject.id) {
          drawSelectionOutline(ctx, gameObject);
        }
      });

      ctx.restore();

      // Schedule next frame
      animationFrameId = requestAnimationFrame(render);
    };

    // Start the render loop
    render();

    return () => {
      // Clean up on unmount
      cancelAnimationFrame(animationFrameId);
    };
  }, [
    engine,
    zoom,
    panOffset,
    showGrid,
    isPlaying,
    selectedGameObject,
    gridSize,
    snapToGrid
  ]);

  // Draw grid lines
  const drawGrid = (ctx: CanvasRenderingContext2D) => {
    const { width, height } = viewportSize;
    
    // Calculate the visible area in world space
    const startX = -panOffset.x / zoom;
    const startY = -panOffset.y / zoom;
    const endX = (width - panOffset.x) / zoom;
    const endY = (height - panOffset.y) / zoom;
    
    // Round to nearest grid line
    const roundedStartX = Math.floor(startX / gridSize) * gridSize;
    const roundedStartY = Math.floor(startY / gridSize) * gridSize;
    
    // Draw vertical lines
    ctx.strokeStyle = "rgba(100, 100, 100, 0.2)";
    ctx.lineWidth = 1 / zoom;
    
    for (let x = roundedStartX; x <= endX; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
      ctx.stroke();
    }
    
    // Draw horizontal lines
    for (let y = roundedStartY; y <= endY; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
      ctx.stroke();
    }
    
    // Draw axes with a different color
    ctx.strokeStyle = "rgba(150, 150, 150, 0.5)";
    ctx.lineWidth = 2 / zoom;
    
    // X-axis
    ctx.beginPath();
    ctx.moveTo(startX, 0);
    ctx.lineTo(endX, 0);
    ctx.stroke();
    
    // Y-axis
    ctx.beginPath();
    ctx.moveTo(0, startY);
    ctx.lineTo(0, endY);
    ctx.stroke();
  };

  // Draw selection outline for selected object
  const drawSelectionOutline = (ctx: CanvasRenderingContext2D, gameObject: GameObject) => {
    const transform = gameObject.getComponent("Transform") as Transform;
    if (!transform) return;
    
    const spriteRenderer = gameObject.getComponent("SpriteRenderer") as SpriteRenderer;
    if (!spriteRenderer) return;
    
    ctx.save();
    
    // Position and rotate with the object
    ctx.translate(transform.position.x, transform.position.y);
    ctx.rotate((transform.rotation * Math.PI) / 180);
    
    // Draw selection rectangle
    ctx.strokeStyle = "#2196f3";
    ctx.lineWidth = 2 / zoom;
    ctx.strokeRect(
      -spriteRenderer.width / 2 * transform.scale.x, 
      -spriteRenderer.height / 2 * transform.scale.y, 
      spriteRenderer.width * transform.scale.x, 
      spriteRenderer.height * transform.scale.y
    );
    
    // Draw rotation handle
    ctx.beginPath();
    ctx.moveTo(0, -spriteRenderer.height / 2 * transform.scale.y - 20 / zoom);
    ctx.lineTo(0, -spriteRenderer.height / 2 * transform.scale.y);
    ctx.stroke();
    
    ctx.fillStyle = "#2196f3";
    ctx.beginPath();
    ctx.arc(0, -spriteRenderer.height / 2 * transform.scale.y - 20 / zoom, 5 / zoom, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw corner handles
    const handleSize = 7 / zoom;
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#2196f3";
    ctx.lineWidth = 1 / zoom;
    
    // Top-left
    ctx.fillRect(
      -spriteRenderer.width / 2 * transform.scale.x - handleSize / 2, 
      -spriteRenderer.height / 2 * transform.scale.y - handleSize / 2, 
      handleSize, 
      handleSize
    );
    ctx.strokeRect(
      -spriteRenderer.width / 2 * transform.scale.x - handleSize / 2, 
      -spriteRenderer.height / 2 * transform.scale.y - handleSize / 2, 
      handleSize, 
      handleSize
    );
    
    // Top-right
    ctx.fillRect(
      spriteRenderer.width / 2 * transform.scale.x - handleSize / 2, 
      -spriteRenderer.height / 2 * transform.scale.y - handleSize / 2, 
      handleSize, 
      handleSize
    );
    ctx.strokeRect(
      spriteRenderer.width / 2 * transform.scale.x - handleSize / 2, 
      -spriteRenderer.height / 2 * transform.scale.y - handleSize / 2, 
      handleSize, 
      handleSize
    );
    
    // Bottom-left
    ctx.fillRect(
      -spriteRenderer.width / 2 * transform.scale.x - handleSize / 2, 
      spriteRenderer.height / 2 * transform.scale.y - handleSize / 2, 
      handleSize, 
      handleSize
    );
    ctx.strokeRect(
      -spriteRenderer.width / 2 * transform.scale.x - handleSize / 2, 
      spriteRenderer.height / 2 * transform.scale.y - handleSize / 2, 
      handleSize, 
      handleSize
    );
    
    // Bottom-right
    ctx.fillRect(
      spriteRenderer.width / 2 * transform.scale.x - handleSize / 2, 
      spriteRenderer.height / 2 * transform.scale.y - handleSize / 2, 
      handleSize, 
      handleSize
    );
    ctx.strokeRect(
      spriteRenderer.width / 2 * transform.scale.x - handleSize / 2, 
      spriteRenderer.height / 2 * transform.scale.y - handleSize / 2, 
      handleSize, 
      handleSize
    );
    
    ctx.restore();
  };

  // Convert screen coordinates to world coordinates
  const screenToWorld = (screenX: number, screenY: number): Vector2 => {
    return new Vector2(
      (screenX - panOffset.x) / zoom,
      (screenY - panOffset.y) / zoom
    );
  };

  // Find the object under the cursor
  const getObjectUnderCursor = (position: Vector2): GameObject | null => {
    if (!engine) return null;
    
    const scene = engine.getCurrentScene();
    if (!scene) return null;
    
    // Search in reverse order to get topmost objects first
    for (let i = scene.gameObjects.length - 1; i >= 0; i--) {
      const gameObject = scene.gameObjects[i];
      if (!gameObject.isActive) continue;
      
      const transform = gameObject.getComponent("Transform") as Transform;
      const spriteRenderer = gameObject.getComponent("SpriteRenderer") as SpriteRenderer;
      
      if (!transform || !spriteRenderer) continue;
      
      // Check if point is inside the sprite bounds
      // This is a simple AABB check, doesn't account for rotation
      const dx = Math.abs(position.x - transform.position.x);
      const dy = Math.abs(position.y - transform.position.y);
      
      const halfWidth = (spriteRenderer.width * transform.scale.x) / 2;
      const halfHeight = (spriteRenderer.height * transform.scale.y) / 2;
      
      if (dx <= halfWidth && dy <= halfHeight) {
        return gameObject;
      }
    }
    
    return null;
  };

  // Snap value to grid
  const snapToGridValue = (value: number): number => {
    return Math.round(value / gridSize) * gridSize;
  };

  // Handle mouse down events
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPlaying) return;
    
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;
    
    const mouseX = e.clientX - canvasRect.left;
    const mouseY = e.clientY - canvasRect.top;
    
    // Middle mouse button for panning
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsPanning(true);
      setPanStart({ x: mouseX, y: mouseY });
      return;
    }
    
    // Left mouse button
    if (e.button === 0) {
      const worldPos = screenToWorld(mouseX, mouseY);
      
      if (mode === "select") {
        const objectUnderCursor = getObjectUnderCursor(worldPos);
        
        if (objectUnderCursor) {
          selectGameObject(objectUnderCursor);
          playHit();
          
          // Save the start position for dragging
          setStartDragPos({ x: mouseX, y: mouseY });
          setObjectStartPos((objectUnderCursor.getComponent("Transform") as Transform)?.position.clone() || null);
          
          // Start dragging if in select mode
          setIsDragging(true);
        } else {
          // Clicked on empty space, clear selection
          clearSelection();
        }
      } else if (mode === "move" && selectedGameObject) {
        // Start moving the selected object
        setStartDragPos({ x: mouseX, y: mouseY });
        setObjectStartPos((selectedGameObject.getComponent("Transform") as Transform)?.position.clone() || null);
        setIsDragging(true);
      } else if (mode === "scale" && selectedGameObject) {
        // Start scaling the selected object
        setStartDragPos({ x: mouseX, y: mouseY });
        setObjectStartScale((selectedGameObject.getComponent("Transform") as Transform)?.scale.clone() || null);
        setIsResizing(true);
      } else if (mode === "rotate" && selectedGameObject) {
        // Start rotating the selected object
        setStartDragPos({ x: mouseX, y: mouseY });
        setObjectStartRotation((selectedGameObject.getComponent("Transform") as Transform)?.rotation || 0);
        setIsDragging(true);
      }
    }
  };

  // Handle mouse move events
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPlaying) return;
    
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;
    
    const mouseX = e.clientX - canvasRect.left;
    const mouseY = e.clientY - canvasRect.top;
    
    // Handle panning
    if (isPanning && panStart) {
      const dx = mouseX - panStart.x;
      const dy = mouseY - panStart.y;
      
      setPanOffset(new Vector2(
        panOffset.x + dx,
        panOffset.y + dy
      ));
      
      setPanStart({ x: mouseX, y: mouseY });
      return;
    }
    
    // Handle object manipulation
    if (selectedGameObject) {
      const transform = selectedGameObject.getComponent("Transform") as Transform;
      if (!transform) return;
      
      // Handle dragging (moving)
      if (isDragging && objectStartPos && startDragPos) {
        if (mode === "select" || mode === "move") {
          const dx = (mouseX - startDragPos.x) / zoom;
          const dy = (mouseY - startDragPos.y) / zoom;
          
          let newX = objectStartPos.x + dx;
          let newY = objectStartPos.y + dy;
          
          // Snap to grid if enabled
          if (snapToGrid) {
            newX = snapToGridValue(newX);
            newY = snapToGridValue(newY);
          }
          
          transform.setPosition(newX, newY);
          markUnsavedChanges();
        } else if (mode === "rotate") {
          // Calculate angle between center of object and mouse
          const worldPos = screenToWorld(mouseX, mouseY);
          
          const dx = worldPos.x - transform.position.x;
          const dy = worldPos.y - transform.position.y;
          
          // Calculate angle in degrees
          let angle = Math.atan2(dy, dx) * (180 / Math.PI);
          
          // Add 90 degrees to make it more intuitive
          angle += 90;
          
          // Snap to 15 degree increments if grid snap is enabled
          if (snapToGrid) {
            angle = Math.round(angle / 15) * 15;
          }
          
          transform.setRotation(angle);
          markUnsavedChanges();
        }
      }
      
      // Handle resizing
      if (isResizing && objectStartScale && startDragPos) {
        const dx = (mouseX - startDragPos.x) / 200; // Reduce sensitivity
        const dy = (mouseY - startDragPos.y) / 200;
        
        // Calculate new scale based on drag distance
        let newScaleX = objectStartScale.x + dx;
        let newScaleY = objectStartScale.y + dy;
        
        // Ensure minimum scale
        newScaleX = Math.max(0.1, newScaleX);
        newScaleY = Math.max(0.1, newScaleY);
        
        // Snap to 0.25 increments if grid snap is enabled
        if (snapToGrid) {
          newScaleX = Math.round(newScaleX * 4) / 4;
          newScaleY = Math.round(newScaleY * 4) / 4;
        }
        
        transform.setScale(newScaleX, newScaleY);
        markUnsavedChanges();
      }
    }
  };

  // Handle mouse up events
  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setIsPanning(false);
  };

  // Handle mouse wheel for zooming
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    if (isPlaying) return;
    
    e.preventDefault();
    
    // Get cursor position
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;
    
    const mouseX = e.clientX - canvasRect.left;
    const mouseY = e.clientY - canvasRect.top;
    
    // Calculate world position before zoom
    const worldPosBeforeZoom = screenToWorld(mouseX, mouseY);
    
    // Adjust zoom level
    let newZoom = zoom - e.deltaY * 0.001;
    newZoom = Math.max(0.1, Math.min(3, newZoom));
    setZoom(newZoom);
    
    // Calculate new screen position at the same world point
    const screenPosX = worldPosBeforeZoom.x * newZoom + panOffset.x;
    const screenPosY = worldPosBeforeZoom.y * newZoom + panOffset.y;
    
    // Calculate difference and adjust pan
    const panAdjustX = mouseX - screenPosX;
    const panAdjustY = mouseY - screenPosY;
    
    setPanOffset(new Vector2(
      panOffset.x + panAdjustX,
      panOffset.y + panAdjustY
    ));
  };

  // Reset view to center and default zoom
  const resetView = () => {
    setZoom(1);
    
    // Center the view on the canvas
    const centerX = viewportSize.width / 2;
    const centerY = viewportSize.height / 2;
    
    setPanOffset(new Vector2(centerX, centerY));
    playHit();
  };

  // Zoom in
  const zoomIn = () => {
    const newZoom = Math.min(3, zoom + 0.1);
    setZoom(newZoom);
    playHit();
  };

  // Zoom out
  const zoomOut = () => {
    const newZoom = Math.max(0.1, zoom - 0.1);
    setZoom(newZoom);
    playHit();
  };

  return (
    <div className="relative h-full flex flex-col">
      <div className="absolute top-2 right-2 z-10 flex flex-col gap-1">
        <Button variant="secondary" size="icon" onClick={zoomIn} title="Zoom In">
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="secondary" size="icon" onClick={zoomOut} title="Zoom Out">
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button variant="secondary" size="icon" onClick={resetView} title="Reset View">
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
      
      <div 
        ref={containerRef}
        id="canvas-container"
        className="relative flex-1 overflow-hidden bg-gray-900 cursor-crosshair"
      >
        <canvas
          ref={canvasRef}
          width={viewportSize.width}
          height={viewportSize.height}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          className="w-full h-full"
          style={{
            cursor: isPanning 
              ? "grabbing" 
              : isPlaying 
                ? "default" 
                : mode === "select" 
                  ? "pointer" 
                  : mode === "move" 
                    ? "move" 
                    : mode === "scale" 
                      ? "nwse-resize" 
                      : mode === "rotate" 
                        ? "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"12\" r=\"10\"/><polyline points=\"8 12 12 16 16 12\"/><line x1=\"12\" y1=\"8\" x2=\"12\" y2=\"16\"/></svg>'), auto" 
                        : "crosshair"
          }}
        />
      </div>
      
      <div className="p-1 text-xs text-center text-gray-500 border-t">
        {isPlaying ? (
          <span className="text-green-500">Playing - Press ESC to exit play mode</span>
        ) : (
          <span>Editor Mode - Zoom: {Math.round(zoom * 100)}% - Position: {panOffset.x.toFixed(0)}, {panOffset.y.toFixed(0)}</span>
        )}
      </div>
    </div>
  );
};

export default Canvas;
