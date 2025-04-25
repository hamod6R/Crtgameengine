import { useRef, useEffect } from 'react';
import { useEditor } from '@/lib/stores/useEditor';
import { useKeyboardControls } from '@react-three/drei';
import { Scene } from '@/lib/engine/Scene';
import { Controls } from '@/lib/engine/utils/Controls';
import { RigidBody } from '@/lib/engine/components/RigidBody';

const GameView = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isPlaying, engine } = useEditor();
  const [subscribe, getState] = useKeyboardControls<Controls>();
  
  // Resize canvas when window or container changes
  useEffect(() => {
    const handleResize = () => {
      if (!canvasRef.current) return;
      
      const canvas = canvasRef.current;
      const container = canvas.parentElement;
      if (!container) return;
      
      // Make canvas fit its container
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      
      // Update renderer if engine is using this canvas
      if (engine) {
        engine.renderer.setSize(canvas.width, canvas.height);
      }
    };
    
    window.addEventListener('resize', handleResize);
    // Initial sizing
    handleResize();
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [engine]);
  
  // Handle gameplay controls when playing
  useEffect(() => {
    if (!isPlaying || !engine || !engine.getCurrentScene()) return;
    
    const scene = engine.getCurrentScene() as Scene;
    
    // Handle key controls in the game
    const handleKeyControls = () => {
      const controls = getState();
      const player = scene.findGameObjectByTag('player');
      
      if (!player) return;
      
      const speedFactor = 5; // Movement speed factor
      
      const rigidBodyComponent = player.getComponent('RigidBody');
      if (rigidBodyComponent) {
        // Cast to RigidBody type to access velocity
        const rigidBody = rigidBodyComponent as RigidBody;
        
        // Reset velocity at the start of each frame
        rigidBody.velocity.x = 0;
        rigidBody.velocity.y = 0;
        
        // Apply velocity based on controls
        if (controls.forward) {
          rigidBody.velocity.y -= speedFactor;
        }
        if (controls.back) {
          rigidBody.velocity.y += speedFactor;
        }
        if (controls.left) {
          rigidBody.velocity.x -= speedFactor;
        }
        if (controls.right) {
          rigidBody.velocity.x += speedFactor;
        }
        if (controls.jump) {
          // Handle jump action
          console.log('Jump pressed in game!');
        }
      }
      
      // Additionally, trigger any script callbacks for the controls
      const scripts = player.getComponents('Script');
      if (scripts && scripts.length > 0) {
        for (const scriptComp of scripts) {
          const script = scriptComp as any;
          
          // If the script has these control callbacks, call them
          if (controls.forward && script.callbacks?.onMoveForward) {
            script.callbacks.onMoveForward();
          }
          if (controls.back && script.callbacks?.onMoveBack) {
            script.callbacks.onMoveBack();
          }
          if (controls.left && script.callbacks?.onMoveLeft) {
            script.callbacks.onMoveLeft();
          }
          if (controls.right && script.callbacks?.onMoveRight) {
            script.callbacks.onMoveRight();
          }
          if (controls.jump && script.callbacks?.onJump) {
            script.callbacks.onJump();
          }
        }
      }
    };
    
    // Game loop handler
    const gameLoop = () => {
      if (!isPlaying) return;
      
      // Process input
      handleKeyControls();
    };
    
    // Set up the game loop
    const interval = setInterval(gameLoop, 1000 / 60); // 60 FPS
    
    return () => {
      clearInterval(interval);
    };
  }, [isPlaying, engine, getState]);
  
  // Set up rendering to this canvas
  useEffect(() => {
    if (!canvasRef.current || !engine) return;
    
    // When playing, use this canvas for rendering
    if (isPlaying) {
      const canvas = canvasRef.current;
      
      // Configure the engine to render to this canvas
      if (engine.renderer) {
        engine.renderer.setCanvas(canvas);
        
        // If the engine has a scene loaded, trigger the start callbacks
        if (engine.getCurrentScene()) {
          const scene = engine.getCurrentScene();
          if (scene) {
            scene.start();
          }
        }
      }
    }
    
    return () => {
      // Cleanup when component unmounts
      if (isPlaying && engine && engine.renderer) {
        // Reset renderer canvas
        engine.renderer.setCanvas(null);
      }
    };
  }, [isPlaying, engine]);
  
  return (
    <div className="h-full w-full relative bg-slate-900 overflow-hidden">
      {isPlaying ? (
        <canvas 
          ref={canvasRef}
          className="w-full h-full"
        />
      ) : (
        <div className="flex items-center justify-center h-full text-white">
          <p className="text-lg">Press Play to start the game</p>
        </div>
      )}
    </div>
  );
};

export default GameView;