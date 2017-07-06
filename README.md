# geocoder

An example streaming geocoder.

# Design goals

- [x] Dependency free
- [x] Respect Google Maps Geocoding API rate limiting (50 requests per minute)
- [x] Capable of handling several million addresses
- [x] Filter only single non-partial results with "ROOFTOP" quality

![demo](http://g.recordit.co/bM0RDKuZJp.gif)

## Project Requirements

This project was built using [node][1] v8.1.2.

## Try it

Using my test API key:

```
$ npm run geocode
```

Using your own api key (see [Google Maps Geocoding API][2]):

```
$ GOOGLE_MAPS_GEOCODING_API_KEY=<your-key> npm start
```

## Approach

Compose small specialized stream transforms for each step of the process.  See `index.js`.

### 1. Read Stream
Standard node read stream, streams `/data/address_list.csv`.

### 2. CSV Transform
Byte buffer in, array of CSV rows out.

### 3. Rate Limit Transform
Sends records down stream at the specified rate.  Optional callback converts a chunk to a stack of records.

### 4. Geocode Transform
Addresses in, geocoded objects out.  Handles address strings or objects with an address key.

### 5. Filter Transform
Geocode results in, limited results out.  Meets the criteria specified in the design requirements.

>Not all the required criteria were available at the API level.  A local filter was required. 

## Development

Install dependencies, run tests, hack on `/src` and `/test`: 

```
$ npm i
$ npm run test:watch
```

You can also run tests as a one-off: `npm test`.

[1]: https://nodejs.org
[2]: https://developers.google.com/maps/documentation/geocoding

