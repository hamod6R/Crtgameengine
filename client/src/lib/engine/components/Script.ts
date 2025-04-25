import { Component } from "../Component";
import { generateUUID } from "../utils/UUID";

/**
 * Component that handles scripting and game logic
 */
export class Script extends Component {
  /** Unique identifier for the script component */
  public id: string;
  
  /** Name of the script */
  public name: string;
  
  /** Variables used by the script */
  public variables: Record<string, any> = {};
  
  /** Callback functions for different events */
  public callbacks: Record<string, Function> = {};
  
  /**
   * Create a new Script component
   * @param name The name of the script
   */
  constructor(name: string = "") {
    super();
    this.id = generateUUID();
    this.name = name || `Script_${this.id.substring(0, 8)}`;
    
    // Initialize default callbacks
    this.callbacks = {
      start: () => {},
      update: () => {},
      onDestroy: () => {},
      onClick: () => {},
      onCollisionEnter: () => {},
      onCollisionExit: () => {}
    };
  }
  
  /**
   * Get the type of the component
   * @returns The component type as a string
   */
  public getType(): string {
    return "Script";
  }
  
  /**
   * Called when the component is started
   */
  public start(): void {
    if (this.callbacks.start) {
      this.callbacks.start();
    }
  }
  
  /**
   * Called every frame to update the component
   * @param deltaTime Time elapsed since the last update
   */
  public update(deltaTime: number): void {
    if (this.callbacks.update) {
      this.callbacks.update(deltaTime);
    }
  }
  
  /**
   * Called when the component is destroyed
   */
  public onDestroy(): void {
    if (this.callbacks.onDestroy) {
      this.callbacks.onDestroy();
    }
  }
  
  /**
   * Called when the game object is clicked
   */
  public onClick(): void {
    if (this.callbacks.onClick) {
      this.callbacks.onClick();
    }
  }
  
  /**
   * Called when the game object collides with another
   * @param other The other game object involved in the collision
   */
  public onCollisionEnter(other: any): void {
    if (this.callbacks.onCollisionEnter) {
      this.callbacks.onCollisionEnter(other);
    }
  }
  
  /**
   * Called when the game object stops colliding with another
   * @param other The other game object that was involved in the collision
   */
  public onCollisionExit(other: any): void {
    if (this.callbacks.onCollisionExit) {
      this.callbacks.onCollisionExit(other);
    }
  }
  
  /**
   * Get a variable value
   * @param name The name of the variable
   * @returns The value of the variable or undefined if not found
   */
  public getVariable(name: string): any {
    return this.variables[name];
  }
  
  /**
   * Set a variable value
   * @param name The name of the variable
   * @param value The value to set
   */
  public setVariable(name: string, value: any): void {
    this.variables[name] = value;
  }
  
  /**
   * Create a clone of this component
   * @returns A new instance of the component
   */
  public clone(): Component {
    const clonedScript = new Script(this.name);
    
    // Clone variables
    clonedScript.variables = { ...this.variables };
    
    // Clone callbacks (note: this is a shallow copy, function references are maintained)
    clonedScript.callbacks = { ...this.callbacks };
    
    return clonedScript;
  }
  
  /**
   * Serialize the component data to JSON
   * @returns Serialized component data
   */
  public serialize(): Record<string, any> {
    return {
      type: this.getType(),
      id: this.id,
      name: this.name,
      variables: this.variables,
      // Note: callbacks can't be serialized directly as functions,
      // they would need to be reconstructed during deserialization
    };
  }
  
  /**
   * Deserialize component data from JSON
   * @param data The data to deserialize
   */
  public deserialize(data: Record<string, any>): void {
    if (data.id) this.id = data.id;
    if (data.name) this.name = data.name;
    if (data.variables) this.variables = { ...data.variables };
    // Note: callbacks would need to be reconstructed here based on the specific approach
  }
}