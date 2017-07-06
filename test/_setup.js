const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const dirtyChai = require('dirty-chai')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')

// Chai
// ----------------------------------------
global.expect = chai.expect
chai.should()
chai.use(chaiAsPromised)
chai.use(dirtyChai)
chai.use(sinonChai)

// Sinon
// ----------------------------------------
global.sinon = sinon
global.sandbox = sinon.sandbox.create()

// restore all spies/mocks/stubs before each test
beforeEach(() => {
  global.sandbox.restore()
})
