import { Component } from "../Component";

interface AnimationClip {
  name: string;
  frames: Array<{ column: number; row: number }>;
  frameRate: number;
  loop: boolean;
}

/**
 * Component that handles sprite animation for a GameObject
 */
export class Animator extends Component {
  public clips: Map<string, AnimationClip>;
  public currentClip: string | null = null;
  public isPlaying: boolean = false;
  
  private currentFrame: number = 0;
  private frameTimer: number = 0;
  private spriteRenderer: any | null = null;
  
  constructor() {
    super();
    this.clips = new Map<string, AnimationClip>();
  }
  
  /**
   * Get the type of the component
   * @returns The component type as a string
   */
  public getType(): string {
    return "Animator";
  }
  
  /**
   * Called when the component is first initialized
   */
  public awake(): void {
    // Cache the sprite renderer component
    if (this.gameObject) {
      this.spriteRenderer = this.gameObject.getComponent("SpriteRenderer");
    }
  }
  
  /**
   * Add an animation clip
   * @param name Name of the animation clip
   * @param frames Array of frame indices (column, row)
   * @param frameRate Frames per second
   * @param loop Whether the animation should loop
   */
  public addClip(
    name: string,
    frames: Array<{ column: number; row: number }>,
    frameRate: number = 12,
    loop: boolean = true
  ): void {
    const clip: AnimationClip = {
      name,
      frames,
      frameRate,
      loop
    };
    
    this.clips.set(name, clip);
  }
  
  /**
   * Play an animation clip
   * @param clipName Name of the clip to play
   */
  public play(clipName: string): void {
    if (!this.clips.has(clipName)) {
      console.warn(`Animation clip '${clipName}' not found`);
      return;
    }
    
    // Reset if playing a different clip
    if (this.currentClip !== clipName) {
      this.currentClip = clipName;
      this.currentFrame = 0;
      this.frameTimer = 0;
    }
    
    this.isPlaying = true;
  }
  
  /**
   * Stop the current animation
   */
  public stop(): void {
    this.isPlaying = false;
  }
  
  /**
   * Called every frame to update the component
   * @param deltaTime Time elapsed since the last update
   */
  public update(deltaTime: number): void {
    if (!this.isPlaying || !this.currentClip || !this.spriteRenderer) return;
    
    const clip = this.clips.get(this.currentClip);
    if (!clip || clip.frames.length === 0) return;
    
    // Update frame timer
    this.frameTimer += deltaTime;
    
    // Calculate frame duration based on frame rate
    const frameDuration = 1 / clip.frameRate;
    
    // Update current frame if needed
    if (this.frameTimer >= frameDuration) {
      this.frameTimer -= frameDuration;
      this.currentFrame++;
      
      // Handle end of animation
      if (this.currentFrame >= clip.frames.length) {
        if (clip.loop) {
          // Loop back to the start
          this.currentFrame = 0;
        } else {
          // Stop at the last frame
          this.currentFrame = clip.frames.length - 1;
          this.isPlaying = false;
        }
      }
      
      // Update the sprite renderer
      const frame = clip.frames[this.currentFrame];
      this.spriteRenderer.setFrame(frame.column, frame.row);
    }
  }
  
  /**
   * Create a clone of this component
   * @returns A new Animator component
   */
  public clone(): Animator {
    const clone = new Animator();
    
    // Clone all animation clips
    this.clips.forEach((clip, name) => {
      clone.addClip(
        name,
        [...clip.frames], // Create a new array with the same frame data
        clip.frameRate,
        clip.loop
      );
    });
    
    // Set the current clip if there is one
    if (this.currentClip) {
      clone.currentClip = this.currentClip;
    }
    
    return clone;
  }
  
  /**
   * Serialize the component data to JSON
   * @returns Serialized component data
   */
  public serialize(): Record<string, any> {
    const clipsData: Record<string, any> = {};
    
    this.clips.forEach((clip, name) => {
      clipsData[name] = {
        frames: clip.frames,
        frameRate: clip.frameRate,
        loop: clip.loop
      };
    });
    
    return {
      clips: clipsData,
      currentClip: this.currentClip,
      isPlaying: this.isPlaying,
      currentFrame: this.currentFrame
    };
  }
  
  /**
   * Deserialize component data from JSON
   * @param data The data to deserialize
   */
  public deserialize(data: Record<string, any>): void {
    // Clear existing clips
    this.clips.clear();
    
    // Recreate animation clips
    if (data.clips && typeof data.clips === 'object') {
      Object.entries(data.clips).forEach(([name, clipData]: [string, any]) => {
        if (clipData.frames && Array.isArray(clipData.frames)) {
          this.addClip(
            name,
            clipData.frames,
            clipData.frameRate,
            clipData.loop
          );
        }
      });
    }
    
    if (typeof data.currentClip === 'string') {
      this.currentClip = data.currentClip;
    }
    
    if (typeof data.isPlaying === 'boolean') {
      this.isPlaying = data.isPlaying;
    }
    
    if (typeof data.currentFrame === 'number') {
      this.currentFrame = data.currentFrame;
    }
  }
}
