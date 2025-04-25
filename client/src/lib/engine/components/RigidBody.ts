import { Component } from "../Component";
import { Vector2 } from "../utils/Vector2";
import { GameObject } from "../GameObject";
import { Engine } from "../Engine";

/**
 * RigidBody component for physics simulation
 */
export class RigidBody extends Component {
  // Physics properties
  public velocity: Vector2;
  public acceleration: Vector2;
  public mass: number;
  public drag: number;
  public useGravity: boolean;
  public isKinematic: boolean;
  public isTrigger: boolean;
  public bodyType: 'dynamic' | 'static' | 'kinematic';
  
  constructor() {
    super();
    
    this.velocity = new Vector2(0, 0);
    this.acceleration = new Vector2(0, 0);
    this.mass = 1;
    this.drag = 0.1;
    this.useGravity = true;
    this.isKinematic = false;
    this.isTrigger = false;
    this.bodyType = 'dynamic';
  }
  
  /**
   * Get the type of this component
   * @returns The component type as a string
   */
  public getType(): string {
    return 'RigidBody';
  }
  
  /**
   * Create a clone of this component
   * @returns A new instance of the component
   */
  public clone(): Component {
    const clone = new RigidBody();
    clone.velocity = this.velocity.clone();
    clone.acceleration = this.acceleration.clone();
    clone.mass = this.mass;
    clone.drag = this.drag;
    clone.useGravity = this.useGravity;
    clone.isKinematic = this.isKinematic;
    clone.isTrigger = this.isTrigger;
    clone.bodyType = this.bodyType;
    return clone;
  }
  
  /**
   * Apply a force to the rigidbody
   * @param force The force to apply
   */
  public applyForce(force: Vector2): void {
    // F = ma, so a = F/m
    const accelerationFromForce = new Vector2(
      force.x / this.mass,
      force.y / this.mass
    );
    
    this.acceleration.add(accelerationFromForce);
  }
  
  /**
   * Apply an impulse (immediate change in velocity)
   * @param impulse The impulse to apply
   */
  public applyImpulse(impulse: Vector2): void {
    const velocityChange = new Vector2(
      impulse.x / this.mass,
      impulse.y / this.mass
    );
    
    this.velocity.add(velocityChange);
  }
  
  /**
   * Set the velocity directly
   * @param velocity The new velocity
   */
  public setVelocity(velocity: Vector2): void {
    this.velocity = velocity.clone();
  }
  
  /**
   * Called by the physics system to update the rigidbody
   * @param deltaTime Time elapsed since the last update
   */
  override update(deltaTime: number): void {
    if (this.isKinematic || this.bodyType === 'static') {
      // Kinematic or static bodies are not affected by physics
      return;
    }
    
    // Apply gravity
    if (this.useGravity) {
      this.acceleration.y += 9.8; // Gravity acceleration (9.8 m/s²)
    }
    
    // Update velocity based on acceleration
    this.velocity.x += this.acceleration.x * deltaTime;
    this.velocity.y += this.acceleration.y * deltaTime;
    
    // Apply drag
    this.velocity.x *= (1 - this.drag);
    this.velocity.y *= (1 - this.drag);
    
    // Update position based on velocity
    if (this.gameObject) {
      const transform = this.gameObject.getComponent('Transform');
      if (transform && 'position' in transform) {
        const position = (transform as any).position;
        position.x += this.velocity.x * deltaTime;
        position.y += this.velocity.y * deltaTime;
      }
    }
    
    // Reset acceleration for the next frame
    this.acceleration.x = 0;
    this.acceleration.y = 0;
  }
  
  /**
   * Serialize the component to JSON
   */
  override serialize(): any {
    return {
      type: 'RigidBody',
      velocity: this.velocity.serialize(),
      acceleration: this.acceleration.serialize(),
      mass: this.mass,
      drag: this.drag,
      useGravity: this.useGravity,
      isKinematic: this.isKinematic,
      isTrigger: this.isTrigger,
      bodyType: this.bodyType
    };
  }
  
  /**
   * Deserialize the component from JSON
   * @param data The JSON data
   */
  override deserialize(data: any): void {
    this.velocity = Vector2.deserialize(data.velocity);
    this.acceleration = Vector2.deserialize(data.acceleration);
    this.mass = data.mass;
    this.drag = data.drag;
    this.useGravity = data.useGravity;
    this.isKinematic = data.isKinematic;
    this.isTrigger = data.isTrigger;
    this.bodyType = data.bodyType;
  }
}