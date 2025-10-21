/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-unused-vars */
import * as $protobuf from 'protobufjs'
import Long = require('long')
/** Namespace orchestrator_v4. */
export namespace orchestrator_v4 {
  /** Properties of an OrchestratorV4Request. */
  interface IOrchestratorV4Request {
    /** OrchestratorV4Request className */
    className?: string | null

    /** OrchestratorV4Request asrAdapter */
    asrAdapter?: string | null

    /** OrchestratorV4Request nChannels */
    nChannels?: number | null

    /** OrchestratorV4Request sampleWidth */
    sampleWidth?: number | null

    /** OrchestratorV4Request frameRate */
    frameRate?: number | null

    /** OrchestratorV4Request classificationAdapter */
    classificationAdapter?: string | null

    /** OrchestratorV4Request conversationAdapter */
    conversationAdapter?: string | null

    /** OrchestratorV4Request agentName */
    agentName?: string | null

    /** OrchestratorV4Request reactionAdapter */
    reactionAdapter?: string | null

    /** OrchestratorV4Request ttsAdapter */
    ttsAdapter?: string | null

    /** OrchestratorV4Request voiceName */
    voiceName?: string | null

    /** OrchestratorV4Request voiceSpeed */
    voiceSpeed?: number | null

    /** OrchestratorV4Request faceModel */
    faceModel?: string | null

    /** OrchestratorV4Request avatar */
    avatar?: string | null

    /** OrchestratorV4Request userId */
    userId?: string | null

    /** OrchestratorV4Request maxFrontExtensionDuration */
    maxFrontExtensionDuration?: number | null

    /** OrchestratorV4Request maxRearExtensionDuration */
    maxRearExtensionDuration?: number | null

    /** OrchestratorV4Request firstBodyFastResponse */
    firstBodyFastResponse?: boolean | null

    /** OrchestratorV4Request speechText */
    speechText?: string | null

    /** OrchestratorV4Request data */
    data?: Uint8Array | null

    /** OrchestratorV4Request appName */
    appName?: string | null

    /** OrchestratorV4Request language */
    language?: string | null

    /** OrchestratorV4Request characterId */
    characterId?: string | null
  }

  /** Represents an OrchestratorV4Request. */
  class OrchestratorV4Request implements IOrchestratorV4Request {
    /**
     * Constructs a new OrchestratorV4Request.
     * @param [properties] Properties to set
     */
    constructor(properties?: orchestrator_v4.IOrchestratorV4Request)

    /** OrchestratorV4Request className. */
    public className: string

    /** OrchestratorV4Request asrAdapter. */
    public asrAdapter: string

    /** OrchestratorV4Request nChannels. */
    public nChannels: number

    /** OrchestratorV4Request sampleWidth. */
    public sampleWidth: number

    /** OrchestratorV4Request frameRate. */
    public frameRate: number

    /** OrchestratorV4Request classificationAdapter. */
    public classificationAdapter: string

    /** OrchestratorV4Request conversationAdapter. */
    public conversationAdapter: string

    /** OrchestratorV4Request agentName. */
    public agentName: string

    /** OrchestratorV4Request reactionAdapter. */
    public reactionAdapter: string

    /** OrchestratorV4Request ttsAdapter. */
    public ttsAdapter: string

    /** OrchestratorV4Request voiceName. */
    public voiceName: string

    /** OrchestratorV4Request voiceSpeed. */
    public voiceSpeed: number

    /** OrchestratorV4Request faceModel. */
    public faceModel: string

    /** OrchestratorV4Request avatar. */
    public avatar: string

    /** OrchestratorV4Request userId. */
    public userId: string

    /** OrchestratorV4Request maxFrontExtensionDuration. */
    public maxFrontExtensionDuration: number

    /** OrchestratorV4Request maxRearExtensionDuration. */
    public maxRearExtensionDuration: number

    /** OrchestratorV4Request firstBodyFastResponse. */
    public firstBodyFastResponse: boolean

    /** OrchestratorV4Request speechText. */
    public speechText: string

    /** OrchestratorV4Request data. */
    public data: Uint8Array

