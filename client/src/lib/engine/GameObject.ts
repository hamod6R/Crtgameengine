import { Component } from "./Component";
import { Transform } from "./components/Transform";
import { generateUUID } from "./utils/UUID";

/**
 * Represents a game object in the scene
 */
export class GameObject {
  public id: string;
  public name: string;
  public tag: string;
  public isActive: boolean;
  
  private components: Map<string, Component>;
  private children: GameObject[] = [];
  private parent: GameObject | null = null;
  
  constructor(name: string = "GameObject", tag: string = "Untagged") {
    this.id = generateUUID();
    this.name = name;
    this.tag = tag;
    this.isActive = true;
    
    this.components = new Map<string, Component>();
    
    // Add transform component by default
    this.addComponent(new Transform());
  }
  
  /**
   * Add a component to the game object
   * @param component The component to add
   * @returns The added component
   */
  public addComponent<T extends Component>(component: T): T {
    const componentType = component.getType();
    
    // Don't allow duplicate components of the same type (except scripts)
    if (componentType !== "Script" && this.components.has(componentType)) {
      console.warn(`GameObject ${this.name} already has a ${componentType} component.`);
      return component;
    }
    
    // Set the game object reference on the component
    component.gameObject = this;
    
    // Add the component to the map
    // For scripts, we need to ensure unique keys, so we use the type and ID
    const key = componentType === "Script" 
      ? `${componentType}_${component.id}`
      : componentType;
      
    this.components.set(key, component);
    
    return component;
  }
  
  /**
   * Get a component by type
   * @param componentType The type of component to get
   * @returns The component, or undefined if not found
   */
  public getComponent(componentType: string): Component | undefined {
    return this.components.get(componentType);
  }
  
  /**
   * Get all components of a specific type
   * @param componentType The type of components to get
   * @returns Array of components
   */
  public getComponents(componentType: string): Component[] {
    // For non-Script components, just return the single component (if it exists)
    if (componentType !== "Script") {
      const component = this.getComponent(componentType);
      return component ? [component] : [];
    }
    
    // For scripts, find all components that start with "Script_"
    const scripts: Component[] = [];
    
    this.components.forEach((component, key) => {
      if (key.startsWith(`${componentType}_`)) {
        scripts.push(component);
      }
    });
    
    return scripts;
  }
  
  /**
   * Remove a component by type
   * @param componentType The type of component to remove
   * @param componentId Optional ID for scripts to remove a specific script
   * @returns True if the component was removed, false otherwise
   */
  public removeComponent(componentType: string, componentId?: string): boolean {
    // Don't allow removing the transform component
    if (componentType === "Transform") {
      console.warn("Cannot remove Transform component from a GameObject.");
      return false;
    }
    
    // For non-Script components, just remove by type
    if (componentType !== "Script") {
      const component = this.components.get(componentType);
      
      if (component) {
        component.onDestroy();
        this.components.delete(componentType);
        return true;
      }
      
      return false;
    }
    
    // For scripts, we need the component ID
    if (!componentId) {
      console.warn("Component ID is required to remove a Script component.");
      return false;
    }
    
    const key = `${componentType}_${componentId}`;
    const component = this.components.get(key);
    
    if (component) {
      component.onDestroy();
      this.components.delete(key);
      return true;
    }
    
    return false;
  }
  
  /**
   * Add a child game object
   * @param child The child game object to add
   */
  public addChild(child: GameObject): void {
    // Remove the child from its current parent if it has one
    if (child.parent) {
      child.parent.removeChild(child);
    }
    
    // Set this object as the parent
    child.parent = this;
    
    // Add the child to this object's children
    this.children.push(child);
  }
  
  /**
   * Remove a child game object
   * @param child The child game object to remove
   */
  public removeChild(child: GameObject): void {
    const index = this.children.indexOf(child);
    
    if (index !== -1) {
      // Remove the parent reference
      child.parent = null;
      
      // Remove from the children array
      this.children.splice(index, 1);
    }
  }
  
  /**
   * Get all child game objects
   * @returns Array of child game objects
   */
  public getChildren(): GameObject[] {
    return [...this.children];
  }
  
  /**
   * Get the parent game object
   * @returns The parent game object, or null if there is no parent
   */
  public getParent(): GameObject | null {
    return this.parent;
  }
  
