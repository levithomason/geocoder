const request = require('./request')

/**
 * A simple Google Maps Geocoding API wrapper.
 */
class Geocoder {
  /**
   * @param {string} apiKey - A Google Maps API key
   */
  constructor (apiKey) {
    if (!apiKey) throw new Error('`apiKey` is required.')

    this._apiKey = apiKey
  }

  /**
   * Geocode a street address.
   *
   * @param {string} address - The street address to be geocoded.
   * @returns {Promise}
   */
  json (address) {
    return Promise.resolve().then(() => {
      if (typeof address !== 'string') throw new Error('`address` must be a string')

      return request.get({
        protocol: 'https:',
        hostname: 'maps.googleapis.com',
        path: '/maps/api/geocode/json',
        params: { address, key: this._apiKey }
      })
    })
  }
}

module.exports = Geocoder
