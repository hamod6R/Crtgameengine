/**
 * A 2D vector class
 */
export class Vector2 {
  public x: number;
  public y: number;
  
  constructor(x: number = 0, y: number = 0) {
    this.x = x;
    this.y = y;
  }
  
  /**
   * Set the vector components
   * @param x X component
   * @param y Y component
   */
  public set(x: number, y: number): this {
    this.x = x;
    this.y = y;
    return this;
  }
  
  /**
   * Copy values from another vector
   * @param v Vector to copy from
   */
  public copy(v: Vector2): this {
    this.x = v.x;
    this.y = v.y;
    return this;
  }
  
  /**
   * Create a new Vector2 with the same values
   * @returns A new Vector2 with the same values
   */
  public clone(): Vector2 {
    return new Vector2(this.x, this.y);
  }
  
  /**
   * Add another vector to this one
   * @param v Vector to add
   */
  public add(v: Vector2): this {
    this.x += v.x;
    this.y += v.y;
    return this;
  }
  
  /**
   * Subtract another vector from this one
   * @param v Vector to subtract
   */
  public subtract(v: Vector2): this {
    this.x -= v.x;
    this.y -= v.y;
    return this;
  }
  
  /**
   * Multiply this vector by a scalar
   * @param scalar Scalar value
   */
  public multiply(scalar: number): this {
    this.x *= scalar;
    this.y *= scalar;
    return this;
  }
  
  /**
   * Divide this vector by a scalar
   * @param scalar Scalar value
   */
  public divide(scalar: number): this {
    if (scalar !== 0) {
      this.x /= scalar;
      this.y /= scalar;
    }
    return this;
  }
  
  /**
   * Get the magnitude (length) of this vector
   * @returns The magnitude of the vector
   */
  public magnitude(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }
  
  /**
   * Get the squared magnitude of this vector
   * @returns The squared magnitude of the vector
   */
  public magnitudeSquared(): number {
    return this.x * this.x + this.y * this.y;
  }
  
  /**
   * Normalize this vector (make it unit length)
   */
  public normalize(): this {
    const mag = this.magnitude();
    if (mag !== 0) {
      this.divide(mag);
    }
    return this;
  }
  
  /**
   * Get the dot product of this vector with another
   * @param v The other vector
   * @returns The dot product
   */
  public dot(v: Vector2): number {
    return this.x * v.x + this.y * v.y;
  }
  
  /**
   * Calculate the distance between two vectors
   * @param a First vector
   * @param b Second vector
   * @returns The distance between the vectors
   */
  public static distance(a: Vector2, b: Vector2): number {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  /**
   * Calculate the squared distance between two vectors
   * @param a First vector
   * @param b Second vector
   * @returns The squared distance between the vectors
   */
  public static distanceSquared(a: Vector2, b: Vector2): number {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return dx * dx + dy * dy;
  }
  
  /**
   * Linearly interpolate between two vectors
   * @param a Start vector
   * @param b End vector
   * @param t Interpolation parameter (0-1)
   * @returns The interpolated vector
   */
  public static lerp(a: Vector2, b: Vector2, t: number): Vector2 {
    t = Math.max(0, Math.min(1, t)); // Clamp t to [0,1]
    return new Vector2(
      a.x + (b.x - a.x) * t,
      a.y + (b.y - a.y) * t
    );
  }
}
