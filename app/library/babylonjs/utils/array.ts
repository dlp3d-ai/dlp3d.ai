import * as BABYLON from '@babylonjs/core'

/**
 * Reshape a flat numeric array into a nested array with the given shape.
 * Supports a single -1 dimension which is inferred from the total number of elements.
 *
 * @param array The flat input array (e.g., Float32Array, number[]) to reshape.
 * @param shape Target shape as an array of integers; at most one dimension may be -1 to infer its size.
 *
 * @returns A nested JavaScript array whose structure matches the target shape.
 *
 * @throws {Error} If more than one dimension is -1.
 * @throws {Error} If the array length does not match the requested shape.
 */
export function reshapeArray(array: BABYLON.FloatArray, shape: number[]): any {
  // Calculate total elements in input array
  const totalElements = array.length

  // Handle -1 dimensions (NumPy style)
  const resolvedShape = [...shape]
  const knownDimensionsProduct = resolvedShape.reduce((product, dim) => {
    if (dim === -1) return product
    return product * dim
  }, 1)

  // Count number of -1 dimensions
  const minusOneCount = resolvedShape.filter(dim => dim === -1).length

  if (minusOneCount > 1) {
    throw new Error('Only one dimension can be -1')
  }

  // Replace -1 with calculated dimension
  if (minusOneCount === 1) {
    const calculatedDim = Math.floor(totalElements / knownDimensionsProduct)
    if (calculatedDim * knownDimensionsProduct !== totalElements) {
      throw new Error(
        'Cannot reshape array of size ' + totalElements + ' into shape ' + shape,
      )
    }
    resolvedShape[resolvedShape.indexOf(-1)] = calculatedDim
  }

  // Pre-calculate strides for each dimension
  const strides = new Array(resolvedShape.length)
  strides[resolvedShape.length - 1] = 1
  for (let i = resolvedShape.length - 2; i >= 0; i--) {
    strides[i] = strides[i + 1] * resolvedShape[i + 1]
  }

  // Helper function to recursively build the array
  function buildArray(dim: number, indices: number[]): any {
    if (dim === resolvedShape.length - 1) {
      // Last dimension - create array of values
      const arr = new Array(resolvedShape[dim])
      for (let i = 0; i < resolvedShape[dim]; i++) {
        // Calculate index in flat array
        let index = i
        for (let j = 0; j < indices.length; j++) {
          index += indices[j] * strides[j]
        }
        arr[i] = array[index]
      }
      return arr
    } else {
      // Create array of next dimension
      const arr = new Array(resolvedShape[dim])
      for (let i = 0; i < resolvedShape[dim]; i++) {
        arr[i] = buildArray(dim + 1, [...indices, i])
      }
      return arr
    }
  }

  return buildArray(0, [])
}

/**
 * Slice a (possibly nested) JavaScript array similarly to NumPy's slicing semantics.
 * Use `null` to take the full range of a dimension, a tuple `[start, end]` to take a half-open range,
 * or a number to index a single element in that dimension.
 *
 * @param array The input nested array to slice.
 * @param dimensions Per-dimension selectors: `null` | `[start, end]` | `index`.
 *
 * @returns The sliced array (structure depends on the selectors applied).
 *
 * Example:
 * const arr = reshapeArray([1,2,3,4,5,6,7,8], [2,2,2])
 * sliceArray(arr, [null, [0,1], null]) // equivalent to arr[:, 0:1, :] in NumPy
 */
export function sliceArray(
  array: any,
  dimensions: (number | [number, number] | null)[],
): any {
  if (!Array.isArray(array)) {
    return array
  }

  // Handle 1D array
  if (dimensions.length === 1) {
    const dim = dimensions[0]
    if (dim === null) return array
    if (Array.isArray(dim)) {
      const [start, end] = dim
      return array.slice(start, end)
    }
    return array[dim]
  }

  // Handle multi-dimensional array
  const dim = dimensions[0]
  if (dim === null) {
    // Take all elements in this dimension
    return array.map((item: any) => sliceArray(item, dimensions.slice(1)))
  } else if (Array.isArray(dim)) {
    // Take a range of elements in this dimension
    const [start, end] = dim
    return array
      .slice(start, end)
      .map((item: any) => sliceArray(item, dimensions.slice(1)))
  } else {
    // Take a single element in this dimension
    return sliceArray(array[dim], dimensions.slice(1))
  }
}

/**
 * Convert an Uint8Array into a new ArrayBuffer instance.
 *
 * @param uint8array The input Uint8Array to convert.
 *
 * @returns A new ArrayBuffer containing a copy of the input bytes.
 */
export function uint8Array2ArrayBuffer(uint8array: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(uint8array.length)
  new Uint8Array(buffer).set(uint8array)
  return buffer
}
