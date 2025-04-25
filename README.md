# An example of JSON streaming parsing in Node.JS

## What's in this repository

The application is a demo of parsing JSON in a streaming manner.

The application expects the input in the `input.json` file to be formatted as
a JSON array of objects and writes out the result in the same format.

## JSON streaming parser

JS built-in parser (`JSON.parse()`) is not capable of streaming parsing. For this demo I've found `stream-json` library to be suitable. If, however, you have a streaming JSON parser which is dramatically faster, please drop me a line in the issues.

## Speed

The speed achieved on my sample file (not included) looks like:

```
Bytes read: 129302528, at 10.67 MB/s
Bytes written: 128673696, at 10.62 MB/s
Objects read: 4648, at 384 obj/s
Objects written: 4648, at 384 obj/s
```

It's seen that even without any heavy-weight data processing, the speed is already quite
limited. For comparison,
if `JSON.serialize()` is excluded, the speed is about 12 MB/s, while plain
`readFileSync` + `JSON.parse` give me about 42 MB/s. At the same time,
Java Jackson library appears to be capable of parsing around 200 MB/s speed
on a single thread on the same file.

## Limiting and cancellation

Graceful cancellation of streams is quirky.

This demo uses several mechanisms.

- Once `limiterTransform` passes the desired number of output objects,
  it signals end of stream with `push(null)` and stops emitting new objects.
  It drops all further objects received from upstream.
- After that, `pause()` is called on the input stream and parser stream.
  They can't be closed as it would break the pipeline prematurely.
- After that, pipeline has time to push all items past the limiter to the
  JSON writer and output stream.
- Once output stream signals end of stream, `AbortController.abort()` is called
  to terminate the pipeline. All unfinished streams are destroyed abruptly and
  silently.
- `pipeline()` exits with Abort Error, which is then swallowed.
