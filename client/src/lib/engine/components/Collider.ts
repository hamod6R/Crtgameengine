import { Component } from "../Component";
import { Vector2 } from "../utils/Vector2";

export type ColliderType = "box" | "circle";

/**
 * Component that enables collision detection for a GameObject
 */
export class Collider extends Component {
  public type: ColliderType;
  public width: number;
  public height: number;
  public radius: number;
  public offset: Vector2;
  public isTrigger: boolean;
  
  // Cached transform component for performance
  private transform: any | null = null;
  
  constructor(type: ColliderType = "box") {
    super();
    this.type = type;
    this.width = 100;
    this.height = 100;
    this.radius = 50;
    this.offset = new Vector2(0, 0);
    this.isTrigger = false;
  }
  
  /**
   * Get the type of the component
   * @returns The component type as a string
   */
  public getType(): string {
    return "Collider";
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
   * Check if this collider intersects with another collider
   * @param other The other collider to check against
   * @returns True if the colliders intersect, false otherwise
   */
  public intersects(other: Collider): boolean {
    if (!this.transform || !other.transform) return false;
    
    // Get world positions
    const posA = new Vector2(
      this.transform.position.x + this.offset.x,
      this.transform.position.y + this.offset.y
    );
    
    const posB = new Vector2(
      other.transform.position.x + other.offset.x,
      other.transform.position.y + other.offset.y
    );
    
    // Box vs Box
    if (this.type === "box" && other.type === "box") {
      const halfWidthA = this.width / 2;
      const halfHeightA = this.height / 2;
      const halfWidthB = other.width / 2;
      const halfHeightB = other.height / 2;
      
      return (
        Math.abs(posA.x - posB.x) < halfWidthA + halfWidthB &&
        Math.abs(posA.y - posB.y) < halfHeightA + halfHeightB
      );
    }
    
    // Circle vs Circle
    if (this.type === "circle" && other.type === "circle") {
      const distance = Vector2.distance(posA, posB);
      return distance < this.radius + other.radius;
    }
    
    // Box vs Circle
    if (this.type === "box" && other.type === "circle") {
      return this.boxCircleIntersection(
        posA, this.width, this.height,
        posB, other.radius
      );
    }
    
    // Circle vs Box
    if (this.type === "circle" && other.type === "box") {
      return this.boxCircleIntersection(
        posB, other.width, other.height,
        posA, this.radius
      );
    }
    
    return false;
  }
  
  /**
   * Check if a box and circle intersect
   * @param boxPos Box position
   * @param boxWidth Box width
   * @param boxHeight Box height
   * @param circlePos Circle position
   * @param circleRadius Circle radius
   * @returns True if they intersect, false otherwise
   */
  private boxCircleIntersection(
    boxPos: Vector2,
    boxWidth: number,
    boxHeight: number,
    circlePos: Vector2,
    circleRadius: number
  ): boolean {
    // Find the closest point on the box to the circle
    const closestX = Math.max(
      boxPos.x - boxWidth / 2,
      Math.min(circlePos.x, boxPos.x + boxWidth / 2)
    );
    
    const closestY = Math.max(
      boxPos.y - boxHeight / 2,
      Math.min(circlePos.y, boxPos.y + boxHeight / 2)
    );
    
    // Calculate the distance between the closest point and circle center
    const distanceX = circlePos.x - closestX;
    const distanceY = circlePos.y - closestY;
    const distanceSquared = distanceX * distanceX + distanceY * distanceY;
    
    // Check if the distance is less than the circle radius
    return distanceSquared < circleRadius * circleRadius;
  }
  
  /**
   * Draw the collider bounds for debugging
   * @param ctx The 2D rendering context
   */
  public drawDebug(ctx: CanvasRenderingContext2D): void {
    if (!this.transform) return;
    
    ctx.save();
    
    // Set debug appearance
    ctx.strokeStyle = this.isTrigger ? "yellow" : "red";
    ctx.lineWidth = 2;
    
    // Apply transform and offset
    ctx.translate(
      this.transform.position.x + this.offset.x,
      this.transform.position.y + this.offset.y
    );
    ctx.rotate((this.transform.rotation * Math.PI) / 180);
    
    // Draw the appropriate shape
    if (this.type === "box") {
      ctx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);
    } else if (this.type === "circle") {
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    ctx.restore();
  }
  
  /**
   * Create a clone of this component
   * @returns A new Collider component
   */
  public clone(): Collider {
    const clone = new Collider(this.type);
    
    clone.width = this.width;
    clone.height = this.height;
    clone.radius = this.radius;
    clone.offset.copy(this.offset);
    clone.isTrigger = this.isTrigger;
    
    return clone;
  }
  
  /**
   * Serialize the component data to JSON
   * @returns Serialized component data
   */
  public serialize(): Record<string, any> {
    return {
      type: this.type,
      width: this.width,
      height: this.height,
      radius: this.radius,
      offset: { x: this.offset.x, y: this.offset.y },
      isTrigger: this.isTrigger
    };
  }
  
  /**
   * Deserialize component data from JSON
   * @param data The data to deserialize
   */
  public deserialize(data: Record<string, any>): void {
    if (data.type) {
      this.type = data.type;
    }
    
    if (typeof data.width === 'number') {
      this.width = data.width;
    }
    
    if (typeof data.height === 'number') {
      this.height = data.height;
    }
    
    if (typeof data.radius === 'number') {
      this.radius = data.radius;
    }
    
    if (data.offset) {
      this.offset.set(data.offset.x, data.offset.y);
    }
    
    if (typeof data.isTrigger === 'boolean') {
      this.isTrigger = data.isTrigger;
    }
  }
}
