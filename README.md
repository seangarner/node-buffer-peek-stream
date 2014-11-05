# node-buffer-peek-stream

A Transform stream which lets you take a peek at the first bytes before unpiping itself and unshifting the buffer back onto the upstream stream leaving the original stream ready to be
piped again onto its final destination.

```
npm install buffer-peek-stream
```

Useful if you want to inspect the start of a stream before deciding what to do with it.

This works with buffers and does no string decoding.  If you know you have a string and already
know its encoding then checkout [peek-stream](https://github.com/mafintosh/peek-stream).


## Usage
As a function...
```
var peek = require('./buffer-peek-stream');
var readstream = fs.createReadStream('package.json');

peek(readstream, 65536, function (err, data) {
  if (err) throw err;

  // readstream is ready to be piped somewhere else
  readstream.pipe(somewhere_else);
});
```

As a stream...
```
var PeekStream = require('./buffer-peek-stream').Constructor;

var peek = new PeekStream(65536);
var readstream = fs.createReadStream('package.json');

// peek will only emit the data event once
peek.once('data', function (buf) {

  // readstream is ready to be piped somewhere else
  readstream.pipe(somewhere_else);
});

stream.pipe(peek);
```


## NOTICE
This hasn't been run in production yet and hasn't gone through substantial testing.  The approach
taken to unshift data back onto the origin stream in particular could turn out to be a bad idea when
you try to peek at more bytes than are in the stream.


## Licence
MIT