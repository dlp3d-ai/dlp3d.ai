/*eslint-disable no-prototype-builtins*/
import * as $protobuf from 'protobufjs/minimal'

// Common aliases
const $Reader = $protobuf.Reader,
  $Writer = $protobuf.Writer,
  $util = $protobuf.util

// Exported root namespace
const $root = $protobuf.roots['default'] || ($protobuf.roots['default'] = {})

export const motion_file_v1 = ($root.motion_file_v1 = (() => {
  /**
   * Namespace motion_file_v1.
   * @exports motion_file_v1
   * @namespace
   */
  const motion_file_v1 = {}

  motion_file_v1.MotionFileV1Request = (function () {
    /**
     * Properties of a MotionFileV1Request.
     * @memberof motion_file_v1
     * @interface IMotionFileV1Request
     * @property {string|null} [className] MotionFileV1Request className
     * @property {string|null} [avatar] MotionFileV1Request avatar
     * @property {string|null} [appName] MotionFileV1Request appName
     */

    /**
     * Constructs a new MotionFileV1Request.
     * @memberof motion_file_v1
     * @classdesc Represents a MotionFileV1Request.
     * @implements IMotionFileV1Request
     * @constructor
     * @param {motion_file_v1.IMotionFileV1Request=} [properties] Properties to set
     */
    function MotionFileV1Request(properties) {
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]]
    }

    /**
     * MotionFileV1Request className.
     * @member {string} className
     * @memberof motion_file_v1.MotionFileV1Request
     * @instance
     */
    MotionFileV1Request.prototype.className = ''

    /**
     * MotionFileV1Request avatar.
     * @member {string} avatar
     * @memberof motion_file_v1.MotionFileV1Request
     * @instance
     */
    MotionFileV1Request.prototype.avatar = ''

    /**
     * MotionFileV1Request appName.
     * @member {string} appName
     * @memberof motion_file_v1.MotionFileV1Request
     * @instance
     */
    MotionFileV1Request.prototype.appName = ''

    /**
     * Creates a new MotionFileV1Request instance using the specified properties.
     * @function create
     * @memberof motion_file_v1.MotionFileV1Request
     * @static
     * @param {motion_file_v1.IMotionFileV1Request=} [properties] Properties to set
     * @returns {motion_file_v1.MotionFileV1Request} MotionFileV1Request instance
     */
    MotionFileV1Request.create = function create(properties) {
      return new MotionFileV1Request(properties)
    }

    /**
     * Encodes the specified MotionFileV1Request message. Does not implicitly {@link motion_file_v1.MotionFileV1Request.verify|verify} messages.
     * @function encode
     * @memberof motion_file_v1.MotionFileV1Request
     * @static
     * @param {motion_file_v1.IMotionFileV1Request} message MotionFileV1Request message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    MotionFileV1Request.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create()
      if (
        message.className != null &&
        Object.hasOwnProperty.call(message, 'className')
      )
        writer.uint32(/* id 1, wireType 2 =*/ 10).string(message.className)
      if (message.avatar != null && Object.hasOwnProperty.call(message, 'avatar'))
        writer.uint32(/* id 2, wireType 2 =*/ 18).string(message.avatar)
      if (message.appName != null && Object.hasOwnProperty.call(message, 'appName'))
        writer.uint32(/* id 3, wireType 2 =*/ 26).string(message.appName)
      return writer
    }

    /**
     * Encodes the specified MotionFileV1Request message, length delimited. Does not implicitly {@link motion_file_v1.MotionFileV1Request.verify|verify} messages.
     * @function encodeDelimited
     * @memberof motion_file_v1.MotionFileV1Request
     * @static
     * @param {motion_file_v1.IMotionFileV1Request} message MotionFileV1Request message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    MotionFileV1Request.encodeDelimited = function encodeDelimited(message, writer) {
      return this.encode(message, writer).ldelim()
    }

    /**
     * Decodes a MotionFileV1Request message from the specified reader or buffer.
     * @function decode
     * @memberof motion_file_v1.MotionFileV1Request
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {motion_file_v1.MotionFileV1Request} MotionFileV1Request
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    MotionFileV1Request.decode = function decode(reader, length, error) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader)
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.motion_file_v1.MotionFileV1Request()
      while (reader.pos < end) {
        let tag = reader.uint32()
        if (tag === error) break
        switch (tag >>> 3) {
          case 1: {
            message.className = reader.string()
            break
          }
          case 2: {
            message.avatar = reader.string()
            break
          }
          case 3: {
            message.appName = reader.string()
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
     * Decodes a MotionFileV1Request message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof motion_file_v1.MotionFileV1Request
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {motion_file_v1.MotionFileV1Request} MotionFileV1Request
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    MotionFileV1Request.decodeDelimited = function decodeDelimited(reader) {
      if (!(reader instanceof $Reader)) reader = new $Reader(reader)
      return this.decode(reader, reader.uint32())
    }

    /**
     * Verifies a MotionFileV1Request message.
     * @function verify
     * @memberof motion_file_v1.MotionFileV1Request
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    MotionFileV1Request.verify = function verify(message) {
      if (typeof message !== 'object' || message === null) return 'object expected'
      if (message.className != null && message.hasOwnProperty('className'))
        if (!$util.isString(message.className)) return 'className: string expected'
      if (message.avatar != null && message.hasOwnProperty('avatar'))
        if (!$util.isString(message.avatar)) return 'avatar: string expected'
      if (message.appName != null && message.hasOwnProperty('appName'))
        if (!$util.isString(message.appName)) return 'appName: string expected'
      return null
    }

    /**
     * Creates a MotionFileV1Request message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof motion_file_v1.MotionFileV1Request
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {motion_file_v1.MotionFileV1Request} MotionFileV1Request
     */
    MotionFileV1Request.fromObject = function fromObject(object) {
      if (object instanceof $root.motion_file_v1.MotionFileV1Request) return object
      let message = new $root.motion_file_v1.MotionFileV1Request()
      if (object.className != null) message.className = String(object.className)
      if (object.avatar != null) message.avatar = String(object.avatar)
      if (object.appName != null) message.appName = String(object.appName)
      return message
    }

    /**
     * Creates a plain object from a MotionFileV1Request message. Also converts values to other types if specified.
     * @function toObject
     * @memberof motion_file_v1.MotionFileV1Request
     * @static
     * @param {motion_file_v1.MotionFileV1Request} message MotionFileV1Request
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    MotionFileV1Request.toObject = function toObject(message, options) {
      if (!options) options = {}
      let object = {}
      if (options.defaults) {
        object.className = ''
        object.avatar = ''
        object.appName = ''
      }
      if (message.className != null && message.hasOwnProperty('className'))
        object.className = message.className
      if (message.avatar != null && message.hasOwnProperty('avatar'))
        object.avatar = message.avatar
      if (message.appName != null && message.hasOwnProperty('appName'))
        object.appName = message.appName
      return object
    }

    /**
     * Converts this MotionFileV1Request to JSON.
     * @function toJSON
     * @memberof motion_file_v1.MotionFileV1Request
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    MotionFileV1Request.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions)
    }

    /**
     * Gets the default type url for MotionFileV1Request
     * @function getTypeUrl
     * @memberof motion_file_v1.MotionFileV1Request
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    MotionFileV1Request.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = 'type.googleapis.com'
      }
      return typeUrlPrefix + '/motion_file_v1.MotionFileV1Request'
    }

    return MotionFileV1Request
  })()

  motion_file_v1.MotionFileV1Response = (function () {
    /**
     * Properties of a MotionFileV1Response.
     * @memberof motion_file_v1
     * @interface IMotionFileV1Response
     * @property {string|null} [className] MotionFileV1Response className
     * @property {string|null} [version] MotionFileV1Response version
     * @property {string|null} [restposeName] MotionFileV1Response restposeName
     * @property {Array.<string>|null} [jointNames] MotionFileV1Response jointNames
     * @property {number|null} [motionRecordId] MotionFileV1Response motionRecordId
     * @property {boolean|null} [isIdleLong] MotionFileV1Response isIdleLong
     * @property {Array.<string>|null} [states] MotionFileV1Response states
     * @property {Array.<motion_file_v1.ICutoffFrame>|null} [cutoffFrames] MotionFileV1Response cutoffFrames
     * @property {Array.<motion_file_v1.ICutoffRange>|null} [cutoffRanges] MotionFileV1Response cutoffRanges
     * @property {motion_file_v1.INumpyArray|null} [jointRotmat] MotionFileV1Response jointRotmat
     * @property {motion_file_v1.INumpyArray|null} [rootWorldPosition] MotionFileV1Response rootWorldPosition
     * @property {number|null} [loopStartFrame] MotionFileV1Response loopStartFrame
     * @property {number|null} [loopEndFrame] MotionFileV1Response loopEndFrame
     * @property {motion_file_v1.INumpyArray|null} [localMatrices] MotionFileV1Response localMatrices
     * @property {motion_file_v1.INumpyArray|null} [matrixWorld] MotionFileV1Response matrixWorld
     * @property {Array.<number>|null} [parentIndices] MotionFileV1Response parentIndices
     * @property {Uint8Array|null} [data] MotionFileV1Response data
     */

    /**
     * Constructs a new MotionFileV1Response.
     * @memberof motion_file_v1
     * @classdesc Represents a MotionFileV1Response.
     * @implements IMotionFileV1Response
     * @constructor
     * @param {motion_file_v1.IMotionFileV1Response=} [properties] Properties to set
     */
    function MotionFileV1Response(properties) {
      this.jointNames = []
      this.states = []
      this.cutoffFrames = []
      this.cutoffRanges = []
      this.parentIndices = []
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]]
    }

    /**
     * MotionFileV1Response className.
     * @member {string} className
     * @memberof motion_file_v1.MotionFileV1Response
     * @instance
     */
    MotionFileV1Response.prototype.className = ''

    /**
     * MotionFileV1Response version.
     * @member {string} version
     * @memberof motion_file_v1.MotionFileV1Response
     * @instance
     */
    MotionFileV1Response.prototype.version = ''

    /**
     * MotionFileV1Response restposeName.
     * @member {string} restposeName
     * @memberof motion_file_v1.MotionFileV1Response
     * @instance
     */
    MotionFileV1Response.prototype.restposeName = ''

    /**
     * MotionFileV1Response jointNames.
     * @member {Array.<string>} jointNames
     * @memberof motion_file_v1.MotionFileV1Response
     * @instance
     */
    MotionFileV1Response.prototype.jointNames = $util.emptyArray

    /**
     * MotionFileV1Response motionRecordId.
     * @member {number} motionRecordId
     * @memberof motion_file_v1.MotionFileV1Response
     * @instance
     */
    MotionFileV1Response.prototype.motionRecordId = 0

    /**
     * MotionFileV1Response isIdleLong.
     * @member {boolean} isIdleLong
     * @memberof motion_file_v1.MotionFileV1Response
     * @instance
     */
    MotionFileV1Response.prototype.isIdleLong = false

    /**
     * MotionFileV1Response states.
     * @member {Array.<string>} states
     * @memberof motion_file_v1.MotionFileV1Response
     * @instance
     */
    MotionFileV1Response.prototype.states = $util.emptyArray

    /**
     * MotionFileV1Response cutoffFrames.
     * @member {Array.<motion_file_v1.ICutoffFrame>} cutoffFrames
     * @memberof motion_file_v1.MotionFileV1Response
     * @instance
     */
    MotionFileV1Response.prototype.cutoffFrames = $util.emptyArray

    /**
     * MotionFileV1Response cutoffRanges.
     * @member {Array.<motion_file_v1.ICutoffRange>} cutoffRanges
     * @memberof motion_file_v1.MotionFileV1Response
     * @instance
     */
    MotionFileV1Response.prototype.cutoffRanges = $util.emptyArray

    /**
     * MotionFileV1Response jointRotmat.
     * @member {motion_file_v1.INumpyArray|null|undefined} jointRotmat
     * @memberof motion_file_v1.MotionFileV1Response
     * @instance
     */
    MotionFileV1Response.prototype.jointRotmat = null

    /**
     * MotionFileV1Response rootWorldPosition.
     * @member {motion_file_v1.INumpyArray|null|undefined} rootWorldPosition
     * @memberof motion_file_v1.MotionFileV1Response
     * @instance
     */
    MotionFileV1Response.prototype.rootWorldPosition = null

    /**
     * MotionFileV1Response loopStartFrame.
     * @member {number} loopStartFrame
     * @memberof motion_file_v1.MotionFileV1Response
     * @instance
     */
    MotionFileV1Response.prototype.loopStartFrame = 0

    /**
     * MotionFileV1Response loopEndFrame.
     * @member {number} loopEndFrame
     * @memberof motion_file_v1.MotionFileV1Response
     * @instance
     */
    MotionFileV1Response.prototype.loopEndFrame = 0

    /**
     * MotionFileV1Response localMatrices.
     * @member {motion_file_v1.INumpyArray|null|undefined} localMatrices
     * @memberof motion_file_v1.MotionFileV1Response
     * @instance
     */
    MotionFileV1Response.prototype.localMatrices = null

    /**
     * MotionFileV1Response matrixWorld.
     * @member {motion_file_v1.INumpyArray|null|undefined} matrixWorld
     * @memberof motion_file_v1.MotionFileV1Response
     * @instance
     */
    MotionFileV1Response.prototype.matrixWorld = null

    /**
     * MotionFileV1Response parentIndices.
     * @member {Array.<number>} parentIndices
     * @memberof motion_file_v1.MotionFileV1Response
     * @instance
     */
    MotionFileV1Response.prototype.parentIndices = $util.emptyArray

    /**
     * MotionFileV1Response data.
     * @member {Uint8Array} data
     * @memberof motion_file_v1.MotionFileV1Response
     * @instance
     */
    MotionFileV1Response.prototype.data = $util.newBuffer([])

    /**
     * Creates a new MotionFileV1Response instance using the specified properties.
     * @function create
     * @memberof motion_file_v1.MotionFileV1Response
     * @static
     * @param {motion_file_v1.IMotionFileV1Response=} [properties] Properties to set
     * @returns {motion_file_v1.MotionFileV1Response} MotionFileV1Response instance
     */
    MotionFileV1Response.create = function create(properties) {
      return new MotionFileV1Response(properties)
    }

    /**
     * Encodes the specified MotionFileV1Response message. Does not implicitly {@link motion_file_v1.MotionFileV1Response.verify|verify} messages.
     * @function encode
     * @memberof motion_file_v1.MotionFileV1Response
     * @static
     * @param {motion_file_v1.IMotionFileV1Response} message MotionFileV1Response message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    MotionFileV1Response.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create()
      if (
        message.className != null &&
        Object.hasOwnProperty.call(message, 'className')
      )
        writer.uint32(/* id 1, wireType 2 =*/ 10).string(message.className)
      if (message.version != null && Object.hasOwnProperty.call(message, 'version'))
        writer.uint32(/* id 2, wireType 2 =*/ 18).string(message.version)
      if (
        message.restposeName != null &&
        Object.hasOwnProperty.call(message, 'restposeName')
      )
        writer.uint32(/* id 3, wireType 2 =*/ 26).string(message.restposeName)
      if (message.jointNames != null && message.jointNames.length)
        for (let i = 0; i < message.jointNames.length; ++i)
          writer.uint32(/* id 4, wireType 2 =*/ 34).string(message.jointNames[i])
      if (
        message.motionRecordId != null &&
        Object.hasOwnProperty.call(message, 'motionRecordId')
      )
        writer.uint32(/* id 5, wireType 0 =*/ 40).int32(message.motionRecordId)
      if (
        message.isIdleLong != null &&
        Object.hasOwnProperty.call(message, 'isIdleLong')
      )
        writer.uint32(/* id 6, wireType 0 =*/ 48).bool(message.isIdleLong)
      if (message.states != null && message.states.length)
        for (let i = 0; i < message.states.length; ++i)
          writer.uint32(/* id 7, wireType 2 =*/ 58).string(message.states[i])
      if (message.cutoffFrames != null && message.cutoffFrames.length)
        for (let i = 0; i < message.cutoffFrames.length; ++i)
          $root.motion_file_v1.CutoffFrame.encode(
            message.cutoffFrames[i],
            writer.uint32(/* id 8, wireType 2 =*/ 66).fork(),
          ).ldelim()
      if (message.cutoffRanges != null && message.cutoffRanges.length)
        for (let i = 0; i < message.cutoffRanges.length; ++i)
          $root.motion_file_v1.CutoffRange.encode(
            message.cutoffRanges[i],
            writer.uint32(/* id 9, wireType 2 =*/ 74).fork(),
          ).ldelim()
      if (
        message.jointRotmat != null &&
        Object.hasOwnProperty.call(message, 'jointRotmat')
      )
        $root.motion_file_v1.NumpyArray.encode(
          message.jointRotmat,
          writer.uint32(/* id 10, wireType 2 =*/ 82).fork(),
        ).ldelim()
      if (
        message.rootWorldPosition != null &&
        Object.hasOwnProperty.call(message, 'rootWorldPosition')
      )
        $root.motion_file_v1.NumpyArray.encode(
          message.rootWorldPosition,
          writer.uint32(/* id 11, wireType 2 =*/ 90).fork(),
        ).ldelim()
      if (
        message.loopStartFrame != null &&
        Object.hasOwnProperty.call(message, 'loopStartFrame')
      )
        writer.uint32(/* id 12, wireType 0 =*/ 96).int32(message.loopStartFrame)
      if (
        message.loopEndFrame != null &&
        Object.hasOwnProperty.call(message, 'loopEndFrame')
      )
        writer.uint32(/* id 13, wireType 0 =*/ 104).int32(message.loopEndFrame)
      if (
        message.localMatrices != null &&
        Object.hasOwnProperty.call(message, 'localMatrices')
      )
        $root.motion_file_v1.NumpyArray.encode(
          message.localMatrices,
          writer.uint32(/* id 14, wireType 2 =*/ 114).fork(),
        ).ldelim()
      if (
        message.matrixWorld != null &&
        Object.hasOwnProperty.call(message, 'matrixWorld')
      )
        $root.motion_file_v1.NumpyArray.encode(
          message.matrixWorld,
          writer.uint32(/* id 15, wireType 2 =*/ 122).fork(),
        ).ldelim()
      if (message.parentIndices != null && message.parentIndices.length) {
        writer.uint32(/* id 16, wireType 2 =*/ 130).fork()
        for (let i = 0; i < message.parentIndices.length; ++i)
          writer.int32(message.parentIndices[i])
        writer.ldelim()
      }
      if (message.data != null && Object.hasOwnProperty.call(message, 'data'))
        writer.uint32(/* id 17, wireType 2 =*/ 138).bytes(message.data)
      return writer
    }

    /**
     * Encodes the specified MotionFileV1Response message, length delimited. Does not implicitly {@link motion_file_v1.MotionFileV1Response.verify|verify} messages.
     * @function encodeDelimited
     * @memberof motion_file_v1.MotionFileV1Response
     * @static
     * @param {motion_file_v1.IMotionFileV1Response} message MotionFileV1Response message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    MotionFileV1Response.encodeDelimited = function encodeDelimited(
      message,
      writer,
    ) {
      return this.encode(message, writer).ldelim()
    }

    /**
     * Decodes a MotionFileV1Response message from the specified reader or buffer.
     * @function decode
     * @memberof motion_file_v1.MotionFileV1Response
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {motion_file_v1.MotionFileV1Response} MotionFileV1Response
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    MotionFileV1Response.decode = function decode(reader, length, error) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader)
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.motion_file_v1.MotionFileV1Response()
      while (reader.pos < end) {
        let tag = reader.uint32()
        if (tag === error) break
        switch (tag >>> 3) {
          case 1: {
            message.className = reader.string()
            break
          }
          case 2: {
            message.version = reader.string()
            break
          }
          case 3: {
            message.restposeName = reader.string()
            break
          }
          case 4: {
            if (!(message.jointNames && message.jointNames.length))
              message.jointNames = []
            message.jointNames.push(reader.string())
            break
          }
          case 5: {
            message.motionRecordId = reader.int32()
            break
          }
          case 6: {
            message.isIdleLong = reader.bool()
            break
          }
          case 7: {
            if (!(message.states && message.states.length)) message.states = []
            message.states.push(reader.string())
            break
          }
          case 8: {
            if (!(message.cutoffFrames && message.cutoffFrames.length))
              message.cutoffFrames = []
            message.cutoffFrames.push(
              $root.motion_file_v1.CutoffFrame.decode(reader, reader.uint32()),
            )
            break
          }
          case 9: {
            if (!(message.cutoffRanges && message.cutoffRanges.length))
              message.cutoffRanges = []
            message.cutoffRanges.push(
              $root.motion_file_v1.CutoffRange.decode(reader, reader.uint32()),
            )
            break
          }
          case 10: {
            message.jointRotmat = $root.motion_file_v1.NumpyArray.decode(
              reader,
              reader.uint32(),
            )
            break
          }
          case 11: {
            message.rootWorldPosition = $root.motion_file_v1.NumpyArray.decode(
              reader,
              reader.uint32(),
            )
            break
          }
          case 12: {
            message.loopStartFrame = reader.int32()
            break
          }
          case 13: {
            message.loopEndFrame = reader.int32()
            break
          }
          case 14: {
            message.localMatrices = $root.motion_file_v1.NumpyArray.decode(
              reader,
              reader.uint32(),
            )
            break
          }
          case 15: {
            message.matrixWorld = $root.motion_file_v1.NumpyArray.decode(
              reader,
              reader.uint32(),
            )
            break
          }
          case 16: {
            if (!(message.parentIndices && message.parentIndices.length))
              message.parentIndices = []
            if ((tag & 7) === 2) {
              let end2 = reader.uint32() + reader.pos
              while (reader.pos < end2) message.parentIndices.push(reader.int32())
            } else message.parentIndices.push(reader.int32())
            break
          }
          case 17: {
            message.data = reader.bytes()
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
     * Decodes a MotionFileV1Response message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof motion_file_v1.MotionFileV1Response
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {motion_file_v1.MotionFileV1Response} MotionFileV1Response
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    MotionFileV1Response.decodeDelimited = function decodeDelimited(reader) {
      if (!(reader instanceof $Reader)) reader = new $Reader(reader)
      return this.decode(reader, reader.uint32())
    }

    /**
     * Verifies a MotionFileV1Response message.
     * @function verify
     * @memberof motion_file_v1.MotionFileV1Response
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    MotionFileV1Response.verify = function verify(message) {
      if (typeof message !== 'object' || message === null) return 'object expected'
      if (message.className != null && message.hasOwnProperty('className'))
        if (!$util.isString(message.className)) return 'className: string expected'
      if (message.version != null && message.hasOwnProperty('version'))
        if (!$util.isString(message.version)) return 'version: string expected'
      if (message.restposeName != null && message.hasOwnProperty('restposeName'))
        if (!$util.isString(message.restposeName))
          return 'restposeName: string expected'
      if (message.jointNames != null && message.hasOwnProperty('jointNames')) {
        if (!Array.isArray(message.jointNames)) return 'jointNames: array expected'
        for (let i = 0; i < message.jointNames.length; ++i)
          if (!$util.isString(message.jointNames[i]))
            return 'jointNames: string[] expected'
      }
      if (message.motionRecordId != null && message.hasOwnProperty('motionRecordId'))
        if (!$util.isInteger(message.motionRecordId))
          return 'motionRecordId: integer expected'
      if (message.isIdleLong != null && message.hasOwnProperty('isIdleLong'))
        if (typeof message.isIdleLong !== 'boolean')
          return 'isIdleLong: boolean expected'
      if (message.states != null && message.hasOwnProperty('states')) {
        if (!Array.isArray(message.states)) return 'states: array expected'
        for (let i = 0; i < message.states.length; ++i)
          if (!$util.isString(message.states[i])) return 'states: string[] expected'
      }
      if (message.cutoffFrames != null && message.hasOwnProperty('cutoffFrames')) {
        if (!Array.isArray(message.cutoffFrames))
          return 'cutoffFrames: array expected'
        for (let i = 0; i < message.cutoffFrames.length; ++i) {
          let error = $root.motion_file_v1.CutoffFrame.verify(
            message.cutoffFrames[i],
          )
          if (error) return 'cutoffFrames.' + error
        }
      }
      if (message.cutoffRanges != null && message.hasOwnProperty('cutoffRanges')) {
        if (!Array.isArray(message.cutoffRanges))
          return 'cutoffRanges: array expected'
        for (let i = 0; i < message.cutoffRanges.length; ++i) {
          let error = $root.motion_file_v1.CutoffRange.verify(
            message.cutoffRanges[i],
          )
          if (error) return 'cutoffRanges.' + error
        }
      }
      if (message.jointRotmat != null && message.hasOwnProperty('jointRotmat')) {
        let error = $root.motion_file_v1.NumpyArray.verify(message.jointRotmat)
        if (error) return 'jointRotmat.' + error
      }
      if (
        message.rootWorldPosition != null &&
        message.hasOwnProperty('rootWorldPosition')
      ) {
        let error = $root.motion_file_v1.NumpyArray.verify(message.rootWorldPosition)
        if (error) return 'rootWorldPosition.' + error
      }
      if (message.loopStartFrame != null && message.hasOwnProperty('loopStartFrame'))
        if (!$util.isInteger(message.loopStartFrame))
          return 'loopStartFrame: integer expected'
      if (message.loopEndFrame != null && message.hasOwnProperty('loopEndFrame'))
        if (!$util.isInteger(message.loopEndFrame))
          return 'loopEndFrame: integer expected'
      if (message.localMatrices != null && message.hasOwnProperty('localMatrices')) {
        let error = $root.motion_file_v1.NumpyArray.verify(message.localMatrices)
        if (error) return 'localMatrices.' + error
      }
      if (message.matrixWorld != null && message.hasOwnProperty('matrixWorld')) {
        let error = $root.motion_file_v1.NumpyArray.verify(message.matrixWorld)
        if (error) return 'matrixWorld.' + error
      }
      if (message.parentIndices != null && message.hasOwnProperty('parentIndices')) {
        if (!Array.isArray(message.parentIndices))
          return 'parentIndices: array expected'
        for (let i = 0; i < message.parentIndices.length; ++i)
          if (!$util.isInteger(message.parentIndices[i]))
            return 'parentIndices: integer[] expected'
      }
      if (message.data != null && message.hasOwnProperty('data'))
        if (
          !(
            (message.data && typeof message.data.length === 'number') ||
            $util.isString(message.data)
          )
        )
          return 'data: buffer expected'
      return null
    }

    /**
     * Creates a MotionFileV1Response message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof motion_file_v1.MotionFileV1Response
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {motion_file_v1.MotionFileV1Response} MotionFileV1Response
     */
    MotionFileV1Response.fromObject = function fromObject(object) {
      if (object instanceof $root.motion_file_v1.MotionFileV1Response) return object
      let message = new $root.motion_file_v1.MotionFileV1Response()
      if (object.className != null) message.className = String(object.className)
      if (object.version != null) message.version = String(object.version)
      if (object.restposeName != null)
        message.restposeName = String(object.restposeName)
      if (object.jointNames) {
        if (!Array.isArray(object.jointNames))
          throw TypeError(
            '.motion_file_v1.MotionFileV1Response.jointNames: array expected',
          )
        message.jointNames = []
        for (let i = 0; i < object.jointNames.length; ++i)
          message.jointNames[i] = String(object.jointNames[i])
      }
      if (object.motionRecordId != null)
        message.motionRecordId = object.motionRecordId | 0
      if (object.isIdleLong != null) message.isIdleLong = Boolean(object.isIdleLong)
      if (object.states) {
        if (!Array.isArray(object.states))
          throw TypeError(
            '.motion_file_v1.MotionFileV1Response.states: array expected',
          )
        message.states = []
        for (let i = 0; i < object.states.length; ++i)
          message.states[i] = String(object.states[i])
      }
      if (object.cutoffFrames) {
        if (!Array.isArray(object.cutoffFrames))
          throw TypeError(
            '.motion_file_v1.MotionFileV1Response.cutoffFrames: array expected',
          )
        message.cutoffFrames = []
        for (let i = 0; i < object.cutoffFrames.length; ++i) {
          if (typeof object.cutoffFrames[i] !== 'object')
            throw TypeError(
              '.motion_file_v1.MotionFileV1Response.cutoffFrames: object expected',
            )
          message.cutoffFrames[i] = $root.motion_file_v1.CutoffFrame.fromObject(
            object.cutoffFrames[i],
          )
        }
      }
      if (object.cutoffRanges) {
        if (!Array.isArray(object.cutoffRanges))
          throw TypeError(
            '.motion_file_v1.MotionFileV1Response.cutoffRanges: array expected',
          )
        message.cutoffRanges = []
        for (let i = 0; i < object.cutoffRanges.length; ++i) {
          if (typeof object.cutoffRanges[i] !== 'object')
            throw TypeError(
              '.motion_file_v1.MotionFileV1Response.cutoffRanges: object expected',
            )
          message.cutoffRanges[i] = $root.motion_file_v1.CutoffRange.fromObject(
            object.cutoffRanges[i],
          )
        }
      }
      if (object.jointRotmat != null) {
        if (typeof object.jointRotmat !== 'object')
          throw TypeError(
            '.motion_file_v1.MotionFileV1Response.jointRotmat: object expected',
          )
        message.jointRotmat = $root.motion_file_v1.NumpyArray.fromObject(
          object.jointRotmat,
        )
      }
      if (object.rootWorldPosition != null) {
        if (typeof object.rootWorldPosition !== 'object')
          throw TypeError(
            '.motion_file_v1.MotionFileV1Response.rootWorldPosition: object expected',
          )
        message.rootWorldPosition = $root.motion_file_v1.NumpyArray.fromObject(
          object.rootWorldPosition,
        )
      }
      if (object.loopStartFrame != null)
        message.loopStartFrame = object.loopStartFrame | 0
      if (object.loopEndFrame != null) message.loopEndFrame = object.loopEndFrame | 0
      if (object.localMatrices != null) {
        if (typeof object.localMatrices !== 'object')
          throw TypeError(
            '.motion_file_v1.MotionFileV1Response.localMatrices: object expected',
          )
        message.localMatrices = $root.motion_file_v1.NumpyArray.fromObject(
          object.localMatrices,
        )
      }
      if (object.matrixWorld != null) {
        if (typeof object.matrixWorld !== 'object')
          throw TypeError(
            '.motion_file_v1.MotionFileV1Response.matrixWorld: object expected',
          )
        message.matrixWorld = $root.motion_file_v1.NumpyArray.fromObject(
          object.matrixWorld,
        )
      }
      if (object.parentIndices) {
        if (!Array.isArray(object.parentIndices))
          throw TypeError(
            '.motion_file_v1.MotionFileV1Response.parentIndices: array expected',
          )
        message.parentIndices = []
        for (let i = 0; i < object.parentIndices.length; ++i)
          message.parentIndices[i] = object.parentIndices[i] | 0
      }
      if (object.data != null)
        if (typeof object.data === 'string')
          $util.base64.decode(
            object.data,
            (message.data = $util.newBuffer($util.base64.length(object.data))),
            0,
          )
        else if (object.data.length >= 0) message.data = object.data
      return message
    }

    /**
     * Creates a plain object from a MotionFileV1Response message. Also converts values to other types if specified.
     * @function toObject
     * @memberof motion_file_v1.MotionFileV1Response
     * @static
     * @param {motion_file_v1.MotionFileV1Response} message MotionFileV1Response
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    MotionFileV1Response.toObject = function toObject(message, options) {
      if (!options) options = {}
      let object = {}
      if (options.arrays || options.defaults) {
        object.jointNames = []
        object.states = []
        object.cutoffFrames = []
        object.cutoffRanges = []
        object.parentIndices = []
      }
      if (options.defaults) {
        object.className = ''
        object.version = ''
        object.restposeName = ''
        object.motionRecordId = 0
        object.isIdleLong = false
        object.jointRotmat = null
        object.rootWorldPosition = null
        object.loopStartFrame = 0
        object.loopEndFrame = 0
        object.localMatrices = null
        object.matrixWorld = null
        if (options.bytes === String) object.data = ''
        else {
          object.data = []
          if (options.bytes !== Array) object.data = $util.newBuffer(object.data)
        }
      }
      if (message.className != null && message.hasOwnProperty('className'))
        object.className = message.className
      if (message.version != null && message.hasOwnProperty('version'))
        object.version = message.version
      if (message.restposeName != null && message.hasOwnProperty('restposeName'))
        object.restposeName = message.restposeName
      if (message.jointNames && message.jointNames.length) {
        object.jointNames = []
        for (let j = 0; j < message.jointNames.length; ++j)
          object.jointNames[j] = message.jointNames[j]
      }
      if (message.motionRecordId != null && message.hasOwnProperty('motionRecordId'))
        object.motionRecordId = message.motionRecordId
      if (message.isIdleLong != null && message.hasOwnProperty('isIdleLong'))
        object.isIdleLong = message.isIdleLong
      if (message.states && message.states.length) {
        object.states = []
        for (let j = 0; j < message.states.length; ++j)
          object.states[j] = message.states[j]
      }
      if (message.cutoffFrames && message.cutoffFrames.length) {
        object.cutoffFrames = []
        for (let j = 0; j < message.cutoffFrames.length; ++j)
          object.cutoffFrames[j] = $root.motion_file_v1.CutoffFrame.toObject(
            message.cutoffFrames[j],
            options,
          )
      }
      if (message.cutoffRanges && message.cutoffRanges.length) {
        object.cutoffRanges = []
        for (let j = 0; j < message.cutoffRanges.length; ++j)
          object.cutoffRanges[j] = $root.motion_file_v1.CutoffRange.toObject(
            message.cutoffRanges[j],
            options,
          )
      }
      if (message.jointRotmat != null && message.hasOwnProperty('jointRotmat'))
        object.jointRotmat = $root.motion_file_v1.NumpyArray.toObject(
          message.jointRotmat,
          options,
        )
      if (
        message.rootWorldPosition != null &&
        message.hasOwnProperty('rootWorldPosition')
      )
        object.rootWorldPosition = $root.motion_file_v1.NumpyArray.toObject(
          message.rootWorldPosition,
          options,
        )
      if (message.loopStartFrame != null && message.hasOwnProperty('loopStartFrame'))
        object.loopStartFrame = message.loopStartFrame
      if (message.loopEndFrame != null && message.hasOwnProperty('loopEndFrame'))
        object.loopEndFrame = message.loopEndFrame
      if (message.localMatrices != null && message.hasOwnProperty('localMatrices'))
        object.localMatrices = $root.motion_file_v1.NumpyArray.toObject(
          message.localMatrices,
          options,
        )
      if (message.matrixWorld != null && message.hasOwnProperty('matrixWorld'))
        object.matrixWorld = $root.motion_file_v1.NumpyArray.toObject(
          message.matrixWorld,
          options,
        )
      if (message.parentIndices && message.parentIndices.length) {
        object.parentIndices = []
        for (let j = 0; j < message.parentIndices.length; ++j)
          object.parentIndices[j] = message.parentIndices[j]
      }
      if (message.data != null && message.hasOwnProperty('data'))
        object.data =
          options.bytes === String
            ? $util.base64.encode(message.data, 0, message.data.length)
            : options.bytes === Array
              ? Array.prototype.slice.call(message.data)
              : message.data
      return object
    }

    /**
     * Converts this MotionFileV1Response to JSON.
     * @function toJSON
     * @memberof motion_file_v1.MotionFileV1Response
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    MotionFileV1Response.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions)
    }

    /**
     * Gets the default type url for MotionFileV1Response
     * @function getTypeUrl
     * @memberof motion_file_v1.MotionFileV1Response
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    MotionFileV1Response.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = 'type.googleapis.com'
      }
      return typeUrlPrefix + '/motion_file_v1.MotionFileV1Response'
    }

    return MotionFileV1Response
  })()

  motion_file_v1.CutoffFrame = (function () {
    /**
     * Properties of a CutoffFrame.
     * @memberof motion_file_v1
     * @interface ICutoffFrame
     * @property {number|null} [frameIdx] CutoffFrame frameIdx
     * @property {number|null} [leftPriority] CutoffFrame leftPriority
     * @property {number|null} [rightPriority] CutoffFrame rightPriority
     */

    /**
     * Constructs a new CutoffFrame.
     * @memberof motion_file_v1
     * @classdesc Represents a CutoffFrame.
     * @implements ICutoffFrame
     * @constructor
     * @param {motion_file_v1.ICutoffFrame=} [properties] Properties to set
     */
    function CutoffFrame(properties) {
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]]
    }

    /**
     * CutoffFrame frameIdx.
     * @member {number} frameIdx
     * @memberof motion_file_v1.CutoffFrame
     * @instance
     */
    CutoffFrame.prototype.frameIdx = 0

    /**
     * CutoffFrame leftPriority.
     * @member {number} leftPriority
     * @memberof motion_file_v1.CutoffFrame
     * @instance
     */
    CutoffFrame.prototype.leftPriority = 0

    /**
     * CutoffFrame rightPriority.
     * @member {number} rightPriority
     * @memberof motion_file_v1.CutoffFrame
     * @instance
     */
    CutoffFrame.prototype.rightPriority = 0

    /**
     * Creates a new CutoffFrame instance using the specified properties.
     * @function create
     * @memberof motion_file_v1.CutoffFrame
     * @static
     * @param {motion_file_v1.ICutoffFrame=} [properties] Properties to set
     * @returns {motion_file_v1.CutoffFrame} CutoffFrame instance
     */
    CutoffFrame.create = function create(properties) {
      return new CutoffFrame(properties)
    }

    /**
     * Encodes the specified CutoffFrame message. Does not implicitly {@link motion_file_v1.CutoffFrame.verify|verify} messages.
     * @function encode
     * @memberof motion_file_v1.CutoffFrame
     * @static
     * @param {motion_file_v1.ICutoffFrame} message CutoffFrame message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    CutoffFrame.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create()
      if (
        message.frameIdx != null &&
        Object.hasOwnProperty.call(message, 'frameIdx')
      )
        writer.uint32(/* id 1, wireType 0 =*/ 8).int32(message.frameIdx)
      if (
        message.leftPriority != null &&
        Object.hasOwnProperty.call(message, 'leftPriority')
      )
        writer.uint32(/* id 2, wireType 0 =*/ 16).int32(message.leftPriority)
      if (
        message.rightPriority != null &&
        Object.hasOwnProperty.call(message, 'rightPriority')
      )
        writer.uint32(/* id 3, wireType 0 =*/ 24).int32(message.rightPriority)
      return writer
    }

    /**
     * Encodes the specified CutoffFrame message, length delimited. Does not implicitly {@link motion_file_v1.CutoffFrame.verify|verify} messages.
     * @function encodeDelimited
     * @memberof motion_file_v1.CutoffFrame
     * @static
     * @param {motion_file_v1.ICutoffFrame} message CutoffFrame message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    CutoffFrame.encodeDelimited = function encodeDelimited(message, writer) {
      return this.encode(message, writer).ldelim()
    }

    /**
     * Decodes a CutoffFrame message from the specified reader or buffer.
     * @function decode
     * @memberof motion_file_v1.CutoffFrame
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {motion_file_v1.CutoffFrame} CutoffFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    CutoffFrame.decode = function decode(reader, length, error) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader)
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.motion_file_v1.CutoffFrame()
      while (reader.pos < end) {
        let tag = reader.uint32()
        if (tag === error) break
        switch (tag >>> 3) {
          case 1: {
            message.frameIdx = reader.int32()
            break
          }
          case 2: {
            message.leftPriority = reader.int32()
            break
          }
          case 3: {
            message.rightPriority = reader.int32()
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
     * Decodes a CutoffFrame message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof motion_file_v1.CutoffFrame
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {motion_file_v1.CutoffFrame} CutoffFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    CutoffFrame.decodeDelimited = function decodeDelimited(reader) {
      if (!(reader instanceof $Reader)) reader = new $Reader(reader)
      return this.decode(reader, reader.uint32())
    }

    /**
     * Verifies a CutoffFrame message.
     * @function verify
     * @memberof motion_file_v1.CutoffFrame
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    CutoffFrame.verify = function verify(message) {
      if (typeof message !== 'object' || message === null) return 'object expected'
      if (message.frameIdx != null && message.hasOwnProperty('frameIdx'))
        if (!$util.isInteger(message.frameIdx)) return 'frameIdx: integer expected'
      if (message.leftPriority != null && message.hasOwnProperty('leftPriority'))
        if (!$util.isInteger(message.leftPriority))
          return 'leftPriority: integer expected'
      if (message.rightPriority != null && message.hasOwnProperty('rightPriority'))
        if (!$util.isInteger(message.rightPriority))
          return 'rightPriority: integer expected'
      return null
    }

    /**
     * Creates a CutoffFrame message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof motion_file_v1.CutoffFrame
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {motion_file_v1.CutoffFrame} CutoffFrame
     */
    CutoffFrame.fromObject = function fromObject(object) {
      if (object instanceof $root.motion_file_v1.CutoffFrame) return object
      let message = new $root.motion_file_v1.CutoffFrame()
      if (object.frameIdx != null) message.frameIdx = object.frameIdx | 0
      if (object.leftPriority != null) message.leftPriority = object.leftPriority | 0
      if (object.rightPriority != null)
        message.rightPriority = object.rightPriority | 0
      return message
    }

    /**
     * Creates a plain object from a CutoffFrame message. Also converts values to other types if specified.
     * @function toObject
     * @memberof motion_file_v1.CutoffFrame
     * @static
     * @param {motion_file_v1.CutoffFrame} message CutoffFrame
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    CutoffFrame.toObject = function toObject(message, options) {
      if (!options) options = {}
      let object = {}
      if (options.defaults) {
        object.frameIdx = 0
        object.leftPriority = 0
        object.rightPriority = 0
      }
      if (message.frameIdx != null && message.hasOwnProperty('frameIdx'))
        object.frameIdx = message.frameIdx
      if (message.leftPriority != null && message.hasOwnProperty('leftPriority'))
        object.leftPriority = message.leftPriority
      if (message.rightPriority != null && message.hasOwnProperty('rightPriority'))
        object.rightPriority = message.rightPriority
      return object
    }

    /**
     * Converts this CutoffFrame to JSON.
     * @function toJSON
     * @memberof motion_file_v1.CutoffFrame
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    CutoffFrame.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions)
    }

    /**
     * Gets the default type url for CutoffFrame
     * @function getTypeUrl
     * @memberof motion_file_v1.CutoffFrame
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    CutoffFrame.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = 'type.googleapis.com'
      }
      return typeUrlPrefix + '/motion_file_v1.CutoffFrame'
    }

    return CutoffFrame
  })()

  motion_file_v1.CutoffRange = (function () {
    /**
     * Properties of a CutoffRange.
     * @memberof motion_file_v1
     * @interface ICutoffRange
     * @property {number|null} [startFrameIdx] CutoffRange startFrameIdx
     * @property {number|null} [endFrameIdx] CutoffRange endFrameIdx
     * @property {number|null} [leftPriority] CutoffRange leftPriority
     * @property {number|null} [rightPriority] CutoffRange rightPriority
     */

    /**
     * Constructs a new CutoffRange.
     * @memberof motion_file_v1
     * @classdesc Represents a CutoffRange.
     * @implements ICutoffRange
     * @constructor
     * @param {motion_file_v1.ICutoffRange=} [properties] Properties to set
     */
    function CutoffRange(properties) {
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]]
    }

    /**
     * CutoffRange startFrameIdx.
     * @member {number} startFrameIdx
     * @memberof motion_file_v1.CutoffRange
     * @instance
     */
    CutoffRange.prototype.startFrameIdx = 0

    /**
     * CutoffRange endFrameIdx.
     * @member {number} endFrameIdx
     * @memberof motion_file_v1.CutoffRange
     * @instance
     */
    CutoffRange.prototype.endFrameIdx = 0

    /**
     * CutoffRange leftPriority.
     * @member {number} leftPriority
     * @memberof motion_file_v1.CutoffRange
     * @instance
     */
    CutoffRange.prototype.leftPriority = 0

    /**
     * CutoffRange rightPriority.
     * @member {number} rightPriority
     * @memberof motion_file_v1.CutoffRange
     * @instance
     */
    CutoffRange.prototype.rightPriority = 0

    /**
     * Creates a new CutoffRange instance using the specified properties.
     * @function create
     * @memberof motion_file_v1.CutoffRange
     * @static
     * @param {motion_file_v1.ICutoffRange=} [properties] Properties to set
     * @returns {motion_file_v1.CutoffRange} CutoffRange instance
     */
    CutoffRange.create = function create(properties) {
      return new CutoffRange(properties)
    }

    /**
     * Encodes the specified CutoffRange message. Does not implicitly {@link motion_file_v1.CutoffRange.verify|verify} messages.
     * @function encode
     * @memberof motion_file_v1.CutoffRange
     * @static
     * @param {motion_file_v1.ICutoffRange} message CutoffRange message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    CutoffRange.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create()
      if (
        message.startFrameIdx != null &&
        Object.hasOwnProperty.call(message, 'startFrameIdx')
      )
        writer.uint32(/* id 1, wireType 0 =*/ 8).int32(message.startFrameIdx)
      if (
        message.endFrameIdx != null &&
        Object.hasOwnProperty.call(message, 'endFrameIdx')
      )
        writer.uint32(/* id 2, wireType 0 =*/ 16).int32(message.endFrameIdx)
      if (
        message.leftPriority != null &&
        Object.hasOwnProperty.call(message, 'leftPriority')
      )
        writer.uint32(/* id 3, wireType 0 =*/ 24).int32(message.leftPriority)
      if (
        message.rightPriority != null &&
        Object.hasOwnProperty.call(message, 'rightPriority')
      )
        writer.uint32(/* id 4, wireType 0 =*/ 32).int32(message.rightPriority)
      return writer
    }

    /**
     * Encodes the specified CutoffRange message, length delimited. Does not implicitly {@link motion_file_v1.CutoffRange.verify|verify} messages.
     * @function encodeDelimited
     * @memberof motion_file_v1.CutoffRange
     * @static
     * @param {motion_file_v1.ICutoffRange} message CutoffRange message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    CutoffRange.encodeDelimited = function encodeDelimited(message, writer) {
      return this.encode(message, writer).ldelim()
    }

    /**
     * Decodes a CutoffRange message from the specified reader or buffer.
     * @function decode
     * @memberof motion_file_v1.CutoffRange
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {motion_file_v1.CutoffRange} CutoffRange
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    CutoffRange.decode = function decode(reader, length, error) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader)
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.motion_file_v1.CutoffRange()
      while (reader.pos < end) {
        let tag = reader.uint32()
        if (tag === error) break
        switch (tag >>> 3) {
          case 1: {
            message.startFrameIdx = reader.int32()
            break
          }
          case 2: {
            message.endFrameIdx = reader.int32()
            break
          }
          case 3: {
            message.leftPriority = reader.int32()
            break
          }
          case 4: {
            message.rightPriority = reader.int32()
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
     * Decodes a CutoffRange message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof motion_file_v1.CutoffRange
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {motion_file_v1.CutoffRange} CutoffRange
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    CutoffRange.decodeDelimited = function decodeDelimited(reader) {
      if (!(reader instanceof $Reader)) reader = new $Reader(reader)
      return this.decode(reader, reader.uint32())
    }

    /**
     * Verifies a CutoffRange message.
     * @function verify
     * @memberof motion_file_v1.CutoffRange
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    CutoffRange.verify = function verify(message) {
      if (typeof message !== 'object' || message === null) return 'object expected'
      if (message.startFrameIdx != null && message.hasOwnProperty('startFrameIdx'))
        if (!$util.isInteger(message.startFrameIdx))
          return 'startFrameIdx: integer expected'
      if (message.endFrameIdx != null && message.hasOwnProperty('endFrameIdx'))
        if (!$util.isInteger(message.endFrameIdx))
          return 'endFrameIdx: integer expected'
      if (message.leftPriority != null && message.hasOwnProperty('leftPriority'))
        if (!$util.isInteger(message.leftPriority))
          return 'leftPriority: integer expected'
      if (message.rightPriority != null && message.hasOwnProperty('rightPriority'))
        if (!$util.isInteger(message.rightPriority))
          return 'rightPriority: integer expected'
      return null
    }

    /**
     * Creates a CutoffRange message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof motion_file_v1.CutoffRange
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {motion_file_v1.CutoffRange} CutoffRange
     */
    CutoffRange.fromObject = function fromObject(object) {
      if (object instanceof $root.motion_file_v1.CutoffRange) return object
      let message = new $root.motion_file_v1.CutoffRange()
      if (object.startFrameIdx != null)
        message.startFrameIdx = object.startFrameIdx | 0
      if (object.endFrameIdx != null) message.endFrameIdx = object.endFrameIdx | 0
      if (object.leftPriority != null) message.leftPriority = object.leftPriority | 0
      if (object.rightPriority != null)
        message.rightPriority = object.rightPriority | 0
      return message
    }

    /**
     * Creates a plain object from a CutoffRange message. Also converts values to other types if specified.
     * @function toObject
     * @memberof motion_file_v1.CutoffRange
     * @static
     * @param {motion_file_v1.CutoffRange} message CutoffRange
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    CutoffRange.toObject = function toObject(message, options) {
      if (!options) options = {}
      let object = {}
      if (options.defaults) {
        object.startFrameIdx = 0
        object.endFrameIdx = 0
        object.leftPriority = 0
        object.rightPriority = 0
      }
      if (message.startFrameIdx != null && message.hasOwnProperty('startFrameIdx'))
        object.startFrameIdx = message.startFrameIdx
      if (message.endFrameIdx != null && message.hasOwnProperty('endFrameIdx'))
        object.endFrameIdx = message.endFrameIdx
      if (message.leftPriority != null && message.hasOwnProperty('leftPriority'))
        object.leftPriority = message.leftPriority
      if (message.rightPriority != null && message.hasOwnProperty('rightPriority'))
        object.rightPriority = message.rightPriority
      return object
    }

    /**
     * Converts this CutoffRange to JSON.
     * @function toJSON
     * @memberof motion_file_v1.CutoffRange
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    CutoffRange.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions)
    }

    /**
     * Gets the default type url for CutoffRange
     * @function getTypeUrl
     * @memberof motion_file_v1.CutoffRange
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    CutoffRange.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = 'type.googleapis.com'
      }
      return typeUrlPrefix + '/motion_file_v1.CutoffRange'
    }

    return CutoffRange
  })()

  motion_file_v1.NumpyArray = (function () {
    /**
     * Properties of a NumpyArray.
     * @memberof motion_file_v1
     * @interface INumpyArray
     * @property {string|null} [dtype] NumpyArray dtype
     * @property {Array.<number>|null} [shape] NumpyArray shape
     * @property {Uint8Array|null} [data] NumpyArray data
     */

    /**
     * Constructs a new NumpyArray.
     * @memberof motion_file_v1
     * @classdesc Represents a NumpyArray.
     * @implements INumpyArray
     * @constructor
     * @param {motion_file_v1.INumpyArray=} [properties] Properties to set
     */
    function NumpyArray(properties) {
      this.shape = []
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]]
    }

    /**
     * NumpyArray dtype.
     * @member {string} dtype
     * @memberof motion_file_v1.NumpyArray
     * @instance
     */
    NumpyArray.prototype.dtype = ''

    /**
     * NumpyArray shape.
     * @member {Array.<number>} shape
     * @memberof motion_file_v1.NumpyArray
     * @instance
     */
    NumpyArray.prototype.shape = $util.emptyArray

    /**
     * NumpyArray data.
     * @member {Uint8Array} data
     * @memberof motion_file_v1.NumpyArray
     * @instance
     */
    NumpyArray.prototype.data = $util.newBuffer([])

    /**
     * Creates a new NumpyArray instance using the specified properties.
     * @function create
     * @memberof motion_file_v1.NumpyArray
     * @static
     * @param {motion_file_v1.INumpyArray=} [properties] Properties to set
     * @returns {motion_file_v1.NumpyArray} NumpyArray instance
     */
    NumpyArray.create = function create(properties) {
      return new NumpyArray(properties)
    }

    /**
     * Encodes the specified NumpyArray message. Does not implicitly {@link motion_file_v1.NumpyArray.verify|verify} messages.
     * @function encode
     * @memberof motion_file_v1.NumpyArray
     * @static
     * @param {motion_file_v1.INumpyArray} message NumpyArray message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    NumpyArray.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create()
      if (message.dtype != null && Object.hasOwnProperty.call(message, 'dtype'))
        writer.uint32(/* id 1, wireType 2 =*/ 10).string(message.dtype)
      if (message.shape != null && message.shape.length) {
        writer.uint32(/* id 2, wireType 2 =*/ 18).fork()
        for (let i = 0; i < message.shape.length; ++i) writer.int32(message.shape[i])
        writer.ldelim()
      }
      if (message.data != null && Object.hasOwnProperty.call(message, 'data'))
        writer.uint32(/* id 3, wireType 2 =*/ 26).bytes(message.data)
      return writer
    }

    /**
     * Encodes the specified NumpyArray message, length delimited. Does not implicitly {@link motion_file_v1.NumpyArray.verify|verify} messages.
     * @function encodeDelimited
     * @memberof motion_file_v1.NumpyArray
     * @static
     * @param {motion_file_v1.INumpyArray} message NumpyArray message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    NumpyArray.encodeDelimited = function encodeDelimited(message, writer) {
      return this.encode(message, writer).ldelim()
    }

    /**
     * Decodes a NumpyArray message from the specified reader or buffer.
     * @function decode
     * @memberof motion_file_v1.NumpyArray
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {motion_file_v1.NumpyArray} NumpyArray
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    NumpyArray.decode = function decode(reader, length, error) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader)
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.motion_file_v1.NumpyArray()
      while (reader.pos < end) {
        let tag = reader.uint32()
        if (tag === error) break
        switch (tag >>> 3) {
          case 1: {
            message.dtype = reader.string()
            break
          }
          case 2: {
            if (!(message.shape && message.shape.length)) message.shape = []
            if ((tag & 7) === 2) {
              let end2 = reader.uint32() + reader.pos
              while (reader.pos < end2) message.shape.push(reader.int32())
            } else message.shape.push(reader.int32())
            break
          }
          case 3: {
            message.data = reader.bytes()
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
     * Decodes a NumpyArray message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof motion_file_v1.NumpyArray
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {motion_file_v1.NumpyArray} NumpyArray
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    NumpyArray.decodeDelimited = function decodeDelimited(reader) {
      if (!(reader instanceof $Reader)) reader = new $Reader(reader)
      return this.decode(reader, reader.uint32())
    }

    /**
     * Verifies a NumpyArray message.
     * @function verify
     * @memberof motion_file_v1.NumpyArray
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    NumpyArray.verify = function verify(message) {
      if (typeof message !== 'object' || message === null) return 'object expected'
      if (message.dtype != null && message.hasOwnProperty('dtype'))
        if (!$util.isString(message.dtype)) return 'dtype: string expected'
      if (message.shape != null && message.hasOwnProperty('shape')) {
        if (!Array.isArray(message.shape)) return 'shape: array expected'
        for (let i = 0; i < message.shape.length; ++i)
          if (!$util.isInteger(message.shape[i])) return 'shape: integer[] expected'
      }
      if (message.data != null && message.hasOwnProperty('data'))
        if (
          !(
            (message.data && typeof message.data.length === 'number') ||
            $util.isString(message.data)
          )
        )
          return 'data: buffer expected'
      return null
    }

    /**
     * Creates a NumpyArray message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof motion_file_v1.NumpyArray
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {motion_file_v1.NumpyArray} NumpyArray
     */
    NumpyArray.fromObject = function fromObject(object) {
      if (object instanceof $root.motion_file_v1.NumpyArray) return object
      let message = new $root.motion_file_v1.NumpyArray()
      if (object.dtype != null) message.dtype = String(object.dtype)
      if (object.shape) {
        if (!Array.isArray(object.shape))
          throw TypeError('.motion_file_v1.NumpyArray.shape: array expected')
        message.shape = []
        for (let i = 0; i < object.shape.length; ++i)
          message.shape[i] = object.shape[i] | 0
      }
      if (object.data != null)
        if (typeof object.data === 'string')
          $util.base64.decode(
            object.data,
            (message.data = $util.newBuffer($util.base64.length(object.data))),
            0,
          )
        else if (object.data.length >= 0) message.data = object.data
      return message
    }

    /**
     * Creates a plain object from a NumpyArray message. Also converts values to other types if specified.
     * @function toObject
     * @memberof motion_file_v1.NumpyArray
     * @static
     * @param {motion_file_v1.NumpyArray} message NumpyArray
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    NumpyArray.toObject = function toObject(message, options) {
      if (!options) options = {}
      let object = {}
      if (options.arrays || options.defaults) object.shape = []
      if (options.defaults) {
        object.dtype = ''
        if (options.bytes === String) object.data = ''
        else {
          object.data = []
          if (options.bytes !== Array) object.data = $util.newBuffer(object.data)
        }
      }
      if (message.dtype != null && message.hasOwnProperty('dtype'))
        object.dtype = message.dtype
      if (message.shape && message.shape.length) {
        object.shape = []
        for (let j = 0; j < message.shape.length; ++j)
          object.shape[j] = message.shape[j]
      }
      if (message.data != null && message.hasOwnProperty('data'))
        object.data =
          options.bytes === String
            ? $util.base64.encode(message.data, 0, message.data.length)
            : options.bytes === Array
              ? Array.prototype.slice.call(message.data)
              : message.data
      return object
    }

    /**
     * Converts this NumpyArray to JSON.
     * @function toJSON
     * @memberof motion_file_v1.NumpyArray
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    NumpyArray.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions)
    }

    /**
     * Gets the default type url for NumpyArray
     * @function getTypeUrl
     * @memberof motion_file_v1.NumpyArray
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    NumpyArray.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = 'type.googleapis.com'
      }
      return typeUrlPrefix + '/motion_file_v1.NumpyArray'
    }

    return NumpyArray
  })()

  return motion_file_v1
})())

export { $root as default }
