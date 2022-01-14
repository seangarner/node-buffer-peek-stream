"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.promise = exports.BufferPeekStream = void 0;
var stream_1 = __importDefault(require("stream"));
var BufferPeekStream = (function (_super) {
    __extends(BufferPeekStream, _super);
    function BufferPeekStream(opts) {
        var _this = this;
        if (!opts)
            opts = {};
        _this = _super.call(this, opts) || this;
        opts.highWaterMark = opts.peekBytes || 65536;
        stream_1.default.Transform.call(_this, opts);
        _this._peekState = {
            buffer: [],
            bytes: 0,
            maxBytes: opts.peekBytes || 65536,
            peeked: false,
        };
        return _this;
    }
    BufferPeekStream.prototype._transform = function (chunk, _encoding, callback) {
        var _a;
        var state = this._peekState;
        (_a = state.buffer) === null || _a === void 0 ? void 0 : _a.push(chunk);
        state.bytes += chunk.length;
        if (state.bytes || 0 >= state.maxBytes)
            _peek(this, callback);
        else
            callback();
    };
    BufferPeekStream.prototype._flush = function (callback) {
        if (this._peekState.peeked)
            callback();
        else
            _peek(this, callback);
    };
    return BufferPeekStream;
}(stream_1.default.Transform));
exports.BufferPeekStream = BufferPeekStream;
function _peek(stream, callback) {
    var state = stream._peekState;
    if (!state.buffer)
        return;
    var buffer = Buffer.concat(state.buffer);
    stream.emit("peek", buffer.slice(0, state.maxBytes));
    stream.push(buffer);
    state.buffer = null;
    state.bytes = null;
    state.peeked = true;
    stream._transform = function (chunk, _enc, callback) {
        this.push(chunk);
        callback();
    };
    callback();
}
function peek(source, bytes, callback) {
    if (!callback)
        return peek(source, undefined, bytes);
    var dest = new BufferPeekStream({ peekBytes: bytes });
    dest.once("peek", function (buffer) {
        callback(null, buffer, dest);
    });
    return source.pipe(dest);
}
function promise(source, bytes) {
    return new Promise(function (resolve, reject) {
        peek(source, bytes, function (err, buffer, dest) {
            if (err)
                return reject(err);
            resolve([buffer, dest]);
        });
    });
}
exports.promise = promise;
peek.BufferPeekStream = BufferPeekStream;
peek.promise = promise;
exports.default = peek;
//# sourceMappingURL=buffer-peek-stream.js.map