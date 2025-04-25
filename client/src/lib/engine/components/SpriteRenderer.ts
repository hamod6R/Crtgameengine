import { Component } from "../Component";

/**
 * Component that renders a sprite for a GameObject
 */
export class SpriteRenderer extends Component {
  public sprite: HTMLImageElement | null = null;
  public color: string = "#ffffff";
  public flipX: boolean = false;
  public flipY: boolean = false;
  public width: number = 100;
  public height: number = 100;
  public opacity: number = 1;
  
  // Sprite animation properties
  public spriteSheet: HTMLImageElement | null = null;
  public spriteSheetColumns: number = 1;
  public spriteSheetRows: number = 1;
  public currentColumn: number = 0;
  public currentRow: number = 0;
  
  constructor(sprite?: HTMLImageElement, color: string = "#ffffff") {
    super();
    this.sprite = sprite || null;
    this.color = color;
  }
  
  /**
   * Get the type of the component
   * @returns The component type as a string
   */
  public getType(): string {
    return "SpriteRenderer";
  }
  
  /**
   * Load a sprite from a URL
   * @param url URL of the sprite image
   * @returns Promise that resolves when the sprite is loaded
   */
  public loadSprite(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        this.sprite = img;
        this.width = img.width;
        this.height = img.height;
        resolve();
      };
      
      img.onerror = (error) => {
        reject(error);
      };
      
      img.src = url;
    });
  }
  
  /**
   * Load a sprite sheet from a URL
   * @param url URL of the sprite sheet image
   * @param columns Number of columns in the sprite sheet
   * @param rows Number of rows in the sprite sheet
   * @returns Promise that resolves when the sprite sheet is loaded
   */
  public loadSpriteSheet(url: string, columns: number, rows: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        this.spriteSheet = img;
        this.spriteSheetColumns = columns;
        this.spriteSheetRows = rows;
        
        // Set default width and height based on the sprite sheet dimensions
        this.width = img.width / columns;
        this.height = img.height / rows;
        
        resolve();
      };
      
      img.onerror = (error) => {
        reject(error);
      };
      
      img.src = url;
    });
  }
  
  /**
   * Set the sprite frame for animation
   * @param column Column index in the sprite sheet
   * @param row Row index in the sprite sheet
   */
  public setFrame(column: number, row: number): void {
    if (!this.spriteSheet) return;
    
    this.currentColumn = Math.max(0, Math.min(column, this.spriteSheetColumns - 1));
    this.currentRow = Math.max(0, Math.min(row, this.spriteSheetRows - 1));
  }
  
  /**
   * Render the sprite to a 2D rendering context
   * @param ctx The 2D rendering context
   */
  public render(ctx: CanvasRenderingContext2D): void {
    if (!this.gameObject) return;
    
    const transform = this.gameObject.getComponent("Transform");
    if (!transform) return;
    
    // Save the current context state
    ctx.save();
    
    // Apply transform
    ctx.translate(transform.position.x, transform.position.y);
    ctx.rotate((transform.rotation * Math.PI) / 180);
    ctx.scale(
      transform.scale.x * (this.flipX ? -1 : 1),
      transform.scale.y * (this.flipY ? -1 : 1)
    );
    
    // Apply opacity
    ctx.globalAlpha = this.opacity;
    
    // Draw the sprite
    if (this.spriteSheet) {
      // Calculate the source rectangle in the sprite sheet
      const srcX = this.currentColumn * this.width;
      const srcY = this.currentRow * this.height;
      
      ctx.drawImage(
        this.spriteSheet,
        srcX, srcY, this.width, this.height,
        -this.width / 2, -this.height / 2, this.width, this.height
      );
    } else if (this.sprite) {
      ctx.drawImage(
        this.sprite,
        -this.width / 2, -this.height / 2, this.width, this.height
      );
    } else {
      // Draw a colored rectangle if no sprite is set
      ctx.fillStyle = this.color;
      ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
    }
    
    // Restore the context state
    ctx.restore();
  }
  
  /**
   * Create a clone of this component
   * @returns A new SpriteRenderer component
   */
  public clone(): SpriteRenderer {
    const clone = new SpriteRenderer();
    
    clone.sprite = this.sprite;
    clone.color = this.color;
    clone.flipX = this.flipX;
    clone.flipY = this.flipY;
    clone.width = this.width;
    clone.height = this.height;
    clone.opacity = this.opacity;
    
    clone.spriteSheet = this.spriteSheet;
    clone.spriteSheetColumns = this.spriteSheetColumns;
    clone.spriteSheetRows = this.spriteSheetRows;
    clone.currentColumn = this.currentColumn;
    clone.currentRow = this.currentRow;
    
    return clone;
  }
  
  /**
   * Serialize the component data to JSON
   * @returns Serialized component data
   */
  public serialize(): Record<string, any> {
    // Note: We can't serialize the actual image objects,
    // so we'll just serialize the properties we need to recreate them
    return {
      color: this.color,
      flipX: this.flipX,
      flipY: this.flipY,
      width: this.width,
      height: this.height,
      opacity: this.opacity,
      
      // Sprite animation properties
      spriteSheetColumns: this.spriteSheetColumns,
      spriteSheetRows: this.spriteSheetRows,
      currentColumn: this.currentColumn,
      currentRow: this.currentRow,
      
      // We'll need to save references to the image assets separately
      // This would typically be handled by the asset management system
      spriteAssetId: this.sprite ? "sprite_asset_id" : null,
      spriteSheetAssetId: this.spriteSheet ? "spritesheet_asset_id" : null,
    };
  }
  
  /**
   * Deserialize component data from JSON
   * @param data The data to deserialize
   */
  public deserialize(data: Record<string, any>): void {
    if (typeof data.color === 'string') {
      this.color = data.color;
    }
    
    if (typeof data.flipX === 'boolean') {
      this.flipX = data.flipX;
    }
    
    if (typeof data.flipY === 'boolean') {
      this.flipY = data.flipY;
    }
    
    if (typeof data.width === 'number') {
      this.width = data.width;
    }
    
    if (typeof data.height === 'number') {
      this.height = data.height;
    }
    
    if (typeof data.opacity === 'number') {
      this.opacity = data.opacity;
    }
    
    if (typeof data.spriteSheetColumns === 'number') {
      this.spriteSheetColumns = data.spriteSheetColumns;
    }
    
    if (typeof data.spriteSheetRows === 'number') {
      this.spriteSheetRows = data.spriteSheetRows;
    }
    
    if (typeof data.currentColumn === 'number') {
      this.currentColumn = data.currentColumn;
    }
    
    if (typeof data.currentRow === 'number') {
      this.currentRow = data.currentRow;
    }
    
    // The actual sprite and spriteSheet images would need to be loaded
    // by the asset management system using the saved asset IDs
  }
}
