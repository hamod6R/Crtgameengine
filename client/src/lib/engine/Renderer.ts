/**
 * Renderer class for the game engine
 * Handles rendering the game scene to a canvas
 */
export class Renderer {
  private canvas: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D | null = null;
  private width: number = 800;
  private height: number = 600;
  
  /**
   * Set the canvas element to render to
   * @param canvas The canvas element
   */
  public setCanvas(canvas: HTMLCanvasElement | null): void {
    this.canvas = canvas;
    
    if (canvas) {
      this.context = canvas.getContext('2d');
      this.width = canvas.width;
      this.height = canvas.height;
    } else {
      this.context = null;
    }
  }
  
  /**
   * Set the size of the rendering area
   * @param width The width in pixels
   * @param height The height in pixels
   */
  public setSize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    
    if (this.canvas) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
  }
  
  /**
   * Get the current canvas width
   * @returns The width in pixels
   */
  public getWidth(): number {
    return this.width;
  }
  
  /**
   * Get the current canvas height
   * @returns The height in pixels
   */
  public getHeight(): number {
    return this.height;
  }
  
  /**
   * Get the rendering context
   * @returns The 2D rendering context or null if not available
   */
  public getContext(): CanvasRenderingContext2D | null {
    return this.context;
  }
  
  /**
   * Clear the canvas
   * @param color Optional color to clear with
   */
  public clear(color: string = 'black'): void {
    if (!this.context || !this.canvas) return;
    
    // Save the current transformation matrix
    this.context.save();
    
    // Use the identity matrix while clearing the canvas
    this.context.setTransform(1, 0, 0, 1, 0, 0);
    this.context.fillStyle = color;
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Restore the transform
    this.context.restore();
  }
}