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
    const proxied = DelegableProxy.wire(myset, dummy)
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
    const proxied = DelegableProxy.wire(myset, delegate)
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
    const proxied = DelegableProxy.wire(myset, delegate)
    delete proxied[3]
  })
  it('bigger example', () => {
    const myset2 = myset.concat(myset).concat(myset).concat(myset)
    const myset3 = JSON.parse(JSON.stringify(myset2))
    myset2.push(myset3)
    const myset4 = myset2.concat(myset2).concat(myset2).concat(myset2)
    const myset5 = JSON.parse(JSON.stringify(myset4))
    myset4.push(myset5)
    const myset6 = myset4.concat(myset4).concat(myset4).concat(myset4)
    const myset7 = JSON.parse(JSON.stringify(myset6))
    myset6.push(myset7)
    const finalSet = JSON.parse(JSON.stringify(myset6))
    const proxied = DelegableProxy.wire(finalSet, dummy)
    expect(finalSet).to.deep.equal(proxied)
  })
})
