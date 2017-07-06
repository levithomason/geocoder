const RateLimitTransformer = require('../../../src/lib/RateLimitTransformer')
const { Transform } = require('stream')

describe('RateLimitTransformer', () => {
  it('extends stream.Transform', () => {
    expect(RateLimitTransformer).to.be.a('function')
    new RateLimitTransformer({ interval: 0 }).should.be.an.instanceOf(Transform)
  })

  it('pushes one record at a time downstream', (done) => {
    const input = ['one', 'two', 'three']
    const rateLimit = new RateLimitTransformer({ interval: 0 })

    let chunks = 0
    rateLimit.on('data', data => {
      data.should.equal(input[chunks])
      chunks++
      if (chunks === 3) rateLimit.end()
    })

    rateLimit.on('end', () => {
      chunks.should.equal(3)
      done()
    })

    rateLimit.write(input)
  })

  describe('interval', () => {
    it('throws if missing', () => {
      const misuse = () => new RateLimitTransformer()
      expect(misuse).to.throw('Option `interval` must be a positive number, got: undefined')
    })

    it('throws if not a positive number', () => {
      const misuse = () => new RateLimitTransformer({ interval: -1 })
      expect(misuse).to.throw('Option `interval` must be a positive number, got: -1')
    })

    it('adds at least `interval` milliseconds between pushing records', (done) => {
      const interval = 20
      const rateLimit = new RateLimitTransformer({ interval })

      let lastTime
      let chunks = 0
      rateLimit.on('data', data => {
        const now = Date.now()
        const time = now - lastTime

        expect(time).to.be.gte(
          interval,
          `Chunk received in a shorter interval than specified, data = ${data} time = ${time}ms`
        )

        lastTime = now
        if (++chunks === 3) rateLimit.end()
      })

      rateLimit.on('end', done)

      lastTime = Date.now()
      rateLimit.write(['one', 'two', 'three'])
    })
  })

  describe('chunkToStack', () => {
    it('creates a stack from the chunk', (done) => {
      const input = 'one,two,three'
      const expected = ['one', 'two', 'three']

      const rateLimit = new RateLimitTransformer({
        interval: 0,
        chunkToStack (chunk, callback) {
          callback(chunk.toString().split(','))
        }
      })

      const result = []
      let chunks = 0
      rateLimit.on('data', data => {
        result.push(data)
        if (++chunks === 3) rateLimit.end()
      })

      rateLimit.on('end', () => {
        result.should.deep.equal(expected)
        done()
      })

      rateLimit.write(input)
    })
  })
})
