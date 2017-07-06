const CSVTransformer = require('../../../src/lib/CSVTransformer')
const { Readable, Transform } = require('stream')

const assertTransform = (input, expected, opts = {}) => new Promise((resolve, reject) => {
  const csv = new CSVTransformer(opts)

  let buffer = []
  csv.on('data', data => (buffer = [...buffer, ...data]))

  csv.on('end', () => {
    try {
      buffer.should.deep.equal(expected)
      resolve()
    } catch (err) {
      reject(err)
    }
  })

  const rs = new Readable()
  rs.pipe(csv)
  rs.push(input)
  rs.push(null)
})

describe('CSVTransformer', () => {
  it('extends stream.Transform', () => {
    expect(CSVTransformer).to.be.a('function')
    new CSVTransformer().should.be.an.instanceOf(Transform)
  })

  it('creates a row for every \\n', () => {
    return assertTransform('row1\nrow2', [['row1'], ['row2']])
  })

  it('creates a row for every \\r\\n', () => {
    return assertTransform('row1\r\nrow2', [['row1'], ['row2']])
  })

  it('creates a column for every comma', () => {
    return assertTransform('col1,col2\ncol3,col4', [['col1', 'col2'], ['col3', 'col4']])
  })

  it('handles a newline at EOF', () => {
    return assertTransform('row1\nrow2\n', [['row1'], ['row2']])
  })

  it('handles receiving partial row chunks', () => {
    const spy = sandbox.spy()
    const csv = new CSVTransformer()

    csv.on('data', spy)

    // no call for partial row data
    csv.write('this,is,')
    csv.write('a,part')
    csv.write('ial,row')

    spy.should.have.not.been.called()

    // called exactly once with a fully completed row of data
    csv.write('\n')
    spy.should.have.been.calledOnce()
    spy.firstCall.args[0].should.deep.equal([['this', 'is', 'a', 'partial', 'row']])
  })

  describe('without headers', () => {
    it('creates a 2d array of rows and columns', () => {
      return assertTransform('a1,b1\na2,b2', [['a1', 'b1'], ['a2', 'b2']])
    })
  })

  describe('with headers', () => {
    it('creates an array of objects', () => {
      const opts = { hasHeaders: true }
      const input = 'h1,h2\na1,b1\na2,b2'
      const expected = [{ h1: 'a1', h2: 'b1' }, { h1: 'a2', h2: 'b2' }]

      return assertTransform(input, expected, opts)
    })
  })
})
