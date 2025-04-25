import { Component } from "../Component";

/**
 * Interface for script callbacks
 */
export interface ScriptCallbacks {
  awake?: () => void;
  start?: () => void;
  update?: (deltaTime: number) => void;
  onCollisionEnter?: (other: any) => void;
  onCollisionExit?: (other: any) => void;
  onTriggerEnter?: (other: any) => void;
  onTriggerExit?: (other: any) => void;
  onDestroy?: () => void;
}

/**
 * Component that allows custom code execution on GameObjects
 */
export class Script extends Component {
  private callbacks: ScriptCallbacks;
  public name: string;
  public variables: Record<string, any>;
  
  constructor(name: string, callbacks: ScriptCallbacks = {}, variables: Record<string, any> = {}) {
    super();
    this.name = name;
    this.callbacks = callbacks;
    this.variables = { ...variables };
  }
  
  /**
   * Get the type of the component
   * @returns The component type as a string
   */
  public getType(): string {
    return "Script";
  }
  
  /**
   * Called when the component is first initialized
   */
  public awake(): void {
    if (this.callbacks.awake) {
      this.callbacks.awake();
    }
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
   * Called when a collision begins
   * @param other The other collider
   */
  public onCollisionEnter(other: any): void {
    if (this.callbacks.onCollisionEnter) {
      this.callbacks.onCollisionEnter(other);
    }
  }
  
  /**
   * Called when a collision ends
   * @param other The other collider
   */
  public onCollisionExit(other: any): void {
    if (this.callbacks.onCollisionExit) {
      this.callbacks.onCollisionExit(other);
    }
  }
  
  /**
   * Called when a trigger collision begins
   * @param other The other collider
   */
  public onTriggerEnter(other: any): void {
    if (this.callbacks.onTriggerEnter) {
      this.callbacks.onTriggerEnter(other);
    }
  }
  
  /**
   * Called when a trigger collision ends
   * @param other The other collider
   */
  public onTriggerExit(other: any): void {
    if (this.callbacks.onTriggerExit) {
      this.callbacks.onTriggerExit(other);
    }
  }
  
  /**
   * Set a variable value
   * @param name Variable name
   * @param value Variable value
   */
  public setVariable(name: string, value: any): void {
    this.variables[name] = value;
  }
  
  /**
   * Get a variable value
   * @param name Variable name
   * @returns Variable value
   */
  public getVariable(name: string): any {
    return this.variables[name];
  }
  
  /**
   * Create a clone of this component
   * @returns A new Script component
   */
  public clone(): Script {
    // Note: when cloning a script, we copy the variable values but not the callback references
    // In a full implementation, we would need a way to properly clone script functionality
    return new Script(
      this.name,
      this.callbacks,
      { ...this.variables } // Create a shallow copy of variables
    );
  }
  
  /**
   * Serialize the component data to JSON
   * @returns Serialized component data
   */
  public serialize(): Record<string, any> {
    return {
      name: this.name,
      variables: this.variables,
      // Note: We can't serialize the callbacks, so they would need to be
      // recreated from the script code when deserializing
    };
  }
  
  /**
   * Deserialize component data from JSON
   * @param data The data to deserialize
   */
  public deserialize(data: Record<string, any>): void {
    if (typeof data.name === 'string') {
      this.name = data.name;
    }
    
    if (data.variables && typeof data.variables === 'object') {
      this.variables = { ...data.variables };
    }
    
    // Note: The callbacks would need to be recreated from the script code
    // This would typically be handled by the scripting system
  }
}
