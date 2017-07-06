const https = require('https')
const Geocoder = require('../../../src/lib/Geocoder')

describe('Geocoder', () => {
  it('is a function', () => {
    expect(Geocoder).to.be.a('function')
  })

  it('throws if not passed a string', () => {
    const misuse = () => new Geocoder()
    expect(misuse).to.throw('`apiKey` is required')
  })

  describe('json', () => {
    beforeEach(() => {
      sandbox.stub(https, 'request').callsFake((opts, cb) => {
        cb({                              // eslint-disable-line
          setEncoding () {},
          on (evt, cb) {
            if (evt === 'data') cb('{}')  // eslint-disable-line
            if (evt === 'end') cb()
          }
        })

        return { on () {}, end () {} }
      })
    })

    it('returns a promise', () => {
      const geocoder = new Geocoder('api-key')
      geocoder.json('address').should.be.a('promise')
    })

    it('rejects if address is not a string', () => {
      const geocoder = new Geocoder('my-api-key')
      return expect(geocoder.json(null)).to.eventually.be.rejectedWith('`address` must be a string')
    })

    it('makes an https request to the google maps api with address and apiKey', () => {
      const geocoder = new Geocoder('api-key')

      return geocoder.json('123 Main').then(() => {
        https.request.should.have.been.calledWithMatch({
          hostname: 'maps.googleapis.com',
          path: '/maps/api/geocode/json?address=123%20Main&key=api-key'
        })
      })
    })
  })
})
