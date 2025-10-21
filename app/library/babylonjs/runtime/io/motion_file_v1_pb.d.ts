/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-unused-vars */
import * as $protobuf from 'protobufjs'
import Long = require('long')
/** Namespace motion_file_v1. */
export namespace motion_file_v1 {
  /** Properties of a MotionFileV1Request. */
  interface IMotionFileV1Request {
    /** MotionFileV1Request className */
    className?: string | null

    /** MotionFileV1Request avatar */
    avatar?: string | null

    /** MotionFileV1Request appName */
    appName?: string | null
  }

  /** Represents a MotionFileV1Request. */
  class MotionFileV1Request implements IMotionFileV1Request {
    /**
     * Constructs a new MotionFileV1Request.
     * @param [properties] Properties to set
     */
    constructor(properties?: motion_file_v1.IMotionFileV1Request)

    /** MotionFileV1Request className. */
    public className: string

    /** MotionFileV1Request avatar. */
    public avatar: string

    /** MotionFileV1Request appName. */
    public appName: string

    /**
     * Creates a new MotionFileV1Request instance using the specified properties.
     * @param [properties] Properties to set
     * @returns MotionFileV1Request instance
     */
    public static create(
      properties?: motion_file_v1.IMotionFileV1Request,
    ): motion_file_v1.MotionFileV1Request

    /**
     * Encodes the specified MotionFileV1Request message. Does not implicitly {@link motion_file_v1.MotionFileV1Request.verify|verify} messages.
     * @param message MotionFileV1Request message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(
      message: motion_file_v1.IMotionFileV1Request,
      writer?: $protobuf.Writer,
    ): $protobuf.Writer

    /**
     * Encodes the specified MotionFileV1Request message, length delimited. Does not implicitly {@link motion_file_v1.MotionFileV1Request.verify|verify} messages.
     * @param message MotionFileV1Request message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(
      message: motion_file_v1.IMotionFileV1Request,
      writer?: $protobuf.Writer,
    ): $protobuf.Writer

    /**
     * Decodes a MotionFileV1Request message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns MotionFileV1Request
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(
      reader: $protobuf.Reader | Uint8Array,
      length?: number,
    ): motion_file_v1.MotionFileV1Request

    /**
     * Decodes a MotionFileV1Request message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns MotionFileV1Request
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(
      reader: $protobuf.Reader | Uint8Array,
    ): motion_file_v1.MotionFileV1Request

    /**
     * Verifies a MotionFileV1Request message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): string | null

    /**
     * Creates a MotionFileV1Request message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns MotionFileV1Request
     */
    public static fromObject(object: {
      [k: string]: any
    }): motion_file_v1.MotionFileV1Request

    /**
     * Creates a plain object from a MotionFileV1Request message. Also converts values to other types if specified.
     * @param message MotionFileV1Request
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(
      message: motion_file_v1.MotionFileV1Request,
      options?: $protobuf.IConversionOptions,
    ): { [k: string]: any }

    /**
     * Converts this MotionFileV1Request to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any }

    /**
     * Gets the default type url for MotionFileV1Request
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string
  }

  /** Properties of a MotionFileV1Response. */
  interface IMotionFileV1Response {
    /** MotionFileV1Response className */
    className?: string | null

    /** MotionFileV1Response version */
    version?: string | null

    /** MotionFileV1Response restposeName */
    restposeName?: string | null

    /** MotionFileV1Response jointNames */
    jointNames?: string[] | null

    /** MotionFileV1Response motionRecordId */
    motionRecordId?: number | null

    /** MotionFileV1Response isIdleLong */
    isIdleLong?: boolean | null

    /** MotionFileV1Response states */
    states?: string[] | null

    /** MotionFileV1Response cutoffFrames */
    cutoffFrames?: motion_file_v1.ICutoffFrame[] | null

    /** MotionFileV1Response cutoffRanges */
    cutoffRanges?: motion_file_v1.ICutoffRange[] | null

    /** MotionFileV1Response jointRotmat */
    jointRotmat?: motion_file_v1.INumpyArray | null

    /** MotionFileV1Response rootWorldPosition */
    rootWorldPosition?: motion_file_v1.INumpyArray | null

