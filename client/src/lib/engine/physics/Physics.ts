import { GameObject } from "../GameObject";
import { Collider } from "../components/Collider";
import { RigidBody } from "../components/RigidBody";

interface CollisionPair {
  a: Collider;
  b: Collider;
}

/**
 * Physics engine that handles collision detection and resolution
 */
export class Physics {
  private lastCollisions: Set<string>;
  
  constructor() {
    this.lastCollisions = new Set<string>();
  }
  
  /**
   * Update physics for all provided game objects
   * @param deltaTime Time elapsed since the last update
   * @param gameObjects All game objects in the scene
   */
  public update(deltaTime: number, gameObjects: GameObject[] = []): void {
    // Update physics components
    this.updateRigidBodies(deltaTime, gameObjects);
    
    // Detect and handle collisions
    this.detectCollisions(gameObjects);
  }
  
  /**
   * Update all rigid bodies
   * @param deltaTime Time elapsed since the last update
   * @param gameObjects All game objects in the scene
   */
  private updateRigidBodies(deltaTime: number, gameObjects: GameObject[]): void {
    // This is handled by the RigidBody component's update method
    // We don't need to do anything here
  }
  
  /**
   * Detect and handle collisions between game objects
   * @param gameObjects All game objects in the scene
   */
  private detectCollisions(gameObjects: GameObject[]): void {
    // Get all colliders from active game objects
    const colliders: Collider[] = [];
    
    for (const gameObject of gameObjects) {
      if (!gameObject.isActive) continue;
      
      const collider = gameObject.getComponent("Collider") as Collider;
      if (collider) {
        colliders.push(collider);
      }
    }
    
    // Track current collisions
    const currentCollisions = new Set<string>();
    
    // Check all possible collision pairs
    for (let i = 0; i < colliders.length; i++) {
      for (let j = i + 1; j < colliders.length; j++) {
        const colliderA = colliders[i];
        const colliderB = colliders[j];
        
        // Skip if either collider's game object is null
        if (!colliderA.gameObject || !colliderB.gameObject) continue;
        
        // Create a unique ID for this collision pair
        const pairId = this.getCollisionPairId(colliderA, colliderB);
        
        // Check if the colliders intersect
        if (colliderA.intersects(colliderB)) {
          // Record the collision
          currentCollisions.add(pairId);
          
          // If this is a new collision, trigger enter events
          if (!this.lastCollisions.has(pairId)) {
            this.handleCollisionEnter(colliderA, colliderB);
          }
          
          // Resolve the collision if necessary
          if (!colliderA.isTrigger && !colliderB.isTrigger) {
            this.resolveCollision(colliderA, colliderB);
          }
        }
      }
    }
    
    // Check for collisions that ended
    this.lastCollisions.forEach(pairId => {
      if (!currentCollisions.has(pairId)) {
        // This collision no longer exists, trigger exit events
        const [idA, idB] = pairId.split('_');
        
        // Find the colliders from their IDs
        const colliderA = colliders.find(c => c.id === idA);
        const colliderB = colliders.find(c => c.id === idB);
        
        if (colliderA && colliderB) {
          this.handleCollisionExit(colliderA, colliderB);
        }
      }
    });
    
    // Update the last collisions set
    this.lastCollisions = currentCollisions;
  }
  
  /**
   * Generate a unique ID for a collision pair
   * @param a First collider
   * @param b Second collider
   * @returns Unique collision pair ID
   */
  private getCollisionPairId(a: Collider, b: Collider): string {
    // Ensure the ID is consistent regardless of the order of colliders
    return a.id < b.id ? `${a.id}_${b.id}` : `${b.id}_${a.id}`;
  }
  
  /**
   * Handle a new collision
   * @param a First collider
   * @param b Second collider
   */
  private handleCollisionEnter(a: Collider, b: Collider): void {
    if (!a.gameObject || !b.gameObject) return;
    
    // Determine if this is a trigger or a regular collision
    if (a.isTrigger || b.isTrigger) {
      // Trigger collision
      this.notifyScripts(a.gameObject, 'onTriggerEnter', b);
      this.notifyScripts(b.gameObject, 'onTriggerEnter', a);
    } else {
      // Regular collision
      this.notifyScripts(a.gameObject, 'onCollisionEnter', b);
      this.notifyScripts(b.gameObject, 'onCollisionEnter', a);
    }
  }
  
