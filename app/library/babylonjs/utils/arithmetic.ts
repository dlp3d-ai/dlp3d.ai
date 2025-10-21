import * as BABYLON from '@babylonjs/core'
import { Arithmetic } from '@/library/babylonjs/core'
import { reshapeArray } from '@/library/babylonjs/utils'

/**
 * ArithmeticParseError
 *
 * Error type thrown when parsing arithmetic-related data fails.
 */
export class ArithmeticParseError extends Error {
  /**
   * Create a new ArithmeticParseError.
   *
   * @param message Optional error message, defaults to 'Arithmetic parse exception'
   */
  constructor(message: string = 'Arithmetic parse error') {
    super(message)
    this.name = 'ArithmeticParseError'
  }
}

/**
 * Resolve a data type string into its corresponding Arithmetic enum value.
 *
 * @param dtype Data type name, e.g., 'float16' | 'float32' | 'uint8'
 *
 * @returns Matching Arithmetic enum value, or Arithmetic.unknown if not recognized
 */
export function getArithmetic(dtype: string): Arithmetic {
  switch (dtype) {
    case 'float16':
      return Arithmetic.float16
    case 'float32':
      return Arithmetic.float32
    case 'float64':
      return Arithmetic.float64
    case 'int8':
      return Arithmetic.int8
    case 'int16':
      return Arithmetic.int16
    case 'int32':
      return Arithmetic.int32
    case 'int64':
      return Arithmetic.int64
    case 'uint8':
      return Arithmetic.uint8
    case 'uint16':
      return Arithmetic.uint16
    case 'uint32':
      return Arithmetic.uint32
    case 'uint64':
      return Arithmetic.uint64
    default:
      return Arithmetic.unknown
  }
}

/**
 * Compute the number of scalar elements represented by a byte size for a given data type.
 *
 * @param sizeInBytes Total size in bytes
 * @param dtype Arithmetic data type determining bytes per element
 *
 * @returns Number of elements contained in the buffer
 * @throws {Error} If the arithmetic type is unknown
 */
export function computeFloatingDataCount(
  sizeInBytes: number,
  dtype: Arithmetic,
): number {
  switch (dtype) {
    case Arithmetic.float16:
      return sizeInBytes / 2
    case Arithmetic.float32:
      return sizeInBytes / 4
    case Arithmetic.float64:
      return sizeInBytes / 8
    case Arithmetic.int8:
      return sizeInBytes
    case Arithmetic.int16:
      return sizeInBytes / 2
    case Arithmetic.int32:
      return sizeInBytes / 4
    case Arithmetic.int64:
      return sizeInBytes / 8
    case Arithmetic.uint8:
      return sizeInBytes
    case Arithmetic.uint16:
      return sizeInBytes / 2
    case Arithmetic.uint32:
      return sizeInBytes / 4
    case Arithmetic.uint64:
      return sizeInBytes / 8
    default:
      throw new Error(`Unknown arithmetic type: ${dtype}`)
  }
}

/**
 * Parse raw binary data into a Float32-based typed array or a reshaped nested array.
 * Supports input data encoded as float16, float32, or float64, converting all outputs to Float32.
 *
 * @param data Raw binary data buffer
 * @param dtype Arithmetic data type of the buffer, default null
 * @param shape Desired output shape; when provided, the flat array is reshaped, default null
 *
 * @returns A Float32Array when shape is not provided, otherwise a nested array matching the given shape
 * @throws {Error} If dtype or shape is null/undefined, or if the dtype is unsupported
 */
export function parseFloatingData(
  data: Uint8Array<ArrayBufferLike>,
  dtype: Arithmetic | null | undefined = null,
  shape: number[] | null | undefined = null,
): unknown {
  if (dtype === null || dtype === undefined) {
    throw new Error('Dtype is null or undefined')
  }

  if (shape === null || shape === undefined) {
    throw new Error('Shape is null or undefined')
  }

  // Convert binary data to typed array based on dtype
  let typedArray: BABYLON.FloatArray
  const alignedBuffer: ArrayBuffer = new ArrayBuffer(data.byteLength)
  let uint16Array: Uint16Array
  let float64Array: Float64Array
  new Uint8Array(alignedBuffer).set(
    new Uint8Array(data.buffer, data.byteOffset, data.byteLength),
  )
  switch (dtype) {
    case Arithmetic.float16:
      uint16Array = new Uint16Array(alignedBuffer)
      // Convert IEEE 754 half-precision to float32
      typedArray = new Float32Array(uint16Array.length)
      for (let i = 0; i < uint16Array.length; i++) {
        const half = uint16Array[i]
        // Extract sign, exponent, and mantissa
        const sign = (half & 0x8000) >> 15
        const exponent = (half & 0x7c00) >> 10
        const mantissa = half & 0x03ff

        // Handle special cases
        if (exponent === 0) {
          // Zero or subnormal
          typedArray[i] = sign ? -0 : 0
        } else if (exponent === 0x1f) {
          // Infinity or NaN
          typedArray[i] = mantissa ? NaN : sign ? -Infinity : Infinity
        } else {
          // Normal number
          const exp = exponent - 15 + 127 // Adjust exponent bias
          const mant = mantissa << 13 // Shift mantissa to float32 position
          const bits = (sign << 31) | (exp << 23) | mant
          typedArray[i] = new Float32Array(new Uint32Array([bits]).buffer)[0]
        }
      }
      break
    case Arithmetic.float32:
      typedArray = new Float32Array(alignedBuffer)
      break
    case Arithmetic.float64:
      float64Array = new Float64Array(alignedBuffer)
      typedArray = new Float32Array(float64Array.length)
      for (let i = 0; i < float64Array.length; i++) {
        typedArray[i] = float64Array[i]
      }
      break
    default:
      throw new Error(`Unsupported dtype: ${dtype}`)
  }
  // Reshape the array according to shape
  if (shape) {
    return reshapeArray(typedArray, shape)
  } else {
    return typedArray
  }
}
