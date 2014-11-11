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

  if (this.__src._readableState.ended) {
    // if the source has ended then we need to modify its state so it'll start flowing again when we
    // unshift the data back on.  these settings were naively obtained by creating a file read
    // stream of a tiny file then leaving it hang for a timeout of 5s and dumping the state
    this.__src.readable = true;
    this.__src._readableState.ended = false;
    this.__src._readableState.endEmitted = false;
    this.__src._readableState.ranOut = false;
    this.__src._readableState.reading = false;
    this.__src._readableState.calledRead = true;
    this.__src._readableState.sync = false;
    this.__src._readableState.needReadable = false;
    this.__src._readableState.emittedReadable = true;
    this.__src._readableState.readableListening = false;
    this.__src._readableState.readingMore = false;

    // flush before end is called on this stream
    flush.call(this);
  } else {

    // flush once we've emptied this streams buffer through the transform function
    this.once('drain', flush.bind(this));
  }

  function flush() {
    var buffer = Buffer.concat(this.__buffer);

    // push exactly the number of bytes we wanted to peek
    this.push(buffer.slice(0, this.__peekBytes));

    // put the whole buffer back onto the start of the origin stream
    this.__src.unshift(buffer);
    this.__src = null;
    this.__buffer = null;

    this.push(null);
  }
};