  /**
   * Handle a collision that has ended
   * @param a First collider
   * @param b Second collider
   */
  private handleCollisionExit(a: Collider, b: Collider): void {
    if (!a.gameObject || !b.gameObject) return;
    
    // Determine if this was a trigger or a regular collision
    if (a.isTrigger || b.isTrigger) {
      // Trigger collision
      this.notifyScripts(a.gameObject, 'onTriggerExit', b);
      this.notifyScripts(b.gameObject, 'onTriggerExit', a);
    } else {
      // Regular collision
      this.notifyScripts(a.gameObject, 'onCollisionExit', b);
      this.notifyScripts(b.gameObject, 'onCollisionExit', a);
    }
  }
  
  /**
   * Notify all scripts on a game object about a collision event
   * @param gameObject The game object with scripts
   * @param methodName The method to call on the scripts
   * @param other The other collider involved in the collision
   */
  private notifyScripts(gameObject: GameObject, methodName: string, other: Collider): void {
    const scripts = gameObject.getComponents("Script");
    
    scripts.forEach(script => {
      const method = (script as any)[methodName];
      if (typeof method === 'function') {
        method.call(script, other);
      }
    });
  }
  
  /**
   * Resolve a collision between two colliders
   * @param a First collider
   * @param b Second collider
   */
  private resolveCollision(a: Collider, b: Collider): void {
    if (!a.gameObject || !b.gameObject) return;
    
    // Get the rigid bodies (if they exist)
    const rigidBodyA = a.gameObject.getComponent("RigidBody") as RigidBody;
    const rigidBodyB = b.gameObject.getComponent("RigidBody") as RigidBody;
    
    // Skip if neither object has a rigid body
    if (!rigidBodyA && !rigidBodyB) return;
    
    // Skip if both are kinematic
    if (rigidBodyA?.isKinematic && rigidBodyB?.isKinematic) return;
    
    // Simple collision resolution for demo purposes
    // In a real engine, this would be more sophisticated
    
    // Get the transforms
    const transformA = a.gameObject.getComponent("Transform");
    const transformB = b.gameObject.getComponent("Transform");
    
    if (!transformA || !transformB) return;
    
    // Calculate the collision normal (very simplified)
    const dx = transformB.position.x - transformA.position.x;
    const dy = transformB.position.y - transformA.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Skip if the distance is zero
    if (distance === 0) return;
    
    // Normalize the direction
    const nx = dx / distance;
    const ny = dy / distance;
    
    // Calculate the minimum translation distance
    let mtd = 0;
    
    if (a.type === "circle" && b.type === "circle") {
      // Circle vs Circle
      mtd = (a.radius + b.radius) - distance;
    } else if (a.type === "box" && b.type === "box") {
      // Box vs Box (simplified)
      const overlapX = (a.width / 2 + b.width / 2) - Math.abs(dx);
      const overlapY = (a.height / 2 + b.height / 2) - Math.abs(dy);
      
      if (overlapX < overlapY) {
        mtd = overlapX;
      } else {
        mtd = overlapY;
      }
    } else {
      // Mixed types - use the simpler method for demo
      mtd = 10; // Just push a bit
    }
    
    // Apply the translation based on whether objects are kinematic
    if (rigidBodyA?.isKinematic && !rigidBodyB?.isKinematic) {
      // A is kinematic, only move B
      transformB.position.x += nx * mtd;
      transformB.position.y += ny * mtd;
      
      // Reverse B's velocity if it has one
      if (rigidBodyB) {
        rigidBodyB.velocity.x = -rigidBodyB.velocity.x * 0.5;
        rigidBodyB.velocity.y = -rigidBodyB.velocity.y * 0.5;
      }
    } else if (!rigidBodyA?.isKinematic && rigidBodyB?.isKinematic) {
      // B is kinematic, only move A
      transformA.position.x -= nx * mtd;
      transformA.position.y -= ny * mtd;
      
      // Reverse A's velocity if it has one
      if (rigidBodyA) {
        rigidBodyA.velocity.x = -rigidBodyA.velocity.x * 0.5;
        rigidBodyA.velocity.y = -rigidBodyA.velocity.y * 0.5;
      }
    } else {
      // Neither is kinematic, move both
      transformA.position.x -= nx * mtd / 2;
      transformA.position.y -= ny * mtd / 2;
      
      transformB.position.x += nx * mtd / 2;
      transformB.position.y += ny * mtd / 2;
      
      // Exchange momentum (simplified)
      if (rigidBodyA && rigidBodyB) {
        const tempVelAx = rigidBodyA.velocity.x;
        const tempVelAy = rigidBodyA.velocity.y;
        
        rigidBodyA.velocity.x = rigidBodyB.velocity.x * 0.8;
        rigidBodyA.velocity.y = rigidBodyB.velocity.y * 0.8;
        
        rigidBodyB.velocity.x = tempVelAx * 0.8;
        rigidBodyB.velocity.y = tempVelAy * 0.8;
      }
    }
  }
}
