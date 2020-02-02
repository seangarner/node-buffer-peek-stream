var fs = require('fs');
var expect = require('chai').expect;
var RandStream = require('randstream');
var TruncateStream = require('truncate-stream');
var DevNullStream = require('dev-null-stream');
var concat = require('concat-stream');
var http = require('http');

var peek = require('./buffer-peek-stream');


function make(size, mode) {
  return (new RandStream({mode: mode || 'pseudo'})).pipe(new TruncateStream({maxBytes: size}));
}

describe('peek', function() {
  this.timeout(250);

  it('should callback with a buffer', function (done) {
    var source = make(50000);
    peek(source, 50000, function (err, buffer) {
      if (err) return done(err);
      expect(buffer).to.be.an.instanceof(Buffer);
      done();
    }).pipe(new DevNullStream());
  });

  it('should callback with exactly the number of bytes requested', function (done) {
    peek(make(50000), 1000, function (err, buffer) {
      if (err) return done(err);
      expect(buffer).to.have.lengthOf(1000);
      done();
    });
  });

  it('should callback with all bytes when peeking more than is available', function (done) {
    peek(make(1000), 5000, function (err, buffer) {
      if (err) return done(err);
      expect(buffer).to.have.lengthOf(1000);
      done();
    });
  });

  it('should callback with a stream which receives all bytes', function (done) {
    var source = make(50000);
    peek(source, 1000, function (err, buffer, stream) {
      if (err) return done(err);
      stream.pipe(concat(function (data) {
        expect(data).to.have.lengthOf(50000);
        done();
      }));
    });
  });

  it('should return a stream which receives all bytes', function (done) {
    peek(make(5000), 1000, function () {}).pipe(concat(function (data) {
      expect(data).to.have.lengthOf(5000);
      done();
    }));
  });

  it('should return the same stream as it calls back', function (done) {
    var res = peek(make(5000), 1000, function (err, buffer, stream) {
      if (err) return done(err);
      expect(stream).to.equal(res);
      done();
    });
  });

  it('should peek 65536 bytes by default', function (done) {
    peek(make(100000), function (err, buffer) {
      if (err) return done(err);
      expect(buffer).to.have.lengthOf(65536);
      done();
    });
  });

  it('should work when peeked more once in a pipeline', function (done) {
    peek(make(100000), 50000, function (err, first, stream) {
      if (err) return done(err);
      expect(first).to.have.lengthOf(50000);
      peek(stream, 40000, function (err, second, stream) {
        if (err) return done(err);
        expect(second).to.have.lengthOf(40000);
        expect(second).to.eql(first.slice(0, 40000));
        stream.pipe(concat(function (data) {
          expect(data).to.have.lengthOf(100000);
          expect(first).to.eql(data.slice(0, 50000));
          expect(second).to.eql(data.slice(0, 40000));
          done();
        }));
      });
    });
  });

  describe('promise', () => {
    it('should return a promise which resolves a tuple with buffer & forward stream', (done) => {
      const promise = peek.promise(make(50000), 1000);
      promise.then(([buffer, stream]) => {
        expect(buffer).to.be.an.instanceof(Buffer);
        expect(buffer).to.have.lengthOf(1000);
        stream.pipe(concat((data) => {
          expect(data).to.have.lengthOf(50000);
          done();
        }));
      });
    });
  });

  //TODO: peeking inside gzip data (transform)

  this.timeout(10000);
  it('should peek an IncomingMessage stream', (done) => {


    http.get('http://nodejs.org/dist/index.json', (res) => {
      const statusCode = res.statusCode;

      if (statusCode !== 200) {
        return done(new Error(`Request Failed [${statusCode}]`));
      }

      peek(res, 1000, function (err, data, stream) {
        if (err) return done(err);
        const index_json = data.toString();
        expect(index_json).to.have.string('"version"');
        stream.resume();
        done();
      });

    });
  });
});