    /** OrchestratorV4Request appName. */
    public appName: string

    /** OrchestratorV4Request language. */
    public language: string

    /** OrchestratorV4Request characterId. */
    public characterId: string

    /**
     * Creates a new OrchestratorV4Request instance using the specified properties.
     * @param [properties] Properties to set
     * @returns OrchestratorV4Request instance
     */
    public static create(
      properties?: orchestrator_v4.IOrchestratorV4Request,
    ): orchestrator_v4.OrchestratorV4Request

    /**
     * Encodes the specified OrchestratorV4Request message. Does not implicitly {@link orchestrator_v4.OrchestratorV4Request.verify|verify} messages.
     * @param message OrchestratorV4Request message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(
      message: orchestrator_v4.IOrchestratorV4Request,
      writer?: $protobuf.Writer,
    ): $protobuf.Writer

    /**
     * Encodes the specified OrchestratorV4Request message, length delimited. Does not implicitly {@link orchestrator_v4.OrchestratorV4Request.verify|verify} messages.
     * @param message OrchestratorV4Request message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(
      message: orchestrator_v4.IOrchestratorV4Request,
      writer?: $protobuf.Writer,
    ): $protobuf.Writer

    /**
     * Decodes an OrchestratorV4Request message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns OrchestratorV4Request
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(
      reader: $protobuf.Reader | Uint8Array,
      length?: number,
    ): orchestrator_v4.OrchestratorV4Request

    /**
     * Decodes an OrchestratorV4Request message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns OrchestratorV4Request
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(
      reader: $protobuf.Reader | Uint8Array,
    ): orchestrator_v4.OrchestratorV4Request

    /**
     * Verifies an OrchestratorV4Request message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): string | null

    /**
     * Creates an OrchestratorV4Request message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns OrchestratorV4Request
     */
    public static fromObject(object: {
      [k: string]: any
    }): orchestrator_v4.OrchestratorV4Request

    /**
     * Creates a plain object from an OrchestratorV4Request message. Also converts values to other types if specified.
     * @param message OrchestratorV4Request
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(
      message: orchestrator_v4.OrchestratorV4Request,
      options?: $protobuf.IConversionOptions,
    ): { [k: string]: any }

    /**
     * Converts this OrchestratorV4Request to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any }

    /**
     * Gets the default type url for OrchestratorV4Request
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string
  }

  /** Properties of an OrchestratorV4Response. */
  interface IOrchestratorV4Response {
    /** OrchestratorV4Response className */
    className?: string | null

    /** OrchestratorV4Response requestId */
    requestId?: string | null

    /** OrchestratorV4Response dtype */
    dtype?: string | null

    /** OrchestratorV4Response message */
    message?: string | null

    /** OrchestratorV4Response motionJointNames */
    motionJointNames?: string[] | null

    /** OrchestratorV4Response motionRestposeName */
    motionRestposeName?: string | null

    /** OrchestratorV4Response motionTimelineStartIdxValue */
    motionTimelineStartIdxValue?: number | null

    /** OrchestratorV4Response motionTimelineStartIdxIsNone */
    motionTimelineStartIdxIsNone?: boolean | null

    /** OrchestratorV4Response faceBlendshapeNames */
    faceBlendshapeNames?: string[] | null

    /** OrchestratorV4Response audioNChannels */
    audioNChannels?: number | null

    /** OrchestratorV4Response audioSampleWidth */
    audioSampleWidth?: number | null

    /** OrchestratorV4Response audioFrameRate */
    audioFrameRate?: number | null

    /** OrchestratorV4Response data */
    data?: Uint8Array | null

    /** OrchestratorV4Response faceTimelineStartIdxValue */
    faceTimelineStartIdxValue?: number | null

    /** OrchestratorV4Response faceTimelineStartIdxIsNone */
    faceTimelineStartIdxIsNone?: boolean | null
  }

  /** Represents an OrchestratorV4Response. */
  class OrchestratorV4Response implements IOrchestratorV4Response {
    /**
     * Constructs a new OrchestratorV4Response.
     * @param [properties] Properties to set
     */
    constructor(properties?: orchestrator_v4.IOrchestratorV4Response)

