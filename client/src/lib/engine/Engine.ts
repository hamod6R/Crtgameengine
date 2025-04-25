import { Scene } from "./Scene";
import { Physics } from "./physics/Physics";

/**
 * Main engine class that handles the game loop and manages scenes
 */
export class Engine {
  private scenes: Scene[] = [];
  private currentScene: Scene | null = null;
  private isRunning: boolean = false;
  private lastFrameTime: number = 0;
  private physics: Physics;
  private animationFrameId: number | null = null;
  
  constructor() {
    this.physics = new Physics();
    console.log("Game Engine initialized");
  }
  
  /**
   * Load a scene into the engine
   * @param scene The scene to load
   */
  public loadScene(scene: Scene): void {
    // Stop the current scene if the engine is running
    if (this.isRunning && this.currentScene) {
      this.stop();
    }
    
    this.currentScene = scene;
    
    // Add the scene to the scenes array if it's not already there
    if (!this.scenes.includes(scene)) {
      this.scenes.push(scene);
    }
    
    // Initialize the scene
    scene.awake();
    
    // Restart the engine if it was running
    if (this.isRunning) {
      this.start();
    }
    
    console.log(`Loaded scene: ${scene.name}`);
  }
  
  /**
   * Get the current active scene
   * @returns The current scene or null if no scene is loaded
   */
  public getCurrentScene(): Scene | null {
    return this.currentScene;
  }
  
  /**
   * Get all loaded scenes
   * @returns Array of loaded scenes
   */
  public getScenes(): Scene[] {
    return [...this.scenes];
  }
  
  /**
   * Start the game loop
   */
  public start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    
    if (this.currentScene) {
      // Call start on the current scene
      this.currentScene.start();
      
      // Start the game loop
      this.gameLoop();
    } else {
      console.warn("Cannot start engine: No scene loaded");
      this.isRunning = false;
    }
  }
  
  /**
   * Stop the game loop
   */
  public stop(): void {
    this.isRunning = false;
    
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    if (this.currentScene) {
      this.currentScene.stop();
    }
  }
  
  /**
   * Main game loop
   */
  private gameLoop(): void {
    if (!this.isRunning || !this.currentScene) return;
    
    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastFrameTime) / 1000; // Convert to seconds
    this.lastFrameTime = currentTime;
    
    // Update physics
    this.physics.update(deltaTime);
    
    // Update scene
    this.currentScene.update(deltaTime);
    
    // Schedule next frame
    this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
  }
}
