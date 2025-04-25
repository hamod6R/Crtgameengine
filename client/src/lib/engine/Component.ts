import { GameObject } from "./GameObject";
import { generateUUID } from "./utils/UUID";

/**
 * Base class for all components that can be attached to GameObjects
 */
export abstract class Component {
  public id: string;
  public gameObject: GameObject | null = null;
  
  constructor() {
    this.id = generateUUID();
  }
  
  /**
   * Get the type of the component
   * @returns The component type as a string
   */
  public abstract getType(): string;
  
  /**
   * Called when the component is first initialized
   */
  public awake(): void {
    // To be overridden by derived classes
  }
  
  /**
   * Called when the component is started
   */
  public start(): void {
    // To be overridden by derived classes
  }
  
  /**
   * Called every frame to update the component
   * @param deltaTime Time elapsed since the last update
   */
  public update(deltaTime: number): void {
    // To be overridden by derived classes
  }
  
  /**
   * Called when the component is stopped
   */
  public stop(): void {
    // To be overridden by derived classes
  }
  
  /**
   * Called when the component is destroyed
   */
  public onDestroy(): void {
    // To be overridden by derived classes
  }
  
  /**
   * Create a clone of this component
   * @returns A new instance of the component
   */
  public abstract clone(): Component;
  
  /**
   * Serialize the component data to JSON
   * @returns Serialized component data
   */
  public serialize(): Record<string, any> {
    return {};
  }
  
  /**
   * Deserialize component data from JSON
   * @param data The data to deserialize
   */
  public deserialize(data: Record<string, any>): void {
    // To be overridden by derived classes
  }
}