    /** OrchestratorV4Response className. */
    public className: string

    /** OrchestratorV4Response requestId. */
    public requestId: string

    /** OrchestratorV4Response dtype. */
    public dtype: string

    /** OrchestratorV4Response message. */
    public message: string

    /** OrchestratorV4Response motionJointNames. */
    public motionJointNames: string[]

    /** OrchestratorV4Response motionRestposeName. */
    public motionRestposeName: string

    /** OrchestratorV4Response motionTimelineStartIdxValue. */
    public motionTimelineStartIdxValue?: number | null

    /** OrchestratorV4Response motionTimelineStartIdxIsNone. */
    public motionTimelineStartIdxIsNone?: boolean | null

    /** OrchestratorV4Response faceBlendshapeNames. */
    public faceBlendshapeNames: string[]

    /** OrchestratorV4Response audioNChannels. */
    public audioNChannels: number

    /** OrchestratorV4Response audioSampleWidth. */
    public audioSampleWidth: number

    /** OrchestratorV4Response audioFrameRate. */
    public audioFrameRate: number

    /** OrchestratorV4Response data. */
    public data: Uint8Array

    /** OrchestratorV4Response faceTimelineStartIdxValue. */
    public faceTimelineStartIdxValue?: number | null

    /** OrchestratorV4Response faceTimelineStartIdxIsNone. */
    public faceTimelineStartIdxIsNone?: boolean | null

    /** OrchestratorV4Response motionTimelineStartIdx. */
    public motionTimelineStartIdx?:
      | 'motionTimelineStartIdxValue'
      | 'motionTimelineStartIdxIsNone'

    /** OrchestratorV4Response faceTimelineStartIdx. */
    public faceTimelineStartIdx?:
      | 'faceTimelineStartIdxValue'
      | 'faceTimelineStartIdxIsNone'

    /**
     * Creates a new OrchestratorV4Response instance using the specified properties.
     * @param [properties] Properties to set
     * @returns OrchestratorV4Response instance
     */
    public static create(
      properties?: orchestrator_v4.IOrchestratorV4Response,
    ): orchestrator_v4.OrchestratorV4Response

    /**
     * Encodes the specified OrchestratorV4Response message. Does not implicitly {@link orchestrator_v4.OrchestratorV4Response.verify|verify} messages.
     * @param message OrchestratorV4Response message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(
      message: orchestrator_v4.IOrchestratorV4Response,
      writer?: $protobuf.Writer,
    ): $protobuf.Writer

    /**
     * Encodes the specified OrchestratorV4Response message, length delimited. Does not implicitly {@link orchestrator_v4.OrchestratorV4Response.verify|verify} messages.
     * @param message OrchestratorV4Response message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(
      message: orchestrator_v4.IOrchestratorV4Response,
      writer?: $protobuf.Writer,
    ): $protobuf.Writer

    /**
     * Decodes an OrchestratorV4Response message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns OrchestratorV4Response
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(
      reader: $protobuf.Reader | Uint8Array,
      length?: number,
    ): orchestrator_v4.OrchestratorV4Response

    /**
     * Decodes an OrchestratorV4Response message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns OrchestratorV4Response
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(
      reader: $protobuf.Reader | Uint8Array,
    ): orchestrator_v4.OrchestratorV4Response

    /**
     * Verifies an OrchestratorV4Response message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): string | null

    /**
     * Creates an OrchestratorV4Response message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns OrchestratorV4Response
     */
    public static fromObject(object: {
      [k: string]: any
    }): orchestrator_v4.OrchestratorV4Response

    /**
     * Creates a plain object from an OrchestratorV4Response message. Also converts values to other types if specified.
     * @param message OrchestratorV4Response
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(
      message: orchestrator_v4.OrchestratorV4Response,
      options?: $protobuf.IConversionOptions,
    ): { [k: string]: any }

    /**
     * Converts this OrchestratorV4Response to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any }

    /**
     * Gets the default type url for OrchestratorV4Response
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string
  }
}
