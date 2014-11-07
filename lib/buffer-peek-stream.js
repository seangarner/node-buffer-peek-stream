var stream = require('stream');
var util = require('util');

function BufferPeekStream(bytes) {
  stream.Transform.call(this);
  this.__buffer = [];
  this.__bufferLength = 0;
  this.__peekBytes = bytes || 65536;
  this.__peeking = true;
  this.__src = null;
  var self = this;

  // when we get piped to store the parent so we can unshift what we've peeked
  this.once('pipe', function (src) {
    self.__src = src;

    // inherit upstream encoding because sniffing seems to wipe out iconv-lite conversion
    // ideally would like this not to happen as guessing it's an overhead though small since we're
    // just peaking small amounts of data
    if (src._readableState.encoding) self.setEncoding(src._readableState.encoding);

    self.once('pipe', function () {
      self.emit('error', new Error('BufferPeekStream can only be piped to once'));
    });
  });
}

util.inherits(BufferPeekStream, stream.Transform);
module.exports = BufferPeekStream;


BufferPeekStream.prototype._transform = function _transform(chunk, enc, callback) {
  // buffer incoming chunks until we have enough for our peek
  this.__buffer.push(chunk);
  this.__bufferLength += chunk.length;

  // buffered enough
  if (this.__bufferLength > this.__peekBytes) this.__stopPeeking();

  callback();
};


BufferPeekStream.prototype._flush = function _flush(callback) {
  this.__stopPeeking();
  callback();
};


BufferPeekStream.prototype.__stopPeeking = function __stopPeeking() {
  // don't want to run this again if we get subsequent calls before drain
  if (!this.__peeking) return;

  this.__peeking = false;

  // unpipe from upstream
  this.__src.unpipe(this);

  //TODO: find out if this stream can still get data after unpiping under any circumstance 

  var buffer = Buffer.concat(this.__buffer);
  var source = this.__src;

  // push exactly the number of bytes we wanted to peek
  this.push(buffer.slice(0, this.__peekBytes));
  this.push(null);

  if (source._readableState.ended) {
    // if the source has ended then we need to modify its state so it'll start flowing again when we
    // unshift the data back on.  these settings were naively obtained by creating a file read
    // stream of a tiny file then leaving it hang for a timeout of 5s and dumping the state
    source.readable = true;
    source._readableState.ended = true;
    source._readableState.endEmitted = false;
    source._readableState.ranOut = false;
    source._readableState.reading = false;
    source._readableState.calledRead = true;
    source._readableState.sync = false;
    source._readableState.needReadable = false;
    source._readableState.emittedReadable = true;
    source._readableState.readableListening = false;
    source._readableState.readingMore = false;
  }

  source.unshift(buffer);

  // we don't need to keep the original buffers
  this.__buffer = null;
};