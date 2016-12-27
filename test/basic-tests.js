import { expect } from 'chai'
import fs from 'fs'
import DelegableProxy from '../src/DelegableProxy'

// noop handler
const dummy = function cb(action, sender) {}

describe('Basic operations', () => {
  let dataset = []

  beforeEach(() => {
    dataset = JSON.parse(fs.readFileSync('./test/data/dataset1.json'))
  })

  it('should wire the test set', () => {
    const proxied = DelegableProxy.wire(dataset, dummy)
    expect(dataset).to.deep.equal(proxied)
  })
  it('should notify delegate properly after pushing new', (done) => {
    const delegate = function cb(action, sender) {
      expect(action).to.be.a('string')
      expect(action).to.equal('add')
      expect(sender).to.equal(3)
      done()
    }
    const proxied = DelegableProxy.wire(dataset, delegate)
    proxied.push({'barfoo': 'yeap'})
  })
  it('should notify delegate properly after altering an entry', (done) => {
    const delegate = function cb(action, sender) {
      expect(action).to.be.a('string')
      expect(action).to.equal('mod')
      expect(sender).to.equal(2)
      done()
    }
    const proxied = DelegableProxy.wire(dataset, delegate)
    proxied[2].ultimate[0].pew = 'POW!'
  })
  it('should notify delegate properly after deleting an entry', (done) => {
    const delegate = function cb(action, sender) {
      expect(action).to.be.a('string')
      expect(action).to.equal('del')
      expect(sender).to.equal(3)
      done()
    }
    const proxied = DelegableProxy.wire(dataset, delegate)
    delete proxied[3]
  })
})