    /** MotionFileV1Response loopStartFrame */
    loopStartFrame?: number | null

    /** MotionFileV1Response loopEndFrame */
    loopEndFrame?: number | null

    /** MotionFileV1Response localMatrices */
    localMatrices?: motion_file_v1.INumpyArray | null

    /** MotionFileV1Response matrixWorld */
    matrixWorld?: motion_file_v1.INumpyArray | null

    /** MotionFileV1Response parentIndices */
    parentIndices?: number[] | null

    /** MotionFileV1Response data */
    data?: Uint8Array | null
  }

  /** Represents a MotionFileV1Response. */
  class MotionFileV1Response implements IMotionFileV1Response {
    /**
     * Constructs a new MotionFileV1Response.
     * @param [properties] Properties to set
     */
    constructor(properties?: motion_file_v1.IMotionFileV1Response)

    /** MotionFileV1Response className. */
    public className: string

    /** MotionFileV1Response version. */
    public version: string

    /** MotionFileV1Response restposeName. */
    public restposeName: string

    /** MotionFileV1Response jointNames. */
    public jointNames: string[]

    /** MotionFileV1Response motionRecordId. */
    public motionRecordId: number

    /** MotionFileV1Response isIdleLong. */
    public isIdleLong: boolean

    /** MotionFileV1Response states. */
    public states: string[]

    /** MotionFileV1Response cutoffFrames. */
    public cutoffFrames: motion_file_v1.ICutoffFrame[]

    /** MotionFileV1Response cutoffRanges. */
    public cutoffRanges: motion_file_v1.ICutoffRange[]

    /** MotionFileV1Response jointRotmat. */
    public jointRotmat?: motion_file_v1.INumpyArray | null

    /** MotionFileV1Response rootWorldPosition. */
    public rootWorldPosition?: motion_file_v1.INumpyArray | null

    /** MotionFileV1Response loopStartFrame. */
    public loopStartFrame: number

    /** MotionFileV1Response loopEndFrame. */
    public loopEndFrame: number

    /** MotionFileV1Response localMatrices. */
    public localMatrices?: motion_file_v1.INumpyArray | null

    /** MotionFileV1Response matrixWorld. */
    public matrixWorld?: motion_file_v1.INumpyArray | null

    /** MotionFileV1Response parentIndices. */
    public parentIndices: number[]

    /** MotionFileV1Response data. */
    public data: Uint8Array

    /**
     * Creates a new MotionFileV1Response instance using the specified properties.
     * @param [properties] Properties to set
     * @returns MotionFileV1Response instance
     */
    public static create(
      properties?: motion_file_v1.IMotionFileV1Response,
    ): motion_file_v1.MotionFileV1Response

    /**
     * Encodes the specified MotionFileV1Response message. Does not implicitly {@link motion_file_v1.MotionFileV1Response.verify|verify} messages.
     * @param message MotionFileV1Response message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(
      message: motion_file_v1.IMotionFileV1Response,
      writer?: $protobuf.Writer,
    ): $protobuf.Writer

    /**
     * Encodes the specified MotionFileV1Response message, length delimited. Does not implicitly {@link motion_file_v1.MotionFileV1Response.verify|verify} messages.
     * @param message MotionFileV1Response message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(
      message: motion_file_v1.IMotionFileV1Response,
      writer?: $protobuf.Writer,
    ): $protobuf.Writer

    /**
     * Decodes a MotionFileV1Response message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns MotionFileV1Response
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(
      reader: $protobuf.Reader | Uint8Array,
      length?: number,
    ): motion_file_v1.MotionFileV1Response

    /**
     * Decodes a MotionFileV1Response message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns MotionFileV1Response
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(
      reader: $protobuf.Reader | Uint8Array,
    ): motion_file_v1.MotionFileV1Response

    /**
     * Verifies a MotionFileV1Response message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): string | null

    /**
     * Creates a MotionFileV1Response message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns MotionFileV1Response
     */
    public static fromObject(object: {
      [k: string]: any
    }): motion_file_v1.MotionFileV1Response

