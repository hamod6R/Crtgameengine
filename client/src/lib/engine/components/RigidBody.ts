import { Component } from "../Component";
import { Vector2 } from "../utils/Vector2";

/**
 * Component that adds physics behavior to a GameObject
 */
export class RigidBody extends Component {
  public velocity: Vector2;
  public acceleration: Vector2;
  public mass: number;
  public drag: number;
  public useGravity: boolean;
  public isKinematic: boolean;
  public freezeRotation: boolean;
  public gravityScale: number;
  
  // Cached transform component for performance
  private transform: any | null = null;
  
  constructor() {
    super();
    this.velocity = new Vector2(0, 0);
    this.acceleration = new Vector2(0, 0);
    this.mass = 1;
    this.drag = 0.1;
    this.useGravity = true;
    this.isKinematic = false;
    this.freezeRotation = false;
    this.gravityScale = 1;
  }
  
  /**
   * Get the type of the component
   * @returns The component type as a string
   */
  public getType(): string {
    return "RigidBody";
  }
  
  /**
   * Called when the component is first initialized
   */
  public awake(): void {
    // Cache the transform component for better performance
    if (this.gameObject) {
      this.transform = this.gameObject.getComponent("Transform");
    }
  }
  
  /**
   * Called every frame to update the component
   * @param deltaTime Time elapsed since the last update
   */
  public update(deltaTime: number): void {
    if (!this.transform || this.isKinematic) return;
    
    // Apply gravity if enabled
    if (this.useGravity) {
      this.acceleration.y += 9.8 * this.gravityScale;
    }
    
    // Update velocity based on acceleration
    this.velocity.x += this.acceleration.x * deltaTime;
    this.velocity.y += this.acceleration.y * deltaTime;
    
    // Apply drag to slow down movement
    this.velocity.x *= (1 - this.drag * deltaTime);
    this.velocity.y *= (1 - this.drag * deltaTime);
    
    // Update position based on velocity
    this.transform.position.x += this.velocity.x * deltaTime;
    this.transform.position.y += this.velocity.y * deltaTime;
    
    // Reset acceleration for next frame
    this.acceleration.set(0, 0);
  }
  
  /**
   * Apply a force to the rigid body
   * @param force Force vector to apply
   */
  public applyForce(force: Vector2): void {
    this.acceleration.x += force.x / this.mass;
    this.acceleration.y += force.y / this.mass;
  }
  
  /**
   * Apply an impulse to the rigid body (instantaneous change in velocity)
   * @param impulse Impulse vector to apply
   */
  public applyImpulse(impulse: Vector2): void {
    this.velocity.x += impulse.x / this.mass;
    this.velocity.y += impulse.y / this.mass;
  }
  
  /**
   * Create a clone of this component
   * @returns A new RigidBody component
   */
  public clone(): RigidBody {
    const clone = new RigidBody();
    
    clone.velocity.copy(this.velocity);
    clone.acceleration.copy(this.acceleration);
    clone.mass = this.mass;
    clone.drag = this.drag;
    clone.useGravity = this.useGravity;
    clone.isKinematic = this.isKinematic;
    clone.freezeRotation = this.freezeRotation;
    clone.gravityScale = this.gravityScale;
    
    return clone;
  }
  
  /**
   * Serialize the component data to JSON
   * @returns Serialized component data
   */
  public serialize(): Record<string, any> {
    return {
      velocity: { x: this.velocity.x, y: this.velocity.y },
      acceleration: { x: this.acceleration.x, y: this.acceleration.y },
      mass: this.mass,
      drag: this.drag,
      useGravity: this.useGravity,
      isKinematic: this.isKinematic,
      freezeRotation: this.freezeRotation,
      gravityScale: this.gravityScale
    };
  }
  
  /**
   * Deserialize component data from JSON
   * @param data The data to deserialize
   */
  public deserialize(data: Record<string, any>): void {
    if (data.velocity) {
      this.velocity.set(data.velocity.x, data.velocity.y);
    }
    
    if (data.acceleration) {
      this.acceleration.set(data.acceleration.x, data.acceleration.y);
    }
    
    if (typeof data.mass === 'number') {
      this.mass = data.mass;
    }
    
    if (typeof data.drag === 'number') {
      this.drag = data.drag;
    }
    
    if (typeof data.useGravity === 'boolean') {
      this.useGravity = data.useGravity;
    }
    
    if (typeof data.isKinematic === 'boolean') {
      this.isKinematic = data.isKinematic;
    }
    
    if (typeof data.freezeRotation === 'boolean') {
      this.freezeRotation = data.freezeRotation;
    }
    
    if (typeof data.gravityScale === 'number') {
      this.gravityScale = data.gravityScale;
    }
  }
}
