import { expect } from 'chai'
import { DelegableProxy } from '../src/DelegableProxy'

// actual test data
const myset = [
  {'foo': 'bar'},
  {'foo2': 'bar2'},
  {'ultimate': [{
      'id': 1,
      'pew': 'POW',
      'pow?': 'PHEW!'
    }, {
      'id': 2,
      'pew': 'POW',
      'pow?': 'PHEW!'
    }
  ]}
]
const dummy = function cb(action, sender) {}

describe('Basic operations', () => {
  it('should wire the test set', () => {
    const proxied = new DelegableProxy(myset, dummy)
    expect(myset).to.deep.equal(proxied)

    proxied.push({'barfoo': 'yeap'})
    expect(myset).to.not.deep.equal(proxied)
  })
  it('should notify delegate properly after pushing new', (done) => {
    const delegate = function cb(action, sender) {
      expect(action).to.be.a('string')
      expect(action).to.equal('add')
      expect(sender).to.equal(3)
      done()
    }
    const proxied = new DelegableProxy(myset, delegate)
    proxied.push({'barfoo': 'yeap'})
  })
  it('should notify delegate properly after altering an entry', (done) => {
    const delegate = function cb(action, sender) {
      expect(action).to.be.a('string')
      expect(action).to.equal('mod')
      expect(sender).to.equal(2)
      done()
    }
    const proxied = new DelegableProxy(myset, delegate)
    proxied[2].ultimate[0].pew = 'POW!'
  })
  it('should notify delegate properly after deleting an entry', (done) => {
    const delegate = function cb(action, sender) {
      expect(action).to.be.a('string')
      expect(action).to.equal('del')
      expect(sender).to.equal(3)
      done()
    }
    const proxied = new DelegableProxy(myset, delegate)
    delete proxied[3]
  })
})
