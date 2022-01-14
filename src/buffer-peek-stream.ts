import { ReadStream } from "fs";
import stream, { TransformCallback, TransformOptions } from "stream";

interface IOpts extends TransformOptions {
  peekBytes?: number;
}

export class BufferPeekStream extends stream.Transform {
  _peekState: {
    buffer: Array<any> | null;
    bytes: number | null;
    maxBytes: number;
    peeked: boolean;
  };

  constructor(opts?: IOpts) {
    if (!opts) opts = {};

    super(opts);

    opts.highWaterMark = opts.peekBytes || 65536;

    stream.Transform.call(this, opts);

    this._peekState = {
      buffer: [],
      bytes: 0,
      maxBytes: opts.peekBytes || 65536,
      peeked: false,
    };
  }

  _transform(
    chunk: any,
    _encoding: BufferEncoding,
    callback: TransformCallback
  ) {
    const state = this._peekState;

    // buffer incoming chunks until we have enough for our peek
    state.buffer?.push(chunk);
    state.bytes += chunk.length;

    // get more?
    if (state.bytes || 0 >= state.maxBytes) _peek(this, callback);
    else callback();
  }

  _flush(callback: TransformCallback) {
    if (this._peekState.peeked) callback();
    else _peek(this, callback);
  }
}

function _peek(stream: BufferPeekStream, callback: TransformCallback) {
  const state = stream._peekState;

  if (!state.buffer) return;
  const buffer = Buffer.concat(state.buffer);

  // emit exactly the number of bytes we wanted to peek
  stream.emit("peek", buffer.slice(0, state.maxBytes));

  stream.push(buffer);

  state.buffer = null;
  state.bytes = null;
  state.peeked = true;

  stream._transform = function (
    chunk: any,
    _enc: BufferEncoding,
    callback: TransformCallback
  ) {
    this.push(chunk);
    callback();
  };

  callback();
}

function peek(
  source: ReadStream,
  bytes?: number,
  callback?: (err: any, data: Buffer, outputStream: BufferPeekStream) => void
): BufferPeekStream {
  if (!callback) return peek(source, undefined, bytes as any);

  var dest = new BufferPeekStream({ peekBytes: bytes });

  dest.once("peek", function (buffer: Buffer) {
    callback(null, buffer, dest);
  });

  return source.pipe(dest);
}

export function promise(source: ReadStream, bytes: number) {
  return new Promise((resolve, reject) => {
    peek(source, bytes, (err, buffer, dest) => {
      if (err) return reject(err);
      resolve([buffer, dest]);
    });
  });
}

peek.BufferPeekStream = BufferPeekStream;
peek.promise = promise;

export default peek;
