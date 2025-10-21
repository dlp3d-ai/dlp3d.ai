/*eslint-disable no-prototype-builtins*/
import * as $protobuf from 'protobufjs/minimal'

// Common aliases
const $Reader = $protobuf.Reader,
  $Writer = $protobuf.Writer,
  $util = $protobuf.util

// Exported root namespace
const $root = $protobuf.roots['default'] || ($protobuf.roots['default'] = {})

export const orchestrator_v4 = ($root.orchestrator_v4 = (() => {
  /**
   * Namespace orchestrator_v4.
   * @exports orchestrator_v4
   * @namespace
   */
  const orchestrator_v4 = {}

  orchestrator_v4.OrchestratorV4Request = (function () {
    /**
     * Properties of an OrchestratorV4Request.
     * @memberof orchestrator_v4
     * @interface IOrchestratorV4Request
     * @property {string|null} [className] OrchestratorV4Request className
     * @property {string|null} [asrAdapter] OrchestratorV4Request asrAdapter
     * @property {number|null} [nChannels] OrchestratorV4Request nChannels
     * @property {number|null} [sampleWidth] OrchestratorV4Request sampleWidth
     * @property {number|null} [frameRate] OrchestratorV4Request frameRate
     * @property {string|null} [classificationAdapter] OrchestratorV4Request classificationAdapter
     * @property {string|null} [conversationAdapter] OrchestratorV4Request conversationAdapter
     * @property {string|null} [agentName] OrchestratorV4Request agentName
     * @property {string|null} [reactionAdapter] OrchestratorV4Request reactionAdapter
     * @property {string|null} [ttsAdapter] OrchestratorV4Request ttsAdapter
     * @property {string|null} [voiceName] OrchestratorV4Request voiceName
     * @property {number|null} [voiceSpeed] OrchestratorV4Request voiceSpeed
     * @property {string|null} [faceModel] OrchestratorV4Request faceModel
     * @property {string|null} [avatar] OrchestratorV4Request avatar
     * @property {string|null} [userId] OrchestratorV4Request userId
     * @property {number|null} [maxFrontExtensionDuration] OrchestratorV4Request maxFrontExtensionDuration
     * @property {number|null} [maxRearExtensionDuration] OrchestratorV4Request maxRearExtensionDuration
     * @property {boolean|null} [firstBodyFastResponse] OrchestratorV4Request firstBodyFastResponse
     * @property {string|null} [speechText] OrchestratorV4Request speechText
     * @property {Uint8Array|null} [data] OrchestratorV4Request data
     * @property {string|null} [appName] OrchestratorV4Request appName
     * @property {string|null} [language] OrchestratorV4Request language
     * @property {string|null} [characterId] OrchestratorV4Request characterId
     */

    /**
     * Constructs a new OrchestratorV4Request.
     * @memberof orchestrator_v4
     * @classdesc Represents an OrchestratorV4Request.
     * @implements IOrchestratorV4Request
     * @constructor
     * @param {orchestrator_v4.IOrchestratorV4Request=} [properties] Properties to set
     */
    function OrchestratorV4Request(properties) {
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]]
    }

    /**
     * OrchestratorV4Request className.
     * @member {string} className
     * @memberof orchestrator_v4.OrchestratorV4Request
     * @instance
     */
    OrchestratorV4Request.prototype.className = ''

    /**
     * OrchestratorV4Request asrAdapter.
     * @member {string} asrAdapter
     * @memberof orchestrator_v4.OrchestratorV4Request
     * @instance
     */
    OrchestratorV4Request.prototype.asrAdapter = ''

    /**
     * OrchestratorV4Request nChannels.
     * @member {number} nChannels
     * @memberof orchestrator_v4.OrchestratorV4Request
     * @instance
     */
    OrchestratorV4Request.prototype.nChannels = 0

    /**
     * OrchestratorV4Request sampleWidth.
     * @member {number} sampleWidth
     * @memberof orchestrator_v4.OrchestratorV4Request
     * @instance
     */
    OrchestratorV4Request.prototype.sampleWidth = 0

    /**
     * OrchestratorV4Request frameRate.
     * @member {number} frameRate
     * @memberof orchestrator_v4.OrchestratorV4Request
     * @instance
     */
    OrchestratorV4Request.prototype.frameRate = 0

    /**
     * OrchestratorV4Request classificationAdapter.
     * @member {string} classificationAdapter
     * @memberof orchestrator_v4.OrchestratorV4Request
     * @instance
     */
    OrchestratorV4Request.prototype.classificationAdapter = ''

    /**
     * OrchestratorV4Request conversationAdapter.
     * @member {string} conversationAdapter
     * @memberof orchestrator_v4.OrchestratorV4Request
     * @instance
     */
    OrchestratorV4Request.prototype.conversationAdapter = ''

    /**
     * OrchestratorV4Request agentName.
     * @member {string} agentName
     * @memberof orchestrator_v4.OrchestratorV4Request
     * @instance
     */
    OrchestratorV4Request.prototype.agentName = ''

    /**
     * OrchestratorV4Request reactionAdapter.
     * @member {string} reactionAdapter
     * @memberof orchestrator_v4.OrchestratorV4Request
     * @instance
     */
    OrchestratorV4Request.prototype.reactionAdapter = ''

    /**
     * OrchestratorV4Request ttsAdapter.
     * @member {string} ttsAdapter
     * @memberof orchestrator_v4.OrchestratorV4Request
     * @instance
     */
    OrchestratorV4Request.prototype.ttsAdapter = ''

    /**
     * OrchestratorV4Request voiceName.
     * @member {string} voiceName
     * @memberof orchestrator_v4.OrchestratorV4Request
     * @instance
     */
    OrchestratorV4Request.prototype.voiceName = ''

    /**
     * OrchestratorV4Request voiceSpeed.
     * @member {number} voiceSpeed
     * @memberof orchestrator_v4.OrchestratorV4Request
     * @instance
     */
    OrchestratorV4Request.prototype.voiceSpeed = 0

    /**
     * OrchestratorV4Request faceModel.
     * @member {string} faceModel
     * @memberof orchestrator_v4.OrchestratorV4Request
     * @instance
     */
    OrchestratorV4Request.prototype.faceModel = ''

    /**
     * OrchestratorV4Request avatar.
     * @member {string} avatar
     * @memberof orchestrator_v4.OrchestratorV4Request
     * @instance
     */
    OrchestratorV4Request.prototype.avatar = ''

    /**
     * OrchestratorV4Request userId.
     * @member {string} userId
     * @memberof orchestrator_v4.OrchestratorV4Request
     * @instance
     */
    OrchestratorV4Request.prototype.userId = ''

    /**
     * OrchestratorV4Request maxFrontExtensionDuration.
     * @member {number} maxFrontExtensionDuration
     * @memberof orchestrator_v4.OrchestratorV4Request
     * @instance
     */
    OrchestratorV4Request.prototype.maxFrontExtensionDuration = 0

    /**
     * OrchestratorV4Request maxRearExtensionDuration.
     * @member {number} maxRearExtensionDuration
     * @memberof orchestrator_v4.OrchestratorV4Request
     * @instance
     */
    OrchestratorV4Request.prototype.maxRearExtensionDuration = 0

    /**
     * OrchestratorV4Request firstBodyFastResponse.
     * @member {boolean} firstBodyFastResponse
     * @memberof orchestrator_v4.OrchestratorV4Request
     * @instance
     */
    OrchestratorV4Request.prototype.firstBodyFastResponse = false

    /**
     * OrchestratorV4Request speechText.
     * @member {string} speechText
     * @memberof orchestrator_v4.OrchestratorV4Request
     * @instance
     */
    OrchestratorV4Request.prototype.speechText = ''

    /**
     * OrchestratorV4Request data.
     * @member {Uint8Array} data
     * @memberof orchestrator_v4.OrchestratorV4Request
     * @instance
     */
    OrchestratorV4Request.prototype.data = $util.newBuffer([])

    /**
     * OrchestratorV4Request appName.
     * @member {string} appName
     * @memberof orchestrator_v4.OrchestratorV4Request
     * @instance
     */
    OrchestratorV4Request.prototype.appName = ''

    /**
     * OrchestratorV4Request language.
     * @member {string} language
     * @memberof orchestrator_v4.OrchestratorV4Request
     * @instance
     */
    OrchestratorV4Request.prototype.language = ''

    /**
     * OrchestratorV4Request characterId.
     * @member {string} characterId
     * @memberof orchestrator_v4.OrchestratorV4Request
     * @instance
     */
    OrchestratorV4Request.prototype.characterId = ''

    /**
     * Creates a new OrchestratorV4Request instance using the specified properties.
     * @function create
     * @memberof orchestrator_v4.OrchestratorV4Request
     * @static
     * @param {orchestrator_v4.IOrchestratorV4Request=} [properties] Properties to set
     * @returns {orchestrator_v4.OrchestratorV4Request} OrchestratorV4Request instance
     */
    OrchestratorV4Request.create = function create(properties) {
      return new OrchestratorV4Request(properties)
    }

    /**
     * Encodes the specified OrchestratorV4Request message. Does not implicitly {@link orchestrator_v4.OrchestratorV4Request.verify|verify} messages.
     * @function encode
     * @memberof orchestrator_v4.OrchestratorV4Request
     * @static
     * @param {orchestrator_v4.IOrchestratorV4Request} message OrchestratorV4Request message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    OrchestratorV4Request.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create()
      if (
        message.className != null &&
        Object.hasOwnProperty.call(message, 'className')
      )
        writer.uint32(/* id 1, wireType 2 =*/ 10).string(message.className)
      if (
        message.asrAdapter != null &&
        Object.hasOwnProperty.call(message, 'asrAdapter')
      )
        writer.uint32(/* id 2, wireType 2 =*/ 18).string(message.asrAdapter)
      if (
        message.nChannels != null &&
        Object.hasOwnProperty.call(message, 'nChannels')
      )
        writer.uint32(/* id 3, wireType 0 =*/ 24).int32(message.nChannels)
      if (
        message.sampleWidth != null &&
        Object.hasOwnProperty.call(message, 'sampleWidth')
      )
        writer.uint32(/* id 4, wireType 0 =*/ 32).int32(message.sampleWidth)
      if (
        message.frameRate != null &&
        Object.hasOwnProperty.call(message, 'frameRate')
      )
        writer.uint32(/* id 5, wireType 0 =*/ 40).int32(message.frameRate)
      if (
        message.classificationAdapter != null &&
        Object.hasOwnProperty.call(message, 'classificationAdapter')
      )
        writer
          .uint32(/* id 6, wireType 2 =*/ 50)
          .string(message.classificationAdapter)
      if (
        message.conversationAdapter != null &&
        Object.hasOwnProperty.call(message, 'conversationAdapter')
      )
        writer.uint32(/* id 7, wireType 2 =*/ 58).string(message.conversationAdapter)
      if (
        message.agentName != null &&
        Object.hasOwnProperty.call(message, 'agentName')
      )
        writer.uint32(/* id 8, wireType 2 =*/ 66).string(message.agentName)
      if (
        message.reactionAdapter != null &&
        Object.hasOwnProperty.call(message, 'reactionAdapter')
      )
        writer.uint32(/* id 9, wireType 2 =*/ 74).string(message.reactionAdapter)
      if (
        message.ttsAdapter != null &&
        Object.hasOwnProperty.call(message, 'ttsAdapter')
      )
        writer.uint32(/* id 10, wireType 2 =*/ 82).string(message.ttsAdapter)
      if (
        message.voiceName != null &&
        Object.hasOwnProperty.call(message, 'voiceName')
      )
        writer.uint32(/* id 11, wireType 2 =*/ 90).string(message.voiceName)
      if (
        message.voiceSpeed != null &&
        Object.hasOwnProperty.call(message, 'voiceSpeed')
      )
        writer.uint32(/* id 12, wireType 5 =*/ 101).float(message.voiceSpeed)
      if (
        message.faceModel != null &&
        Object.hasOwnProperty.call(message, 'faceModel')
      )
        writer.uint32(/* id 13, wireType 2 =*/ 106).string(message.faceModel)
      if (message.avatar != null && Object.hasOwnProperty.call(message, 'avatar'))
        writer.uint32(/* id 14, wireType 2 =*/ 114).string(message.avatar)
      if (message.userId != null && Object.hasOwnProperty.call(message, 'userId'))
        writer.uint32(/* id 15, wireType 2 =*/ 122).string(message.userId)
      if (
        message.maxFrontExtensionDuration != null &&
        Object.hasOwnProperty.call(message, 'maxFrontExtensionDuration')
      )
        writer
          .uint32(/* id 16, wireType 5 =*/ 133)
          .float(message.maxFrontExtensionDuration)
      if (
        message.maxRearExtensionDuration != null &&
        Object.hasOwnProperty.call(message, 'maxRearExtensionDuration')
      )
        writer
          .uint32(/* id 17, wireType 5 =*/ 141)
          .float(message.maxRearExtensionDuration)
      if (
        message.firstBodyFastResponse != null &&
        Object.hasOwnProperty.call(message, 'firstBodyFastResponse')
      )
        writer
          .uint32(/* id 18, wireType 0 =*/ 144)
          .bool(message.firstBodyFastResponse)
      if (
        message.speechText != null &&
        Object.hasOwnProperty.call(message, 'speechText')
      )
        writer.uint32(/* id 19, wireType 2 =*/ 154).string(message.speechText)
      if (message.data != null && Object.hasOwnProperty.call(message, 'data'))
        writer.uint32(/* id 20, wireType 2 =*/ 162).bytes(message.data)
      if (message.appName != null && Object.hasOwnProperty.call(message, 'appName'))
        writer.uint32(/* id 21, wireType 2 =*/ 170).string(message.appName)
      if (
        message.language != null &&
        Object.hasOwnProperty.call(message, 'language')
      )
        writer.uint32(/* id 22, wireType 2 =*/ 178).string(message.language)
      if (
        message.characterId != null &&
        Object.hasOwnProperty.call(message, 'characterId')
      )
        writer.uint32(/* id 23, wireType 2 =*/ 186).string(message.characterId)
      return writer
    }

    /**
     * Encodes the specified OrchestratorV4Request message, length delimited. Does not implicitly {@link orchestrator_v4.OrchestratorV4Request.verify|verify} messages.
     * @function encodeDelimited
     * @memberof orchestrator_v4.OrchestratorV4Request
     * @static
     * @param {orchestrator_v4.IOrchestratorV4Request} message OrchestratorV4Request message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    OrchestratorV4Request.encodeDelimited = function encodeDelimited(
      message,
      writer,
    ) {
      return this.encode(message, writer).ldelim()
    }

    /**
     * Decodes an OrchestratorV4Request message from the specified reader or buffer.
     * @function decode
     * @memberof orchestrator_v4.OrchestratorV4Request
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {orchestrator_v4.OrchestratorV4Request} OrchestratorV4Request
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    OrchestratorV4Request.decode = function decode(reader, length, error) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader)
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.orchestrator_v4.OrchestratorV4Request()
      while (reader.pos < end) {
        let tag = reader.uint32()
        if (tag === error) break
        switch (tag >>> 3) {
          case 1: {
            message.className = reader.string()
            break
          }
          case 2: {
            message.asrAdapter = reader.string()
            break
          }
          case 3: {
            message.nChannels = reader.int32()
            break
          }
          case 4: {
            message.sampleWidth = reader.int32()
            break
          }
          case 5: {
            message.frameRate = reader.int32()
            break
          }
          case 6: {
            message.classificationAdapter = reader.string()
            break
          }
          case 7: {
            message.conversationAdapter = reader.string()
            break
          }
          case 8: {
            message.agentName = reader.string()
            break
          }
          case 9: {
            message.reactionAdapter = reader.string()
            break
          }
          case 10: {
            message.ttsAdapter = reader.string()
            break
          }
          case 11: {
            message.voiceName = reader.string()
            break
          }
          case 12: {
            message.voiceSpeed = reader.float()
            break
          }
          case 13: {
            message.faceModel = reader.string()
            break
          }
          case 14: {
            message.avatar = reader.string()
            break
          }
          case 15: {
            message.userId = reader.string()
            break
          }
          case 16: {
            message.maxFrontExtensionDuration = reader.float()
            break
          }
          case 17: {
            message.maxRearExtensionDuration = reader.float()
            break
          }
          case 18: {
            message.firstBodyFastResponse = reader.bool()
            break
          }
          case 19: {
            message.speechText = reader.string()
            break
          }
          case 20: {
            message.data = reader.bytes()
            break
          }
          case 21: {
            message.appName = reader.string()
            break
          }
          case 22: {
            message.language = reader.string()
            break
          }
          case 23: {
            message.characterId = reader.string()
            break
          }
          default:
            reader.skipType(tag & 7)
            break
        }
      }
      return message
    }

    /**
     * Decodes an OrchestratorV4Request message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof orchestrator_v4.OrchestratorV4Request
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {orchestrator_v4.OrchestratorV4Request} OrchestratorV4Request
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    OrchestratorV4Request.decodeDelimited = function decodeDelimited(reader) {
      if (!(reader instanceof $Reader)) reader = new $Reader(reader)
      return this.decode(reader, reader.uint32())
    }

    /**
     * Verifies an OrchestratorV4Request message.
     * @function verify
     * @memberof orchestrator_v4.OrchestratorV4Request
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    OrchestratorV4Request.verify = function verify(message) {
      if (typeof message !== 'object' || message === null) return 'object expected'
      if (message.className != null && message.hasOwnProperty('className'))
        if (!$util.isString(message.className)) return 'className: string expected'
      if (message.asrAdapter != null && message.hasOwnProperty('asrAdapter'))
        if (!$util.isString(message.asrAdapter)) return 'asrAdapter: string expected'
      if (message.nChannels != null && message.hasOwnProperty('nChannels'))
        if (!$util.isInteger(message.nChannels)) return 'nChannels: integer expected'
      if (message.sampleWidth != null && message.hasOwnProperty('sampleWidth'))
        if (!$util.isInteger(message.sampleWidth))
          return 'sampleWidth: integer expected'
      if (message.frameRate != null && message.hasOwnProperty('frameRate'))
        if (!$util.isInteger(message.frameRate)) return 'frameRate: integer expected'
      if (
        message.classificationAdapter != null &&
        message.hasOwnProperty('classificationAdapter')
      )
        if (!$util.isString(message.classificationAdapter))
          return 'classificationAdapter: string expected'
      if (
        message.conversationAdapter != null &&
        message.hasOwnProperty('conversationAdapter')
      )
        if (!$util.isString(message.conversationAdapter))
          return 'conversationAdapter: string expected'
      if (message.agentName != null && message.hasOwnProperty('agentName'))
        if (!$util.isString(message.agentName)) return 'agentName: string expected'
      if (
        message.reactionAdapter != null &&
        message.hasOwnProperty('reactionAdapter')
      )
        if (!$util.isString(message.reactionAdapter))
          return 'reactionAdapter: string expected'
      if (message.ttsAdapter != null && message.hasOwnProperty('ttsAdapter'))
        if (!$util.isString(message.ttsAdapter)) return 'ttsAdapter: string expected'
      if (message.voiceName != null && message.hasOwnProperty('voiceName'))
        if (!$util.isString(message.voiceName)) return 'voiceName: string expected'
      if (message.voiceSpeed != null && message.hasOwnProperty('voiceSpeed'))
        if (typeof message.voiceSpeed !== 'number')
          return 'voiceSpeed: number expected'
      if (message.faceModel != null && message.hasOwnProperty('faceModel'))
        if (!$util.isString(message.faceModel)) return 'faceModel: string expected'
      if (message.avatar != null && message.hasOwnProperty('avatar'))
        if (!$util.isString(message.avatar)) return 'avatar: string expected'
      if (message.userId != null && message.hasOwnProperty('userId'))
        if (!$util.isString(message.userId)) return 'userId: string expected'
      if (
        message.maxFrontExtensionDuration != null &&
        message.hasOwnProperty('maxFrontExtensionDuration')
      )
        if (typeof message.maxFrontExtensionDuration !== 'number')
          return 'maxFrontExtensionDuration: number expected'
      if (
        message.maxRearExtensionDuration != null &&
        message.hasOwnProperty('maxRearExtensionDuration')
      )
        if (typeof message.maxRearExtensionDuration !== 'number')
          return 'maxRearExtensionDuration: number expected'
      if (
        message.firstBodyFastResponse != null &&
        message.hasOwnProperty('firstBodyFastResponse')
      )
        if (typeof message.firstBodyFastResponse !== 'boolean')
          return 'firstBodyFastResponse: boolean expected'
      if (message.speechText != null && message.hasOwnProperty('speechText'))
        if (!$util.isString(message.speechText)) return 'speechText: string expected'
      if (message.data != null && message.hasOwnProperty('data'))
        if (
          !(
            (message.data && typeof message.data.length === 'number') ||
            $util.isString(message.data)
          )
        )
          return 'data: buffer expected'
      if (message.appName != null && message.hasOwnProperty('appName'))
        if (!$util.isString(message.appName)) return 'appName: string expected'
      if (message.language != null && message.hasOwnProperty('language'))
        if (!$util.isString(message.language)) return 'language: string expected'
      if (message.characterId != null && message.hasOwnProperty('characterId'))
        if (!$util.isString(message.characterId))
          return 'characterId: string expected'
      return null
    }

    /**
     * Creates an OrchestratorV4Request message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof orchestrator_v4.OrchestratorV4Request
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {orchestrator_v4.OrchestratorV4Request} OrchestratorV4Request
     */
    OrchestratorV4Request.fromObject = function fromObject(object) {
      if (object instanceof $root.orchestrator_v4.OrchestratorV4Request)
        return object
      let message = new $root.orchestrator_v4.OrchestratorV4Request()
      if (object.className != null) message.className = String(object.className)
      if (object.asrAdapter != null) message.asrAdapter = String(object.asrAdapter)
      if (object.nChannels != null) message.nChannels = object.nChannels | 0
      if (object.sampleWidth != null) message.sampleWidth = object.sampleWidth | 0
      if (object.frameRate != null) message.frameRate = object.frameRate | 0
      if (object.classificationAdapter != null)
        message.classificationAdapter = String(object.classificationAdapter)
      if (object.conversationAdapter != null)
        message.conversationAdapter = String(object.conversationAdapter)
      if (object.agentName != null) message.agentName = String(object.agentName)
      if (object.reactionAdapter != null)
        message.reactionAdapter = String(object.reactionAdapter)
      if (object.ttsAdapter != null) message.ttsAdapter = String(object.ttsAdapter)
      if (object.voiceName != null) message.voiceName = String(object.voiceName)
      if (object.voiceSpeed != null) message.voiceSpeed = Number(object.voiceSpeed)
      if (object.faceModel != null) message.faceModel = String(object.faceModel)
      if (object.avatar != null) message.avatar = String(object.avatar)
      if (object.userId != null) message.userId = String(object.userId)
      if (object.maxFrontExtensionDuration != null)
        message.maxFrontExtensionDuration = Number(object.maxFrontExtensionDuration)
      if (object.maxRearExtensionDuration != null)
        message.maxRearExtensionDuration = Number(object.maxRearExtensionDuration)
      if (object.firstBodyFastResponse != null)
        message.firstBodyFastResponse = Boolean(object.firstBodyFastResponse)
      if (object.speechText != null) message.speechText = String(object.speechText)
      if (object.data != null)
        if (typeof object.data === 'string')
          $util.base64.decode(
            object.data,
            (message.data = $util.newBuffer($util.base64.length(object.data))),
            0,
          )
        else if (object.data.length >= 0) message.data = object.data
      if (object.appName != null) message.appName = String(object.appName)
      if (object.language != null) message.language = String(object.language)
      if (object.characterId != null)
        message.characterId = String(object.characterId)
      return message
    }

    /**
     * Creates a plain object from an OrchestratorV4Request message. Also converts values to other types if specified.
     * @function toObject
     * @memberof orchestrator_v4.OrchestratorV4Request
     * @static
     * @param {orchestrator_v4.OrchestratorV4Request} message OrchestratorV4Request
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    OrchestratorV4Request.toObject = function toObject(message, options) {
      if (!options) options = {}
      let object = {}
      if (options.defaults) {
        object.className = ''
        object.asrAdapter = ''
        object.nChannels = 0
        object.sampleWidth = 0
        object.frameRate = 0
        object.classificationAdapter = ''
        object.conversationAdapter = ''
        object.agentName = ''
        object.reactionAdapter = ''
        object.ttsAdapter = ''
        object.voiceName = ''
        object.voiceSpeed = 0
        object.faceModel = ''
        object.avatar = ''
        object.userId = ''
        object.maxFrontExtensionDuration = 0
        object.maxRearExtensionDuration = 0
        object.firstBodyFastResponse = false
        object.speechText = ''
        if (options.bytes === String) object.data = ''
        else {
          object.data = []
          if (options.bytes !== Array) object.data = $util.newBuffer(object.data)
        }
        object.appName = ''
        object.language = ''
        object.characterId = ''
      }
      if (message.className != null && message.hasOwnProperty('className'))
        object.className = message.className
      if (message.asrAdapter != null && message.hasOwnProperty('asrAdapter'))
        object.asrAdapter = message.asrAdapter
      if (message.nChannels != null && message.hasOwnProperty('nChannels'))
        object.nChannels = message.nChannels
      if (message.sampleWidth != null && message.hasOwnProperty('sampleWidth'))
        object.sampleWidth = message.sampleWidth
      if (message.frameRate != null && message.hasOwnProperty('frameRate'))
        object.frameRate = message.frameRate
      if (
        message.classificationAdapter != null &&
        message.hasOwnProperty('classificationAdapter')
      )
        object.classificationAdapter = message.classificationAdapter
      if (
        message.conversationAdapter != null &&
        message.hasOwnProperty('conversationAdapter')
      )
        object.conversationAdapter = message.conversationAdapter
      if (message.agentName != null && message.hasOwnProperty('agentName'))
        object.agentName = message.agentName
      if (
        message.reactionAdapter != null &&
        message.hasOwnProperty('reactionAdapter')
      )
        object.reactionAdapter = message.reactionAdapter
      if (message.ttsAdapter != null && message.hasOwnProperty('ttsAdapter'))
        object.ttsAdapter = message.ttsAdapter
      if (message.voiceName != null && message.hasOwnProperty('voiceName'))
        object.voiceName = message.voiceName
      if (message.voiceSpeed != null && message.hasOwnProperty('voiceSpeed'))
        object.voiceSpeed =
          options.json && !isFinite(message.voiceSpeed)
            ? String(message.voiceSpeed)
            : message.voiceSpeed
      if (message.faceModel != null && message.hasOwnProperty('faceModel'))
        object.faceModel = message.faceModel
      if (message.avatar != null && message.hasOwnProperty('avatar'))
        object.avatar = message.avatar
      if (message.userId != null && message.hasOwnProperty('userId'))
        object.userId = message.userId
      if (
        message.maxFrontExtensionDuration != null &&
        message.hasOwnProperty('maxFrontExtensionDuration')
      )
        object.maxFrontExtensionDuration =
          options.json && !isFinite(message.maxFrontExtensionDuration)
            ? String(message.maxFrontExtensionDuration)
            : message.maxFrontExtensionDuration
      if (
        message.maxRearExtensionDuration != null &&
        message.hasOwnProperty('maxRearExtensionDuration')
      )
        object.maxRearExtensionDuration =
          options.json && !isFinite(message.maxRearExtensionDuration)
            ? String(message.maxRearExtensionDuration)
            : message.maxRearExtensionDuration
      if (
        message.firstBodyFastResponse != null &&
        message.hasOwnProperty('firstBodyFastResponse')
      )
        object.firstBodyFastResponse = message.firstBodyFastResponse
      if (message.speechText != null && message.hasOwnProperty('speechText'))
        object.speechText = message.speechText
      if (message.data != null && message.hasOwnProperty('data'))
        object.data =
          options.bytes === String
            ? $util.base64.encode(message.data, 0, message.data.length)
            : options.bytes === Array
              ? Array.prototype.slice.call(message.data)
              : message.data
      if (message.appName != null && message.hasOwnProperty('appName'))
        object.appName = message.appName
      if (message.language != null && message.hasOwnProperty('language'))
        object.language = message.language
      if (message.characterId != null && message.hasOwnProperty('characterId'))
        object.characterId = message.characterId
      return object
    }

    /**
     * Converts this OrchestratorV4Request to JSON.
     * @function toJSON
     * @memberof orchestrator_v4.OrchestratorV4Request
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    OrchestratorV4Request.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions)
    }

    /**
     * Gets the default type url for OrchestratorV4Request
     * @function getTypeUrl
     * @memberof orchestrator_v4.OrchestratorV4Request
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    OrchestratorV4Request.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = 'type.googleapis.com'
      }
      return typeUrlPrefix + '/orchestrator_v4.OrchestratorV4Request'
    }

    return OrchestratorV4Request
  })()

  orchestrator_v4.OrchestratorV4Response = (function () {
    /**
     * Properties of an OrchestratorV4Response.
     * @memberof orchestrator_v4
     * @interface IOrchestratorV4Response
     * @property {string|null} [className] OrchestratorV4Response className
     * @property {string|null} [requestId] OrchestratorV4Response requestId
     * @property {string|null} [dtype] OrchestratorV4Response dtype
     * @property {string|null} [message] OrchestratorV4Response message
     * @property {Array.<string>|null} [motionJointNames] OrchestratorV4Response motionJointNames
     * @property {string|null} [motionRestposeName] OrchestratorV4Response motionRestposeName
     * @property {number|null} [motionTimelineStartIdxValue] OrchestratorV4Response motionTimelineStartIdxValue
     * @property {boolean|null} [motionTimelineStartIdxIsNone] OrchestratorV4Response motionTimelineStartIdxIsNone
     * @property {Array.<string>|null} [faceBlendshapeNames] OrchestratorV4Response faceBlendshapeNames
     * @property {number|null} [audioNChannels] OrchestratorV4Response audioNChannels
     * @property {number|null} [audioSampleWidth] OrchestratorV4Response audioSampleWidth
     * @property {number|null} [audioFrameRate] OrchestratorV4Response audioFrameRate
     * @property {Uint8Array|null} [data] OrchestratorV4Response data
     * @property {number|null} [faceTimelineStartIdxValue] OrchestratorV4Response faceTimelineStartIdxValue
     * @property {boolean|null} [faceTimelineStartIdxIsNone] OrchestratorV4Response faceTimelineStartIdxIsNone
     */

    /**
     * Constructs a new OrchestratorV4Response.
     * @memberof orchestrator_v4
     * @classdesc Represents an OrchestratorV4Response.
     * @implements IOrchestratorV4Response
     * @constructor
     * @param {orchestrator_v4.IOrchestratorV4Response=} [properties] Properties to set
     */
    function OrchestratorV4Response(properties) {
      this.motionJointNames = []
      this.faceBlendshapeNames = []
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]]
    }

    /**
     * OrchestratorV4Response className.
     * @member {string} className
     * @memberof orchestrator_v4.OrchestratorV4Response
     * @instance
     */
    OrchestratorV4Response.prototype.className = ''

    /**
     * OrchestratorV4Response requestId.
     * @member {string} requestId
     * @memberof orchestrator_v4.OrchestratorV4Response
     * @instance
     */
    OrchestratorV4Response.prototype.requestId = ''

    /**
     * OrchestratorV4Response dtype.
     * @member {string} dtype
     * @memberof orchestrator_v4.OrchestratorV4Response
     * @instance
     */
    OrchestratorV4Response.prototype.dtype = ''

    /**
     * OrchestratorV4Response message.
     * @member {string} message
     * @memberof orchestrator_v4.OrchestratorV4Response
     * @instance
     */
    OrchestratorV4Response.prototype.message = ''

    /**
     * OrchestratorV4Response motionJointNames.
     * @member {Array.<string>} motionJointNames
     * @memberof orchestrator_v4.OrchestratorV4Response
     * @instance
     */
    OrchestratorV4Response.prototype.motionJointNames = $util.emptyArray

    /**
     * OrchestratorV4Response motionRestposeName.
     * @member {string} motionRestposeName
     * @memberof orchestrator_v4.OrchestratorV4Response
     * @instance
     */
    OrchestratorV4Response.prototype.motionRestposeName = ''

    /**
     * OrchestratorV4Response motionTimelineStartIdxValue.
     * @member {number|null|undefined} motionTimelineStartIdxValue
     * @memberof orchestrator_v4.OrchestratorV4Response
     * @instance
     */
    OrchestratorV4Response.prototype.motionTimelineStartIdxValue = null

    /**
     * OrchestratorV4Response motionTimelineStartIdxIsNone.
     * @member {boolean|null|undefined} motionTimelineStartIdxIsNone
     * @memberof orchestrator_v4.OrchestratorV4Response
     * @instance
     */
    OrchestratorV4Response.prototype.motionTimelineStartIdxIsNone = null

    /**
     * OrchestratorV4Response faceBlendshapeNames.
     * @member {Array.<string>} faceBlendshapeNames
     * @memberof orchestrator_v4.OrchestratorV4Response
     * @instance
     */
    OrchestratorV4Response.prototype.faceBlendshapeNames = $util.emptyArray

    /**
     * OrchestratorV4Response audioNChannels.
     * @member {number} audioNChannels
     * @memberof orchestrator_v4.OrchestratorV4Response
     * @instance
     */
    OrchestratorV4Response.prototype.audioNChannels = 0

    /**
     * OrchestratorV4Response audioSampleWidth.
     * @member {number} audioSampleWidth
     * @memberof orchestrator_v4.OrchestratorV4Response
     * @instance
     */
    OrchestratorV4Response.prototype.audioSampleWidth = 0

    /**
     * OrchestratorV4Response audioFrameRate.
     * @member {number} audioFrameRate
     * @memberof orchestrator_v4.OrchestratorV4Response
     * @instance
     */
    OrchestratorV4Response.prototype.audioFrameRate = 0

    /**
     * OrchestratorV4Response data.
     * @member {Uint8Array} data
     * @memberof orchestrator_v4.OrchestratorV4Response
     * @instance
     */
    OrchestratorV4Response.prototype.data = $util.newBuffer([])

    /**
     * OrchestratorV4Response faceTimelineStartIdxValue.
     * @member {number|null|undefined} faceTimelineStartIdxValue
     * @memberof orchestrator_v4.OrchestratorV4Response
     * @instance
     */
    OrchestratorV4Response.prototype.faceTimelineStartIdxValue = null

    /**
     * OrchestratorV4Response faceTimelineStartIdxIsNone.
     * @member {boolean|null|undefined} faceTimelineStartIdxIsNone
     * @memberof orchestrator_v4.OrchestratorV4Response
     * @instance
     */
    OrchestratorV4Response.prototype.faceTimelineStartIdxIsNone = null

    // OneOf field names bound to virtual getters and setters
    let $oneOfFields

    /**
     * OrchestratorV4Response motionTimelineStartIdx.
     * @member {"motionTimelineStartIdxValue"|"motionTimelineStartIdxIsNone"|undefined} motionTimelineStartIdx
     * @memberof orchestrator_v4.OrchestratorV4Response
     * @instance
     */
    Object.defineProperty(
      OrchestratorV4Response.prototype,
      'motionTimelineStartIdx',
      {
        get: $util.oneOfGetter(
          ($oneOfFields = [
            'motionTimelineStartIdxValue',
            'motionTimelineStartIdxIsNone',
          ]),
        ),
        set: $util.oneOfSetter($oneOfFields),
      },
    )

    /**
     * OrchestratorV4Response faceTimelineStartIdx.
     * @member {"faceTimelineStartIdxValue"|"faceTimelineStartIdxIsNone"|undefined} faceTimelineStartIdx
     * @memberof orchestrator_v4.OrchestratorV4Response
     * @instance
     */
    Object.defineProperty(OrchestratorV4Response.prototype, 'faceTimelineStartIdx', {
      get: $util.oneOfGetter(
        ($oneOfFields = ['faceTimelineStartIdxValue', 'faceTimelineStartIdxIsNone']),
      ),
      set: $util.oneOfSetter($oneOfFields),
    })

    /**
     * Creates a new OrchestratorV4Response instance using the specified properties.
     * @function create
     * @memberof orchestrator_v4.OrchestratorV4Response
     * @static
     * @param {orchestrator_v4.IOrchestratorV4Response=} [properties] Properties to set
     * @returns {orchestrator_v4.OrchestratorV4Response} OrchestratorV4Response instance
     */
    OrchestratorV4Response.create = function create(properties) {
      return new OrchestratorV4Response(properties)
    }

    /**
     * Encodes the specified OrchestratorV4Response message. Does not implicitly {@link orchestrator_v4.OrchestratorV4Response.verify|verify} messages.
     * @function encode
     * @memberof orchestrator_v4.OrchestratorV4Response
     * @static
     * @param {orchestrator_v4.IOrchestratorV4Response} message OrchestratorV4Response message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    OrchestratorV4Response.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create()
      if (
        message.className != null &&
        Object.hasOwnProperty.call(message, 'className')
      )
        writer.uint32(/* id 1, wireType 2 =*/ 10).string(message.className)
      if (
        message.requestId != null &&
        Object.hasOwnProperty.call(message, 'requestId')
      )
        writer.uint32(/* id 2, wireType 2 =*/ 18).string(message.requestId)
      if (message.dtype != null && Object.hasOwnProperty.call(message, 'dtype'))
        writer.uint32(/* id 3, wireType 2 =*/ 26).string(message.dtype)
      if (message.message != null && Object.hasOwnProperty.call(message, 'message'))
        writer.uint32(/* id 4, wireType 2 =*/ 34).string(message.message)
      if (message.motionJointNames != null && message.motionJointNames.length)
        for (let i = 0; i < message.motionJointNames.length; ++i)
          writer
            .uint32(/* id 5, wireType 2 =*/ 42)
            .string(message.motionJointNames[i])
      if (
        message.motionRestposeName != null &&
        Object.hasOwnProperty.call(message, 'motionRestposeName')
      )
        writer.uint32(/* id 6, wireType 2 =*/ 50).string(message.motionRestposeName)
      if (
        message.motionTimelineStartIdxValue != null &&
        Object.hasOwnProperty.call(message, 'motionTimelineStartIdxValue')
      )
        writer
          .uint32(/* id 7, wireType 0 =*/ 56)
          .int32(message.motionTimelineStartIdxValue)
      if (
        message.motionTimelineStartIdxIsNone != null &&
        Object.hasOwnProperty.call(message, 'motionTimelineStartIdxIsNone')
      )
        writer
          .uint32(/* id 8, wireType 0 =*/ 64)
          .bool(message.motionTimelineStartIdxIsNone)
      if (message.faceBlendshapeNames != null && message.faceBlendshapeNames.length)
        for (let i = 0; i < message.faceBlendshapeNames.length; ++i)
          writer
            .uint32(/* id 9, wireType 2 =*/ 74)
            .string(message.faceBlendshapeNames[i])
      if (
        message.audioNChannels != null &&
        Object.hasOwnProperty.call(message, 'audioNChannels')
      )
        writer.uint32(/* id 10, wireType 0 =*/ 80).int32(message.audioNChannels)
      if (
        message.audioSampleWidth != null &&
        Object.hasOwnProperty.call(message, 'audioSampleWidth')
      )
        writer.uint32(/* id 11, wireType 0 =*/ 88).int32(message.audioSampleWidth)
      if (
        message.audioFrameRate != null &&
        Object.hasOwnProperty.call(message, 'audioFrameRate')
      )
        writer.uint32(/* id 12, wireType 0 =*/ 96).int32(message.audioFrameRate)
      if (message.data != null && Object.hasOwnProperty.call(message, 'data'))
        writer.uint32(/* id 13, wireType 2 =*/ 106).bytes(message.data)
      if (
        message.faceTimelineStartIdxValue != null &&
        Object.hasOwnProperty.call(message, 'faceTimelineStartIdxValue')
      )
        writer
          .uint32(/* id 14, wireType 0 =*/ 112)
          .int32(message.faceTimelineStartIdxValue)
      if (
        message.faceTimelineStartIdxIsNone != null &&
        Object.hasOwnProperty.call(message, 'faceTimelineStartIdxIsNone')
      )
        writer
          .uint32(/* id 15, wireType 0 =*/ 120)
          .bool(message.faceTimelineStartIdxIsNone)
      return writer
    }

    /**
     * Encodes the specified OrchestratorV4Response message, length delimited. Does not implicitly {@link orchestrator_v4.OrchestratorV4Response.verify|verify} messages.
     * @function encodeDelimited
     * @memberof orchestrator_v4.OrchestratorV4Response
     * @static
     * @param {orchestrator_v4.IOrchestratorV4Response} message OrchestratorV4Response message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    OrchestratorV4Response.encodeDelimited = function encodeDelimited(
      message,
      writer,
    ) {
      return this.encode(message, writer).ldelim()
    }

    /**
     * Decodes an OrchestratorV4Response message from the specified reader or buffer.
     * @function decode
     * @memberof orchestrator_v4.OrchestratorV4Response
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {orchestrator_v4.OrchestratorV4Response} OrchestratorV4Response
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    OrchestratorV4Response.decode = function decode(reader, length, error) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader)
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.orchestrator_v4.OrchestratorV4Response()
      while (reader.pos < end) {
        let tag = reader.uint32()
        if (tag === error) break
        switch (tag >>> 3) {
          case 1: {
            message.className = reader.string()
            break
          }
          case 2: {
            message.requestId = reader.string()
            break
          }
          case 3: {
            message.dtype = reader.string()
            break
          }
          case 4: {
            message.message = reader.string()
            break
          }
          case 5: {
            if (!(message.motionJointNames && message.motionJointNames.length))
              message.motionJointNames = []
            message.motionJointNames.push(reader.string())
            break
          }
          case 6: {
            message.motionRestposeName = reader.string()
            break
          }
          case 7: {
            message.motionTimelineStartIdxValue = reader.int32()
            break
          }
          case 8: {
            message.motionTimelineStartIdxIsNone = reader.bool()
            break
          }
          case 9: {
            if (!(message.faceBlendshapeNames && message.faceBlendshapeNames.length))
              message.faceBlendshapeNames = []
            message.faceBlendshapeNames.push(reader.string())
            break
          }
          case 10: {
            message.audioNChannels = reader.int32()
            break
          }
          case 11: {
            message.audioSampleWidth = reader.int32()
            break
          }
          case 12: {
            message.audioFrameRate = reader.int32()
            break
          }
          case 13: {
            message.data = reader.bytes()
            break
          }
          case 14: {
            message.faceTimelineStartIdxValue = reader.int32()
            break
          }
          case 15: {
            message.faceTimelineStartIdxIsNone = reader.bool()
            break
          }
          default:
            reader.skipType(tag & 7)
            break
        }
      }
      return message
    }

    /**
     * Decodes an OrchestratorV4Response message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof orchestrator_v4.OrchestratorV4Response
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {orchestrator_v4.OrchestratorV4Response} OrchestratorV4Response
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    OrchestratorV4Response.decodeDelimited = function decodeDelimited(reader) {
      if (!(reader instanceof $Reader)) reader = new $Reader(reader)
      return this.decode(reader, reader.uint32())
    }

    /**
     * Verifies an OrchestratorV4Response message.
     * @function verify
     * @memberof orchestrator_v4.OrchestratorV4Response
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    OrchestratorV4Response.verify = function verify(message) {
      if (typeof message !== 'object' || message === null) return 'object expected'
      let properties = {}
      if (message.className != null && message.hasOwnProperty('className'))
        if (!$util.isString(message.className)) return 'className: string expected'
      if (message.requestId != null && message.hasOwnProperty('requestId'))
        if (!$util.isString(message.requestId)) return 'requestId: string expected'
      if (message.dtype != null && message.hasOwnProperty('dtype'))
        if (!$util.isString(message.dtype)) return 'dtype: string expected'
      if (message.message != null && message.hasOwnProperty('message'))
        if (!$util.isString(message.message)) return 'message: string expected'
      if (
        message.motionJointNames != null &&
        message.hasOwnProperty('motionJointNames')
      ) {
        if (!Array.isArray(message.motionJointNames))
          return 'motionJointNames: array expected'
        for (let i = 0; i < message.motionJointNames.length; ++i)
          if (!$util.isString(message.motionJointNames[i]))
            return 'motionJointNames: string[] expected'
      }
      if (
        message.motionRestposeName != null &&
        message.hasOwnProperty('motionRestposeName')
      )
        if (!$util.isString(message.motionRestposeName))
          return 'motionRestposeName: string expected'
      if (
        message.motionTimelineStartIdxValue != null &&
        message.hasOwnProperty('motionTimelineStartIdxValue')
      ) {
        properties.motionTimelineStartIdx = 1
        if (!$util.isInteger(message.motionTimelineStartIdxValue))
          return 'motionTimelineStartIdxValue: integer expected'
      }
      if (
        message.motionTimelineStartIdxIsNone != null &&
        message.hasOwnProperty('motionTimelineStartIdxIsNone')
      ) {
        if (properties.motionTimelineStartIdx === 1)
          return 'motionTimelineStartIdx: multiple values'
        properties.motionTimelineStartIdx = 1
        if (typeof message.motionTimelineStartIdxIsNone !== 'boolean')
          return 'motionTimelineStartIdxIsNone: boolean expected'
      }
      if (
        message.faceBlendshapeNames != null &&
        message.hasOwnProperty('faceBlendshapeNames')
      ) {
        if (!Array.isArray(message.faceBlendshapeNames))
          return 'faceBlendshapeNames: array expected'
        for (let i = 0; i < message.faceBlendshapeNames.length; ++i)
          if (!$util.isString(message.faceBlendshapeNames[i]))
            return 'faceBlendshapeNames: string[] expected'
      }
      if (message.audioNChannels != null && message.hasOwnProperty('audioNChannels'))
        if (!$util.isInteger(message.audioNChannels))
          return 'audioNChannels: integer expected'
      if (
        message.audioSampleWidth != null &&
        message.hasOwnProperty('audioSampleWidth')
      )
        if (!$util.isInteger(message.audioSampleWidth))
          return 'audioSampleWidth: integer expected'
      if (message.audioFrameRate != null && message.hasOwnProperty('audioFrameRate'))
        if (!$util.isInteger(message.audioFrameRate))
          return 'audioFrameRate: integer expected'
      if (message.data != null && message.hasOwnProperty('data'))
        if (
          !(
            (message.data && typeof message.data.length === 'number') ||
            $util.isString(message.data)
          )
        )
          return 'data: buffer expected'
      if (
        message.faceTimelineStartIdxValue != null &&
        message.hasOwnProperty('faceTimelineStartIdxValue')
      ) {
        properties.faceTimelineStartIdx = 1
        if (!$util.isInteger(message.faceTimelineStartIdxValue))
          return 'faceTimelineStartIdxValue: integer expected'
      }
      if (
        message.faceTimelineStartIdxIsNone != null &&
        message.hasOwnProperty('faceTimelineStartIdxIsNone')
      ) {
        if (properties.faceTimelineStartIdx === 1)
          return 'faceTimelineStartIdx: multiple values'
        properties.faceTimelineStartIdx = 1
        if (typeof message.faceTimelineStartIdxIsNone !== 'boolean')
          return 'faceTimelineStartIdxIsNone: boolean expected'
      }
      return null
    }

    /**
     * Creates an OrchestratorV4Response message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof orchestrator_v4.OrchestratorV4Response
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {orchestrator_v4.OrchestratorV4Response} OrchestratorV4Response
     */
    OrchestratorV4Response.fromObject = function fromObject(object) {
      if (object instanceof $root.orchestrator_v4.OrchestratorV4Response)
        return object
      let message = new $root.orchestrator_v4.OrchestratorV4Response()
      if (object.className != null) message.className = String(object.className)
      if (object.requestId != null) message.requestId = String(object.requestId)
      if (object.dtype != null) message.dtype = String(object.dtype)
      if (object.message != null) message.message = String(object.message)
      if (object.motionJointNames) {
        if (!Array.isArray(object.motionJointNames))
          throw TypeError(
            '.orchestrator_v4.OrchestratorV4Response.motionJointNames: array expected',
          )
        message.motionJointNames = []
        for (let i = 0; i < object.motionJointNames.length; ++i)
          message.motionJointNames[i] = String(object.motionJointNames[i])
      }
      if (object.motionRestposeName != null)
        message.motionRestposeName = String(object.motionRestposeName)
      if (object.motionTimelineStartIdxValue != null)
        message.motionTimelineStartIdxValue = object.motionTimelineStartIdxValue | 0
      if (object.motionTimelineStartIdxIsNone != null)
        message.motionTimelineStartIdxIsNone = Boolean(
          object.motionTimelineStartIdxIsNone,
        )
      if (object.faceBlendshapeNames) {
        if (!Array.isArray(object.faceBlendshapeNames))
          throw TypeError(
            '.orchestrator_v4.OrchestratorV4Response.faceBlendshapeNames: array expected',
          )
        message.faceBlendshapeNames = []
        for (let i = 0; i < object.faceBlendshapeNames.length; ++i)
          message.faceBlendshapeNames[i] = String(object.faceBlendshapeNames[i])
      }
      if (object.audioNChannels != null)
        message.audioNChannels = object.audioNChannels | 0
      if (object.audioSampleWidth != null)
        message.audioSampleWidth = object.audioSampleWidth | 0
      if (object.audioFrameRate != null)
        message.audioFrameRate = object.audioFrameRate | 0
      if (object.data != null)
        if (typeof object.data === 'string')
          $util.base64.decode(
            object.data,
            (message.data = $util.newBuffer($util.base64.length(object.data))),
            0,
          )
        else if (object.data.length >= 0) message.data = object.data
      if (object.faceTimelineStartIdxValue != null)
        message.faceTimelineStartIdxValue = object.faceTimelineStartIdxValue | 0
      if (object.faceTimelineStartIdxIsNone != null)
        message.faceTimelineStartIdxIsNone = Boolean(
          object.faceTimelineStartIdxIsNone,
        )
      return message
    }

    /**
     * Creates a plain object from an OrchestratorV4Response message. Also converts values to other types if specified.
     * @function toObject
     * @memberof orchestrator_v4.OrchestratorV4Response
     * @static
     * @param {orchestrator_v4.OrchestratorV4Response} message OrchestratorV4Response
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    OrchestratorV4Response.toObject = function toObject(message, options) {
      if (!options) options = {}
      let object = {}
      if (options.arrays || options.defaults) {
        object.motionJointNames = []
        object.faceBlendshapeNames = []
      }
      if (options.defaults) {
        object.className = ''
        object.requestId = ''
        object.dtype = ''
        object.message = ''
        object.motionRestposeName = ''
        object.audioNChannels = 0
        object.audioSampleWidth = 0
        object.audioFrameRate = 0
        if (options.bytes === String) object.data = ''
        else {
          object.data = []
          if (options.bytes !== Array) object.data = $util.newBuffer(object.data)
        }
      }
      if (message.className != null && message.hasOwnProperty('className'))
        object.className = message.className
      if (message.requestId != null && message.hasOwnProperty('requestId'))
        object.requestId = message.requestId
      if (message.dtype != null && message.hasOwnProperty('dtype'))
        object.dtype = message.dtype
      if (message.message != null && message.hasOwnProperty('message'))
        object.message = message.message
      if (message.motionJointNames && message.motionJointNames.length) {
        object.motionJointNames = []
        for (let j = 0; j < message.motionJointNames.length; ++j)
          object.motionJointNames[j] = message.motionJointNames[j]
      }
      if (
        message.motionRestposeName != null &&
        message.hasOwnProperty('motionRestposeName')
      )
        object.motionRestposeName = message.motionRestposeName
      if (
        message.motionTimelineStartIdxValue != null &&
        message.hasOwnProperty('motionTimelineStartIdxValue')
      ) {
        object.motionTimelineStartIdxValue = message.motionTimelineStartIdxValue
        if (options.oneofs)
          object.motionTimelineStartIdx = 'motionTimelineStartIdxValue'
      }
      if (
        message.motionTimelineStartIdxIsNone != null &&
        message.hasOwnProperty('motionTimelineStartIdxIsNone')
      ) {
        object.motionTimelineStartIdxIsNone = message.motionTimelineStartIdxIsNone
        if (options.oneofs)
          object.motionTimelineStartIdx = 'motionTimelineStartIdxIsNone'
      }
      if (message.faceBlendshapeNames && message.faceBlendshapeNames.length) {
        object.faceBlendshapeNames = []
        for (let j = 0; j < message.faceBlendshapeNames.length; ++j)
          object.faceBlendshapeNames[j] = message.faceBlendshapeNames[j]
      }
      if (message.audioNChannels != null && message.hasOwnProperty('audioNChannels'))
        object.audioNChannels = message.audioNChannels
      if (
        message.audioSampleWidth != null &&
        message.hasOwnProperty('audioSampleWidth')
      )
        object.audioSampleWidth = message.audioSampleWidth
      if (message.audioFrameRate != null && message.hasOwnProperty('audioFrameRate'))
        object.audioFrameRate = message.audioFrameRate
      if (message.data != null && message.hasOwnProperty('data'))
        object.data =
          options.bytes === String
            ? $util.base64.encode(message.data, 0, message.data.length)
            : options.bytes === Array
              ? Array.prototype.slice.call(message.data)
              : message.data
      if (
        message.faceTimelineStartIdxValue != null &&
        message.hasOwnProperty('faceTimelineStartIdxValue')
      ) {
        object.faceTimelineStartIdxValue = message.faceTimelineStartIdxValue
        if (options.oneofs) object.faceTimelineStartIdx = 'faceTimelineStartIdxValue'
      }
      if (
        message.faceTimelineStartIdxIsNone != null &&
        message.hasOwnProperty('faceTimelineStartIdxIsNone')
      ) {
        object.faceTimelineStartIdxIsNone = message.faceTimelineStartIdxIsNone
        if (options.oneofs)
          object.faceTimelineStartIdx = 'faceTimelineStartIdxIsNone'
      }
      return object
    }

    /**
     * Converts this OrchestratorV4Response to JSON.
     * @function toJSON
     * @memberof orchestrator_v4.OrchestratorV4Response
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    OrchestratorV4Response.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions)
    }

    /**
     * Gets the default type url for OrchestratorV4Response
     * @function getTypeUrl
     * @memberof orchestrator_v4.OrchestratorV4Response
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    OrchestratorV4Response.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = 'type.googleapis.com'
      }
      return typeUrlPrefix + '/orchestrator_v4.OrchestratorV4Response'
    }

    return OrchestratorV4Response
  })()

  return orchestrator_v4
})())

export { $root as default }
