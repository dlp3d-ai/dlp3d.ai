/**
 * Root bone name constant.
 */
const ROOT = 'Root'

/**
 * Left eye bone name constant.
 */
const LEFT_EYE = 'Eye_L'

/**
 * Right eye bone name constant.
 */
const RIGHT_EYE = 'Eye_R'

/**
 * Array of eye bone names.
 */
export const EYE_BONE_NAMES = [LEFT_EYE, RIGHT_EYE]

/**
 * Array of bone names to exclude from certain operations.
 */
export const BONES_TO_EXCLUDE = EYE_BONE_NAMES.concat(ROOT)
