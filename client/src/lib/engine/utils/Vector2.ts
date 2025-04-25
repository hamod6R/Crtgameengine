/**
 * 2D vector class
 */
export class Vector2 {
  public x: number;
  public y: number;
  
  /**
   * Create a new Vector2
   * @param x X coordinate
   * @param y Y coordinate
   */
  constructor(x: number = 0, y: number = 0) {
    this.x = x;
    this.y = y;
  }
  
  /**
   * Add another vector to this vector
   * @param v The vector to add
   * @returns This vector for chaining
   */
  public add(v: Vector2): Vector2 {
    this.x += v.x;
    this.y += v.y;
    return this;
  }
  
  /**
   * Subtract another vector from this vector
   * @param v The vector to subtract
   * @returns This vector for chaining
   */
  public subtract(v: Vector2): Vector2 {
    this.x -= v.x;
    this.y -= v.y;
    return this;
  }
  
  /**
   * Multiply this vector by a scalar
   * @param scalar The scalar to multiply by
   * @returns This vector for chaining
   */
  public multiply(scalar: number): Vector2 {
    this.x *= scalar;
    this.y *= scalar;
    return this;
  }
  
  /**
   * Divide this vector by a scalar
   * @param scalar The scalar to divide by
   * @returns This vector for chaining
   */
  public divide(scalar: number): Vector2 {
    if (scalar !== 0) {
      this.x /= scalar;
      this.y /= scalar;
    }
    return this;
  }
  
  /**
   * Calculate the magnitude (length) of this vector
   * @returns The magnitude
   */
  public magnitude(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }
  
  /**
   * Calculate the squared magnitude of this vector
   * (faster than magnitude as it avoids the square root)
   * @returns The squared magnitude
   */
  public magnitudeSquared(): number {
    return this.x * this.x + this.y * this.y;
  }
  
  /**
   * Normalize this vector (make it unit length)
   * @returns This vector for chaining
   */
  public normalize(): Vector2 {
    const mag = this.magnitude();
    if (mag > 0) {
      this.x /= mag;
      this.y /= mag;
    }
    return this;
  }
  
  /**
   * Calculate the distance to another vector
   * @param v The other vector
   * @returns The distance
   */
  public distance(v: Vector2): number {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  /**
   * Calculate the squared distance to another vector
   * @param v The other vector
   * @returns The squared distance
   */
  public distanceSquared(v: Vector2): number {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    return dx * dx + dy * dy;
  }
  
  /**
   * Calculate the dot product with another vector
   * @param v The other vector
   * @returns The dot product
   */
  public dot(v: Vector2): number {
    return this.x * v.x + this.y * v.y;
  }
  
  /**
   * Calculate the cross product with another vector
   * @param v The other vector
   * @returns The cross product (a scalar in 2D)
   */
  public cross(v: Vector2): number {
    return this.x * v.y - this.y * v.x;
  }
  
  /**
   * Create a copy of this vector
   * @returns A new Vector2 with the same values
   */
  public clone(): Vector2 {
    return new Vector2(this.x, this.y);
  }
  
  /**
   * Set this vector's components
   * @param x X coordinate
   * @param y Y coordinate
   * @returns This vector for chaining
   */
  public set(x: number, y: number): Vector2 {
    this.x = x;
    this.y = y;
    return this;
  }
  
  /**
   * Copy values from another vector
   * @param v The vector to copy from
   * @returns This vector for chaining
   */
  public copy(v: Vector2): Vector2 {
    this.x = v.x;
    this.y = v.y;
    return this;
  }
  
  /**
   * Convert to a readable string
   * @returns String representation of the vector
   */
  public toString(): string {
    return `(${this.x}, ${this.y})`;
  }
  
  /**
   * Serialize the vector to a plain object
   * @returns Serialized vector object
   */
  public serialize(): any {
    return { x: this.x, y: this.y };
  }
  
  /**
   * Create a Vector2 from a serialized object
   * @param data The serialized data
   * @returns A new Vector2
   */
  public static deserialize(data: any): Vector2 {
    return new Vector2(data.x, data.y);
  }
  
  // Static utility methods
  
  /**
   * Create a zero vector
   * @returns A new zero vector
   */
  public static zero(): Vector2 {
    return new Vector2(0, 0);
  }
  
  /**
   * Create a unit vector pointing to the right (1, 0)
   * @returns A new right vector
   */
  public static right(): Vector2 {
    return new Vector2(1, 0);
  }
  
  /**
   * Create a unit vector pointing up (0, -1)
   * @returns A new up vector
   */
  public static up(): Vector2 {
    return new Vector2(0, -1);
  }
  
  /**
   * Create a unit vector pointing to the left (-1, 0)
   * @returns A new left vector
   */
  public static left(): Vector2 {
    return new Vector2(-1, 0);
  }
  
  /**
   * Create a unit vector pointing down (0, 1)
   * @returns A new down vector
   */
  public static down(): Vector2 {
    return new Vector2(0, 1);
  }
  
  /**
   * Calculate the distance between two vectors
   * @param a First vector
   * @param b Second vector
   * @returns Distance between the vectors
   */
  public static distance(a: Vector2, b: Vector2): number {
    return a.distance(b);
  }
  
  /**
   * Calculate the angle between two vectors in radians
   * @param a First vector
   * @param b Second vector
   * @returns Angle in radians
   */
  public static angle(a: Vector2, b: Vector2): number {
    // Dot product divided by the product of magnitudes gives cos(angle)
    const dot = a.dot(b);
    const mag = a.magnitude() * b.magnitude();
    
    if (mag === 0) return 0;
    
    // Clamp to avoid floating point errors outside [-1, 1]
    const cosAngle = Math.max(-1, Math.min(1, dot / mag));
    return Math.acos(cosAngle);
  }
  
  /**
   * Linearly interpolate between two vectors
   * @param a Start vector
   * @param b End vector
   * @param t Interpolation factor (0-1)
   * @returns Interpolated vector
   */
  public static lerp(a: Vector2, b: Vector2, t: number): Vector2 {
    t = Math.max(0, Math.min(1, t)); // Clamp t to [0, 1]
    return new Vector2(
      a.x + (b.x - a.x) * t,
      a.y + (b.y - a.y) * t
    );
  }
}