import { expect } from 'chai'
import fs from 'fs'
import DelegableProxy from '../src/DelegableProxy'

// noop handler
const dummy = function cb(action, sender) {}

describe('Nested tests', () => {
  let dataset = []

  beforeEach(() => {
    dataset = JSON.parse(fs.readFileSync('./test/data/dataset3.json'))
  })

  it('should notify delegate properly after pushing on a simple array', done => {
    const delegate = function cb(action, sender) {
      expect(action).to.be.a('string')
      expect(action).to.equal('add')
      expect(sender).to.equal(2)
      done()
    }
    const proxied = DelegableProxy.wire(['a', 'b'], delegate)
    proxied.push('c')
  })

  it('should notify delegate properly after altering a nested array', done => {
    const delegate = function cb(action, sender) {
      expect(action).to.be.a('string')
      expect(action).to.equal('mod')
      expect(sender).to.equal(1)
      done()
    }
    const proxied = DelegableProxy.wire(dataset, delegate)
    proxied[1].vines[0].regions.push('classico')
  })

  it('should notify delegate properly after deleting from a nested array', done => {
    let doneCounter = 0
    const delegate = function cb(action, sender) {
      // due to the behaviour of splice
      if (doneCounter === 0) {
        expect(action).to.be.a('string')
        expect(action).to.equal('mod')
        expect(sender).to.equal(1)
        doneCounter++
      } else {
        expect(action).to.be.a('string')
        expect(action).to.equal('mod')
        expect(sender).to.equal(1)
        done()
      }
    }
    const proxied = DelegableProxy.wire(dataset, delegate)
    // cuts out 'bianco', remaining item should be 'riserva'
    proxied[1].vines[0].regions.splice(0, 1)
  }).timeout(1000)
})
