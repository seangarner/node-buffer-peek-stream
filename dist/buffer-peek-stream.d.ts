/// <reference types="node" />
import { ReadStream } from "fs";
import stream, { TransformCallback, TransformOptions } from "stream";
interface IOpts extends TransformOptions {
    peekBytes?: number;
}
export declare class BufferPeekStream extends stream.Transform {
    _peekState: {
        buffer: Array<any> | null;
        bytes: number | null;
        maxBytes: number;
        peeked: boolean;
    };
    constructor(opts?: IOpts);
    _transform(chunk: any, _encoding: BufferEncoding, callback: TransformCallback): void;
    _flush(callback: TransformCallback): void;
}
declare function peek(source: ReadStream, bytes?: number, callback?: (err: any, data: Buffer, outputStream: BufferPeekStream) => void): BufferPeekStream;
declare namespace peek {
    var BufferPeekStream: typeof import("./buffer-peek-stream").BufferPeekStream;
    var promise: typeof import("./buffer-peek-stream").promise;
}
export declare function promise(source: ReadStream, bytes: number): Promise<unknown>;
export default peek;
