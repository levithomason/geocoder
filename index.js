const fs = require('fs')
const { Transform } = require('stream')

const CSVTransformer = require('./src/lib/CSVTransformer')
const GeocodeTransformer = require('./src/lib/GeocodeTransformer')
const RateLimitTransformer = require('./src/lib/RateLimitTransformer')

// ----------------------------------------
// API Key
// ----------------------------------------
const { GOOGLE_MAPS_GEOCODING_API_KEY } = process.env

if (!GOOGLE_MAPS_GEOCODING_API_KEY) {
  throw new Error('Missing GOOGLE_MAPS_GEOCODING_API_KEY environment variable.')
}

// ----------------------------------------
// Stream and Transforms
// ----------------------------------------

const rs = fs.createReadStream('data/address_list.csv')
const csv = new CSVTransformer({ hasHeaders: true })
const rateLimit = new RateLimitTransformer({ interval: 1000 * 60 / 50 })

const log = new Transform({
  objectMode: true,
  transform (chunk, enc, callback) {
    console.log('-'.repeat(60))
    console.log('Address :', chunk.Address)
    callback(null, chunk)
  }
})

const geocode = new GeocodeTransformer({ apiKey: GOOGLE_MAPS_GEOCODING_API_KEY })

const filterResults = new Transform({
  objectMode: true,
  transform (chunk, enc, callback) {
    const [first, ...rest] = chunk.results

    const isSingle = first && !rest.length
    const isPartial = first && first.partial_match
    const isRooftop = first && first.geometry && first.geometry.location_type === 'ROOFTOP'

    if (!isSingle) return callback(console.log('Result  : SKIP not a single match'))
    if (isPartial) return callback(console.log('Result  : SKIP partial match'))
    if (!isRooftop) return callback(console.log('Result  : SKIP not ROOFTOP quality'))

    callback(null, first)
  }
})

// ----------------------------------------
// Run
// ----------------------------------------
rs
  .pipe(csv)
  .pipe(rateLimit)
  .pipe(log)
  .pipe(geocode)
  .pipe(filterResults)
  .on('data', data => {
    console.log('Result  : SUCCESS')
    console.log('Type    :', data.geometry.location_type)
    console.log('Place ID:', data.place_id)
    console.log('Location:', data.geometry.location)
  })
  .on('end', () => {
    console.log('DONE!')
  })
