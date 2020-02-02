# node-buffer-peek-stream

[![Build Status](https://travis-ci.org/seangarner/node-buffer-peek-stream.svg?branch=master)](https://travis-ci.org/seangarner/node-buffer-peek-stream)

Take a peek at the start of a stream and get back a new stream rewound from the start without
buffering the entire stream.  Useful when you need to inspect the start of the stream before
deciding what to do with the stream.

```
npm install buffer-peek-stream
```

Useful if you want to inspect the start of a stream before deciding what to do with it.

This works with buffers and does no string decoding.  If you know you have a string and already
know its encoding then checkout [peek-stream](https://github.com/mafintosh/peek-stream).


## Usage
As a promise (with await)...
```
const peek = require('buffer-peek-stream').promise;
const readstream = fs.createReadStream('package.json');

const [data, outputStream] = await peek(readstream, 65536);

// outputStream is ready to be piped somewhere else
outputStream.pipe(somewhere_else);
```

As a callback...
```
var peek = require('buffer-peek-stream');
var readstream = fs.createReadStream('package.json');

peek(readstream, 65536, function (err, data, outputStream) {
  if (err) throw err;

  // outputStream is ready to be piped somewhere else
  outputStream.pipe(somewhere_else);
});
```

As a stream...
```
var PeekStream = require('buffer-peek-stream').BufferPeekStream;

var peek = new PeekStream(65536);
var readstream = fs.createReadStream('package.json');

// peek will only emit the peek event once
peek.once('peek', function (buf) {

  // readstream is ready to be piped somewhere else
  peek.pipe(somewhere_else);
});

readstream.pipe(peek);

// alternatively pipe `peek` here instead of in `data` callback
```


## Licence
MIT