  /**
   * Create a clone of this game object
   * @returns A new game object with the same components
   */
  public clone(): GameObject {
    const clone = new GameObject(this.name, this.tag);
    
    // Set active state
    clone.isActive = this.isActive;
    
    // Clone all components except the default Transform
    // (since the clone already has one)
    this.components.forEach((component, key) => {
      if (key !== "Transform") {
        clone.addComponent(component.clone());
      } else {
        // For Transform, copy the values instead of replacing
        const originalTransform = component as Transform;
        const cloneTransform = clone.getComponent("Transform") as Transform;
        
        cloneTransform.position.copy(originalTransform.position);
        cloneTransform.rotation = originalTransform.rotation;
        cloneTransform.scale.copy(originalTransform.scale);
      }
    });
    
    // Clone all children recursively
    this.children.forEach(child => {
      const childClone = child.clone();
      clone.addChild(childClone);
    });
    
    return clone;
  }
  
  /**
   * Called when the GameObject is initialized
   */
  public awake(): void {
    // Call awake on all components
    this.components.forEach(component => {
      component.awake();
    });
    
    // Call awake on all children
    this.children.forEach(child => {
      child.awake();
    });
  }
  
  /**
   * Called when the GameObject is started
   */
  public start(): void {
    // Only process if the game object is active
    if (!this.isActive) return;
    
    // Call start on all components
    this.components.forEach(component => {
      component.start();
    });
    
    // Call start on all children
    this.children.forEach(child => {
      child.start();
    });
  }
  
  /**
   * Called every frame to update the GameObject
   */
  public update(deltaTime: number): void {
    // Only process if the game object is active
    if (!this.isActive) return;
    
    // Call update on all components
    this.components.forEach(component => {
      component.update(deltaTime);
    });
    
    // Call update on all children
    this.children.forEach(child => {
      child.update(deltaTime);
    });
  }
  
  /**
   * Called when the GameObject is stopped
   */
  public stop(): void {
    // Call stop on all components
    this.components.forEach(component => {
      component.stop();
    });
    
    // Call stop on all children
    this.children.forEach(child => {
      child.stop();
    });
  }
  
  /**
   * Called when the GameObject is destroyed
   */
  public onDestroy(): void {
    // Call onDestroy on all components
    this.components.forEach(component => {
      component.onDestroy();
    });
    
    // Call onDestroy on all children
    this.children.forEach(child => {
      child.onDestroy();
    });
    
    // Clear the components map
    this.components.clear();
    
    // Clear the children array
    this.children = [];
  }
  
  /**
   * Convert the game object to JSON for serialization
   */
  public toJSON(): Record<string, any> {
    const componentData: Record<string, any>[] = [];
    
    this.components.forEach((component, key) => {
      componentData.push({
        type: component.getType(),
        id: component.id,
        data: component.serialize()
      });
    });
    
    const childrenData = this.children.map(child => child.toJSON());
    
    return {
      id: this.id,
      name: this.name,
      tag: this.tag,
      isActive: this.isActive,
      components: componentData,
      children: childrenData
    };
  }
  
  /**
   * Create a game object from JSON data
   */
  public static fromJSON(data: Record<string, any>): GameObject {
    const gameObject = new GameObject(data.name, data.tag);
    
    // Set ID and active state
    gameObject.id = data.id;
    gameObject.isActive = data.isActive;
    
    // Create components
    if (Array.isArray(data.components)) {
      data.components.forEach((componentData: Record<string, any>) => {
        // Skip the Transform component since it's already added by default
        if (componentData.type === "Transform") {
          // Instead, update the existing transform with the serialized data
          const transform = gameObject.getComponent("Transform") as Transform;
          if (transform) {
            transform.deserialize(componentData.data);
          }
        } else {
          // For other components, we need to create and add them
          // This would require a component registry to create components by type
          // For now, we'll just log a warning
          console.warn(`Component ${componentData.type} cannot be created from JSON yet.`);
        }
      });
    }
    
    // Create children
    if (Array.isArray(data.children)) {
      data.children.forEach((childData: Record<string, any>) => {
        const childGameObject = GameObject.fromJSON(childData);
        gameObject.addChild(childGameObject);
      });
    }
    
    return gameObject;
  }
}
