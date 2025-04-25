import { Component } from "../Component";
import { Vector2 } from "../utils/Vector2";

/**
 * Script component for attaching visual scripts to game objects
 */
export class Script extends Component {
  // Script properties
  public variables: Record<string, any>;
  public callbacks: Record<string, Function>;
  public scriptName: string;
  
  constructor() {
    super();
    this.variables = {};
    this.callbacks = {};
    this.scriptName = "Script";
  }
  
  /**
   * Get the type of this component
   * @returns The component type as a string
   */
  public getType(): string {
    return 'Script';
  }
  
  /**
   * Create a clone of this component
   * @returns A new instance of the component
   */
  public clone(): Component {
    const clone = new Script();
    clone.scriptName = this.scriptName;
    
    // Clone variables
    for (const key in this.variables) {
      const value = this.variables[key];
      if (typeof value === 'object' && value !== null) {
        if ('clone' in value && typeof value.clone === 'function') {
          // If value has a clone method, use it
          clone.variables[key] = value.clone();
        } else {
          // Otherwise do a shallow copy
          clone.variables[key] = { ...value };
        }
      } else {
        // For primitives, copy directly
        clone.variables[key] = value;
      }
    }
    
    // Callbacks can't be properly cloned (functions with closures), so we leave them empty
    // They should be set up again after cloning
    
    return clone;
  }
  
  /**
   * Set a script variable
   * @param name Variable name
   * @param value Variable value
   */
  public setVariable(name: string, value: any): void {
    this.variables[name] = value;
  }
  
  /**
   * Get a script variable
   * @param name Variable name
   * @returns Variable value or undefined if not found
   */
  public getVariable(name: string): any {
    return this.variables[name];
  }
  
  /**
   * Register a callback function
   * @param eventName Event name (e.g., 'update', 'onCollisionEnter')
   * @param callback Function to call when the event occurs
   */
  public registerCallback(eventName: string, callback: Function): void {
    this.callbacks[eventName] = callback;
  }
  
  /**
   * Execute a callback if it exists
   * @param eventName Event name
   * @param args Arguments to pass to the callback
   * @returns Result of the callback or undefined if not found
   */
  public executeCallback(eventName: string, ...args: any[]): any {
    const callback = this.callbacks[eventName];
    if (callback && typeof callback === 'function') {
      return callback(...args);
    }
    return undefined;
  }
  
  /**
   * Called every frame to update the component
   * @param deltaTime Time elapsed since the last update
   */
  override update(deltaTime: number): void {
    // Execute update callback if it exists
    this.executeCallback('update', deltaTime);
  }
  
  /**
   * Serialize the component to JSON
   */
  override serialize(): any {
    // We can't serialize functions, so we only save the variable data
    return {
      type: 'Script',
      scriptName: this.scriptName,
      variables: this.variables
    };
  }
  
  /**
   * Deserialize the component from JSON
   * @param data The JSON data
   */
  override deserialize(data: any): void {
    this.scriptName = data.scriptName;
    this.variables = data.variables || {};
    // Callbacks need to be set up programmatically after loading
  }
}