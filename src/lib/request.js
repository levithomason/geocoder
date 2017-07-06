// Heads Up!
//
// This is a minimal and naive request wrapper.  It assumes JSON and is intended
// only for this sample project.  It is added as an abstraction for future extension.

const https = require('https')
const http = require('http')
const querystring = require('querystring')

/**
 * Returns the right client for a given protocol.
 * @param {string} protocol
 * @returns {object}
 */
const getClient = protocol => protocol === 'https:' ? https : http

/**
 * Parses our options API into an http(s) `client` and associated `options`.
 *
 * @param {object} opts -
 * @returns {{ client, options: { hostname: <string>, path: <string> } }}
 */
const parseOpts = opts => {
  const { protocol, hostname, params } = opts
  let { path } = opts

  if (params) path += '?' + querystring.stringify(params)

  return {
    client: getClient(protocol),
    options: { hostname, path }
  }
}

/**
 * Makes an http(s) request with the given client and options.
 *
 * @param {object} client - The request client.
 * @param {object} options - The request options.
 * @returns {Promise}
 */
const makeRequest = (client, options) => new Promise((resolve, reject) => {
  const req = client.request(options, (res) => {
    let buffer = ''

    res.setEncoding('utf8')
    res.on('data', chunk => (buffer += chunk))
    res.on('end', () => {
      try {
        resolve({ data: JSON.parse(buffer) })
      } catch (err) {
        reject(err)
      }
    })
  })

  req.on('error', reject)
  req.end()
})

exports.get = (opts) => {
  const { client, options } = parseOpts(opts)
  options.method = 'GET'

  return makeRequest(client, options)
}