    /**
     * Creates a plain object from a MotionFileV1Response message. Also converts values to other types if specified.
     * @param message MotionFileV1Response
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(
      message: motion_file_v1.MotionFileV1Response,
      options?: $protobuf.IConversionOptions,
    ): { [k: string]: any }

    /**
     * Converts this MotionFileV1Response to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any }

    /**
     * Gets the default type url for MotionFileV1Response
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string
  }

  /** Properties of a CutoffFrame. */
  interface ICutoffFrame {
    /** CutoffFrame frameIdx */
    frameIdx?: number | null

    /** CutoffFrame leftPriority */
    leftPriority?: number | null

    /** CutoffFrame rightPriority */
    rightPriority?: number | null
  }

  /** Represents a CutoffFrame. */
  class CutoffFrame implements ICutoffFrame {
    /**
     * Constructs a new CutoffFrame.
     * @param [properties] Properties to set
     */
    constructor(properties?: motion_file_v1.ICutoffFrame)

    /** CutoffFrame frameIdx. */
    public frameIdx: number

    /** CutoffFrame leftPriority. */
    public leftPriority: number

    /** CutoffFrame rightPriority. */
    public rightPriority: number

    /**
     * Creates a new CutoffFrame instance using the specified properties.
     * @param [properties] Properties to set
     * @returns CutoffFrame instance
     */
    public static create(
      properties?: motion_file_v1.ICutoffFrame,
    ): motion_file_v1.CutoffFrame

    /**
     * Encodes the specified CutoffFrame message. Does not implicitly {@link motion_file_v1.CutoffFrame.verify|verify} messages.
     * @param message CutoffFrame message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(
      message: motion_file_v1.ICutoffFrame,
      writer?: $protobuf.Writer,
    ): $protobuf.Writer

    /**
     * Encodes the specified CutoffFrame message, length delimited. Does not implicitly {@link motion_file_v1.CutoffFrame.verify|verify} messages.
     * @param message CutoffFrame message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(
      message: motion_file_v1.ICutoffFrame,
      writer?: $protobuf.Writer,
    ): $protobuf.Writer

    /**
     * Decodes a CutoffFrame message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns CutoffFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(
      reader: $protobuf.Reader | Uint8Array,
      length?: number,
    ): motion_file_v1.CutoffFrame

    /**
     * Decodes a CutoffFrame message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns CutoffFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(
      reader: $protobuf.Reader | Uint8Array,
    ): motion_file_v1.CutoffFrame

    /**
     * Verifies a CutoffFrame message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): string | null

    /**
     * Creates a CutoffFrame message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns CutoffFrame
     */
    public static fromObject(object: {
      [k: string]: any
    }): motion_file_v1.CutoffFrame

    /**
     * Creates a plain object from a CutoffFrame message. Also converts values to other types if specified.
     * @param message CutoffFrame
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(
      message: motion_file_v1.CutoffFrame,
      options?: $protobuf.IConversionOptions,
    ): { [k: string]: any }

    /**
     * Converts this CutoffFrame to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any }

    /**
     * Gets the default type url for CutoffFrame
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string
  }

  /** Properties of a CutoffRange. */
  interface ICutoffRange {
    /** CutoffRange startFrameIdx */
    startFrameIdx?: number | null

    /** CutoffRange endFrameIdx */
    endFrameIdx?: number | null

    /** CutoffRange leftPriority */
    leftPriority?: number | null

    /** CutoffRange rightPriority */
    rightPriority?: number | null
  }

  /** Represents a CutoffRange. */
  class CutoffRange implements ICutoffRange {
    /**
     * Constructs a new CutoffRange.
     * @param [properties] Properties to set
     */
    constructor(properties?: motion_file_v1.ICutoffRange)

    /** CutoffRange startFrameIdx. */
    public startFrameIdx: number

    /** CutoffRange endFrameIdx. */
    public endFrameIdx: number

    /** CutoffRange leftPriority. */
    public leftPriority: number

    /** CutoffRange rightPriority. */
    public rightPriority: number

    /**
     * Creates a new CutoffRange instance using the specified properties.
     * @param [properties] Properties to set
     * @returns CutoffRange instance
     */
    public static create(
      properties?: motion_file_v1.ICutoffRange,
    ): motion_file_v1.CutoffRange

