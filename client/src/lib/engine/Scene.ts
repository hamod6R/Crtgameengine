import { GameObject } from "./GameObject";

/**
 * Represents a scene in the game, containing game objects and managing their lifecycle
 */
export class Scene {
  public name: string;
  public gameObjects: GameObject[] = [];
  private isRunning: boolean = false;
  
  constructor(name: string) {
    this.name = name;
  }
  
  /**
   * Add a game object to the scene
   * @param gameObject The game object to add
   */
  public addGameObject(gameObject: GameObject): void {
    this.gameObjects.push(gameObject);
    
    // If the scene is already running, call awake and start on the new game object
    if (this.isRunning) {
      gameObject.awake();
      gameObject.start();
    }
  }
  
  /**
   * Remove a game object from the scene
   * @param gameObject The game object to remove
   */
  public removeGameObject(gameObject: GameObject): void {
    const index = this.gameObjects.indexOf(gameObject);
    if (index !== -1) {
      // Call onDestroy on the game object before removing it
      gameObject.onDestroy();
      
      // Remove the game object from the array
      this.gameObjects.splice(index, 1);
    }
  }
  
  /**
   * Get a game object by ID
   * @param id The ID of the game object to find
   * @returns The game object with the specified ID, or undefined if not found
   */
  public getGameObjectById(id: string): GameObject | undefined {
    return this.gameObjects.find(obj => obj.id === id);
  }
  
  /**
   * Find game objects by name
   * @param name The name to search for
   * @returns Array of game objects with the specified name
   */
  public findGameObjectsByName(name: string): GameObject[] {
    return this.gameObjects.filter(obj => obj.name === name);
  }
  
  /**
   * Initialize all game objects in the scene
   */
  public awake(): void {
    this.gameObjects.forEach(gameObject => {
      gameObject.awake();
    });
  }
  
  /**
   * Start all game objects in the scene
   */
  public start(): void {
    this.isRunning = true;
    
    this.gameObjects.forEach(gameObject => {
      gameObject.start();
    });
  }
  
  /**
   * Update all game objects in the scene
   * @param deltaTime Time elapsed since the last update
   */
  public update(deltaTime: number): void {
    if (!this.isRunning) return;
    
    // Update all game objects
    this.gameObjects.forEach(gameObject => {
      if (gameObject.isActive) {
        gameObject.update(deltaTime);
      }
    });
  }
  
  /**
   * Stop all game objects in the scene
   */
  public stop(): void {
    this.isRunning = false;
    
    this.gameObjects.forEach(gameObject => {
      gameObject.stop();
    });
  }
}
