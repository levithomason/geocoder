const { Transform } = require('stream')
const Geocoder = require('./Geocoder')

class GeocodeTransformer extends Transform {
  /**
   * Creates a Transform stream that geocodes incoming addresses using the
   * Google Maps API.
   *
   * @param {object} opts = {}
   * @param {string} opts.apiKey - A Google Maps API key.
   */
  constructor (opts = {}) {
    super({ objectMode: true })

    if (typeof opts.apiKey !== 'string') {
      throw new Error('Option `apiKey` is required, got: ' + opts.apiKey)
    }

    this._geocoder = new Geocoder(opts.apiKey)
  }

  _transform (chunk, enc, callback) {
    const address = typeof chunk === 'string'
      ? chunk
      : chunk.address || chunk.Address || chunk.ADDRESS

    this._geocoder.json(address)
      .then(res => callback(null, res.data))
      .catch(err => callback(err, null))
  }
}

module.exports = GeocodeTransformer
