import { Vector2 } from "./Vector2";

/**
 * A 3x3 matrix class for 2D transformations
 */
export class Matrix3 {
  private values: number[];
  
  constructor() {
    // Initialize as identity matrix
    this.values = [
      1, 0, 0,
      0, 1, 0,
      0, 0, 1
    ];
  }
  
  /**
   * Set the matrix to identity
   */
  public identity(): this {
    this.values = [
      1, 0, 0,
      0, 1, 0,
      0, 0, 1
    ];
    return this;
  }
  
  /**
   * Set the matrix values directly
   * @param m00 Element at row 0, column 0
   * @param m01 Element at row 0, column 1
   * @param m02 Element at row 0, column 2
   * @param m10 Element at row 1, column 0
   * @param m11 Element at row 1, column 1
   * @param m12 Element at row 1, column 2
   * @param m20 Element at row 2, column 0
   * @param m21 Element at row 2, column 1
   * @param m22 Element at row 2, column 2
   */
  public set(
    m00: number, m01: number, m02: number,
    m10: number, m11: number, m12: number,
    m20: number, m21: number, m22: number
  ): this {
    this.values[0] = m00; this.values[1] = m01; this.values[2] = m02;
    this.values[3] = m10; this.values[4] = m11; this.values[5] = m12;
    this.values[6] = m20; this.values[7] = m21; this.values[8] = m22;
    return this;
  }
  
  /**
   * Get a specific element from the matrix
   * @param row Row index (0-2)
   * @param col Column index (0-2)
   * @returns The element value
   */
  public get(row: number, col: number): number {
    return this.values[row * 3 + col];
  }
  
  /**
   * Set a specific element in the matrix
   * @param row Row index (0-2)
   * @param col Column index (0-2)
   * @param value The value to set
   */
  public setValue(row: number, col: number, value: number): this {
    this.values[row * 3 + col] = value;
    return this;
  }
  
  /**
   * Multiply this matrix by another
   * @param m The matrix to multiply by
   */
  public multiply(m: Matrix3): this {
    const a = this.values;
    const b = m.values;
    
    const a00 = a[0], a01 = a[1], a02 = a[2];
    const a10 = a[3], a11 = a[4], a12 = a[5];
    const a20 = a[6], a21 = a[7], a22 = a[8];
    
    const b00 = b[0], b01 = b[1], b02 = b[2];
    const b10 = b[3], b11 = b[4], b12 = b[5];
    const b20 = b[6], b21 = b[7], b22 = b[8];
    
    this.values[0] = b00 * a00 + b01 * a10 + b02 * a20;
    this.values[1] = b00 * a01 + b01 * a11 + b02 * a21;
    this.values[2] = b00 * a02 + b01 * a12 + b02 * a22;
    
    this.values[3] = b10 * a00 + b11 * a10 + b12 * a20;
    this.values[4] = b10 * a01 + b11 * a11 + b12 * a21;
    this.values[5] = b10 * a02 + b11 * a12 + b12 * a22;
    
    this.values[6] = b20 * a00 + b21 * a10 + b22 * a20;
    this.values[7] = b20 * a01 + b21 * a11 + b22 * a21;
    this.values[8] = b20 * a02 + b21 * a12 + b22 * a22;
    
    return this;
  }
  
  /**
   * Create a translation matrix
   * @param x X translation
   * @param y Y translation
   * @returns A new translation matrix
   */
  public static createTranslation(x: number, y: number): Matrix3 {
    const m = new Matrix3();
    m.set(
      1, 0, x,
      0, 1, y,
      0, 0, 1
    );
    return m;
  }
  
  /**
   * Create a rotation matrix
   * @param angle Rotation angle in radians
   * @returns A new rotation matrix
   */
  public static createRotation(angle: number): Matrix3 {
    const m = new Matrix3();
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    
    m.set(
      cos, -sin, 0,
      sin, cos, 0,
      0, 0, 1
    );
    
    return m;
  }
  
  /**
   * Create a scaling matrix
   * @param x X scale factor
   * @param y Y scale factor
   * @returns A new scaling matrix
   */
  public static createScale(x: number, y: number): Matrix3 {
    const m = new Matrix3();
    m.set(
      x, 0, 0,
      0, y, 0,
      0, 0, 1
    );
    return m;
  }
  
  /**
   * Transform a vector by this matrix
   * @param v The vector to transform
   * @returns The transformed vector
   */
  public transformVector(v: Vector2): Vector2 {
    const x = v.x;
    const y = v.y;
    
    const nx = this.values[0] * x + this.values[1] * y + this.values[2];
    const ny = this.values[3] * x + this.values[4] * y + this.values[5];
    
    return new Vector2(nx, ny);
  }
  
  /**
   * Create a matrix from a position, rotation, and scale
   * @param position The position vector
   * @param rotation The rotation in radians
   * @param scale The scale vector
   * @returns A new transformation matrix
   */
  public static createTransform(
    position: Vector2,
    rotation: number,
    scale: Vector2
  ): Matrix3 {
    // Create individual transformation matrices
    const translationMatrix = Matrix3.createTranslation(position.x, position.y);
    const rotationMatrix = Matrix3.createRotation(rotation);
    const scaleMatrix = Matrix3.createScale(scale.x, scale.y);
    
    // Combine the matrices (scale, then rotate, then translate)
    const result = new Matrix3();
    result.multiply(scaleMatrix);
    result.multiply(rotationMatrix);
    result.multiply(translationMatrix);
    
    return result;
  }
}
