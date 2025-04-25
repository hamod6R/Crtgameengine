import { Component } from "../Component";
import { Vector2 } from "../utils/Vector2";

/**
 * Component that controls the position, rotation, and scale of a GameObject
 */
export class Transform extends Component {
  public position: Vector2;
  public rotation: number;
  public scale: Vector2;
  
  constructor() {
    super();
    this.position = new Vector2(0, 0);
    this.rotation = 0;
    this.scale = new Vector2(1, 1);
  }
  
  /**
   * Get the type of the component
   * @returns The component type as a string
   */
  public getType(): string {
    return "Transform";
  }
  
  /**
   * Translate the transform by the specified vector
   * @param translation Vector to translate by
   */
  public translate(translation: Vector2): void {
    this.position.add(translation);
  }
  
  /**
   * Rotate the transform by the specified angle in degrees
   * @param angle Angle to rotate by in degrees
   */
  public rotate(angle: number): void {
    this.rotation = (this.rotation + angle) % 360;
  }
  
  /**
   * Set the position of the transform
   * @param x X position
   * @param y Y position
   */
  public setPosition(x: number, y: number): void {
    this.position.set(x, y);
  }
  
  /**
   * Set the rotation of the transform in degrees
   * @param angle Rotation in degrees
   */
  public setRotation(angle: number): void {
    this.rotation = angle % 360;
  }
  
  /**
   * Set the scale of the transform
   * @param x X scale
   * @param y Y scale
   */
  public setScale(x: number, y: number): void {
    this.scale.set(x, y);
  }
  
  /**
   * Create a clone of this component
   * @returns A new Transform component
   */
  public clone(): Transform {
    const clone = new Transform();
    clone.position.copy(this.position);
    clone.rotation = this.rotation;
    clone.scale.copy(this.scale);
    return clone;
  }
  
  /**
   * Serialize the component data to JSON
   * @returns Serialized component data
   */
  public serialize(): Record<string, any> {
    return {
      position: { x: this.position.x, y: this.position.y },
      rotation: this.rotation,
      scale: { x: this.scale.x, y: this.scale.y }
    };
  }
  
  /**
   * Deserialize component data from JSON
   * @param data The data to deserialize
   */
  public deserialize(data: Record<string, any>): void {
    if (data.position) {
      this.position.set(data.position.x, data.position.y);
    }
    
    if (typeof data.rotation === 'number') {
      this.rotation = data.rotation;
    }
    
    if (data.scale) {
      this.scale.set(data.scale.x, data.scale.y);
    }
  }
}
