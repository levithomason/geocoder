const { Transform } = require('stream')

/**
 * Heads Up!
 *
 * This is a naive CSV transformer intended to work with the example data.
 * A more robust example must account for real-world CSVs and edge cases.
 */
class CSVTransformer extends Transform {
  /**
   * Creates a Transform stream that converts a CSV string into an array of rows.
   *
   * @param {object} [opts = {}]
   * @param {object} [opts.hasHeaders=false] - Whether or not the CSV has a header row.
   * @param {object} [opts.delimiter=','] - The string used to split a row into columns.
   * @param {object} [opts.rowDelimiter=/\r?\n/] - The regex used to split rows.
   */
  constructor (opts = {}) {
    super({ objectMode: true })

    this._opts = {}
    this._opts.hasHeaders = opts.hasHeaders || false
    this._opts.delimiter = opts.delimiter || ','
    this._opts.rowDelimiter = opts.rowDelimiter || /\r?\n/

    this._buffer = ''     // buffer partial rows until they are completed
    this._headers = null  // persist CSV headers for making objects from each row

    // matches delimiters not inside quotes
    this._columnDelimiter = new RegExp(`(?!\\B"[^"]*)${this._opts.delimiter}(?![^"]*"\\B)`)

    // matches anything wrapped in (optional) quotes
    this._stripQuotesRegExp = /^(?:")?(.*?)(?:")?$/

    this._parseChunk = this._parseChunk.bind(this)
    this._parseRow = this._parseRow.bind(this)
    this._parseColumn = this._parseColumn.bind(this)
    this._columnsToObject = this._columnsToObject.bind(this)
  }

  /**
   * Parses a raw CSV buffer chunk into an array of row strings.
   * Handles receiving partial row data by buffering chunks until splitting
   * on the rowDelimiter produces complete rows.
   *
   * @param {Buffer} chunk
   * @returns {string[]}
   * @private
   */
  _parseChunk (chunk) {
    const rows = (this._buffer + chunk).split(this._opts.rowDelimiter)
    this._buffer = rows.pop()
    return rows
  }

  /**
   * Parses a single CSV row string into an array of column strings.
   *
   * @param {string} row
   * @returns {string[]|object[]}
   * @private
   */
  _parseRow (row) {
    return row.split(this._columnDelimiter).map(this._parseColumn)
  }

  /**
   * Parses a single CSV column string into a value.
   *
   * @param {string} column
   * @returns {string}
   * @private
   */
  _parseColumn (column) {
    return this._stripQuotesRegExp.exec(column)[1]
  }

  /**
   * Converts an array of column values into a object according to this.headers.
   * Objects are of the shape `{ headerA: columnA, headerB: columnB }`.
   *
   * @param {string[]} columns
   * @returns {object}
   * @private
   */
  _columnsToObject (columns) {
    return this._headers.reduce((row, header, i) => {
      row[header] = columns[i]
      return row
    }, {})
  }

  _transform (chunk, enc, callback) {
    let rows = this._parseChunk(chunk).map(this._parseRow)

    // Consume the first row as headers.
    // Convert subsequent rows to objects.
    if (this._opts.hasHeaders) {
      if (!this._headers) this._headers = rows.shift()

      rows = rows.map(this._columnsToObject)
    }

    // If we haven't received enough data to make rows then wait for more data.
    if (!rows.length) return callback()

    // This chunk produced some rows, send them downstream!
    callback(null, rows)
  }

  _flush (callback) {
    // The buffer always contains the last row of the last chunk.
    // If there was a newline at EOF the buffer will be "", otherwise,
    // the buffer will contain the last row of data and we need to parse it.

    // buffer is empty, we're done
    if (this._buffer === '') return callback()

    // buffer has data, parse and push it
    let row = this._parseRow(this._buffer)

    if (this._opts.hasHeaders) row = this._columnsToObject(row)

    callback(null, [row])
  }
}

module.exports = CSVTransformer