    /**
     * Encodes the specified CutoffRange message. Does not implicitly {@link motion_file_v1.CutoffRange.verify|verify} messages.
     * @param message CutoffRange message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(
      message: motion_file_v1.ICutoffRange,
      writer?: $protobuf.Writer,
    ): $protobuf.Writer

    /**
     * Encodes the specified CutoffRange message, length delimited. Does not implicitly {@link motion_file_v1.CutoffRange.verify|verify} messages.
     * @param message CutoffRange message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(
      message: motion_file_v1.ICutoffRange,
      writer?: $protobuf.Writer,
    ): $protobuf.Writer

    /**
     * Decodes a CutoffRange message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns CutoffRange
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(
      reader: $protobuf.Reader | Uint8Array,
      length?: number,
    ): motion_file_v1.CutoffRange

    /**
     * Decodes a CutoffRange message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns CutoffRange
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(
      reader: $protobuf.Reader | Uint8Array,
    ): motion_file_v1.CutoffRange

    /**
     * Verifies a CutoffRange message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): string | null

    /**
     * Creates a CutoffRange message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns CutoffRange
     */
    public static fromObject(object: {
      [k: string]: any
    }): motion_file_v1.CutoffRange

    /**
     * Creates a plain object from a CutoffRange message. Also converts values to other types if specified.
     * @param message CutoffRange
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(
      message: motion_file_v1.CutoffRange,
      options?: $protobuf.IConversionOptions,
    ): { [k: string]: any }

    /**
     * Converts this CutoffRange to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any }

    /**
     * Gets the default type url for CutoffRange
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string
  }

  /** Properties of a NumpyArray. */
  interface INumpyArray {
    /** NumpyArray dtype */
    dtype?: string | null

    /** NumpyArray shape */
    shape?: number[] | null

    /** NumpyArray data */
    data?: Uint8Array | null
  }

  /** Represents a NumpyArray. */
  class NumpyArray implements INumpyArray {
    /**
     * Constructs a new NumpyArray.
     * @param [properties] Properties to set
     */
    constructor(properties?: motion_file_v1.INumpyArray)

    /** NumpyArray dtype. */
    public dtype: string

    /** NumpyArray shape. */
    public shape: number[]

    /** NumpyArray data. */
    public data: Uint8Array

    /**
     * Creates a new NumpyArray instance using the specified properties.
     * @param [properties] Properties to set
     * @returns NumpyArray instance
     */
    public static create(
      properties?: motion_file_v1.INumpyArray,
    ): motion_file_v1.NumpyArray

    /**
     * Encodes the specified NumpyArray message. Does not implicitly {@link motion_file_v1.NumpyArray.verify|verify} messages.
     * @param message NumpyArray message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(
      message: motion_file_v1.INumpyArray,
      writer?: $protobuf.Writer,
    ): $protobuf.Writer

    /**
     * Encodes the specified NumpyArray message, length delimited. Does not implicitly {@link motion_file_v1.NumpyArray.verify|verify} messages.
     * @param message NumpyArray message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(
      message: motion_file_v1.INumpyArray,
      writer?: $protobuf.Writer,
    ): $protobuf.Writer

    /**
     * Decodes a NumpyArray message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns NumpyArray
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(
      reader: $protobuf.Reader | Uint8Array,
      length?: number,
    ): motion_file_v1.NumpyArray

    /**
     * Decodes a NumpyArray message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns NumpyArray
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(
      reader: $protobuf.Reader | Uint8Array,
    ): motion_file_v1.NumpyArray

    /**
     * Verifies a NumpyArray message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): string | null

    /**
     * Creates a NumpyArray message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns NumpyArray
     */
    public static fromObject(object: { [k: string]: any }): motion_file_v1.NumpyArray

    /**
     * Creates a plain object from a NumpyArray message. Also converts values to other types if specified.
     * @param message NumpyArray
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(
      message: motion_file_v1.NumpyArray,
      options?: $protobuf.IConversionOptions,
    ): { [k: string]: any }

    /**
     * Converts this NumpyArray to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any }

    /**
     * Gets the default type url for NumpyArray
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string
  }
}
