var BufferPeekStream = require('./buffer-peek-stream');

module.exports = peek;

peek.Constructor = BufferPeekStream;

function peek(input, bytes, cb) {
  if (typeof bytes === 'function') {
    cb = bytes;
    bytes = 16384; // 16K
  }

  // make sure we don't callback more than once
  cb = once(cb);

  var _ = new BufferPeekStream(bytes);

  var data;

  _.once('data', function (d) {
    data = d;
  });

  _.once('end', function () {
    cb(null, data);
  });

  _.once('error', cb);

  input.pipe(_);
}

function once(fn) {
  var _fired = false;
  return function () {
    if (_fired) return;
    _fired = true;
    fn.apply(this, Array.prototype.splice.call(arguments, 0));
  };
}