const { Transform } = require('stream')

// The default method for converting a chunk to a stack of records
const DEFAULT_CHUNK_TO_STACK = (chunk, callback) => callback(chunk)

class RateLimitTransformer extends Transform {
  /**
   * Creates a Transform stream that pushes a stack of records downstream
   * one record at a time at the specified interval.  A `chunkToStack` callback
   * is provided to convert each chunk into a stack of records.
   *
   * @param {object} opts = {}
   * @param {function} [opts.chunkToStack] - Converts a chunk into a stack of records.
   * @param {number} opts.interval - Number of milliseconds between pushing each record.
   */
  constructor (opts = {}) {
    super({ objectMode: true })

    if (typeof opts.interval !== 'number' || opts.interval < 0) {
      throw new Error('Option `interval` must be a positive number, got: ' + opts.interval)
    }

    this._opts = {}
    this._opts.chunkToStack = opts.chunkToStack || DEFAULT_CHUNK_TO_STACK
    this._opts.interval = opts.interval

    this._start = this._start.bind(this)
  }

  /**
   * Process the stack, sending each record downstream one a time.
   *
   * @param {function} callback - Called when the stack has finished processing.
   * @private
   */
  _start (callback) {
    this._timer = setInterval(() => {
      // stack is empty, stop and signal chunk is done
      if (!this._stack.length) {
        this._stop()
        return callback()
      }

      const record = this._stack.shift()

      // push downstream, respect backpressure
      if (!this.push(record)) {
        this._stop()
        this.once('drain', () => this._start(callback))
      }
    }, this._opts.interval)
  }

  /**
   * Clears the stack processing timer.
   * @private
   */
  _stop () {
    clearInterval(this._timer)
    this._timer = null
  }

  /**
   * Recursively waits for the interval timer to clear and stack to empty.
   * Calls the callback when done.
   *
   * @param {function} callback
   * @private
   */
  _waitForCompletion (callback) {
    const timeout = 20 * (this._stack.length || 1)

    setTimeout(() => {
      if (!this._timer && this._stack.length === 0) return callback()

      this._waitForCompletion(callback)
    }, timeout)
  }

  _transform (chunk, enc, callback) {
    this._opts.chunkToStack(chunk, stack => {
      this._stack = [].concat(stack)
    })

    this._start(callback)
  }

  _flush (callback) {
    this._waitForCompletion(callback)
  }
}

module.exports = RateLimitTransformer
