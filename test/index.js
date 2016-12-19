import { expect } from 'chai'
import { DelegableProxy } from '../src/DelegableProxy'


// actual test set
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

function traverse(o) {
  if (typeof o !== 'object') {
    return
  }

  const isProxy = (o instanceof Proxy) // dont work
  console.log('isProxy', isProxy)

  for (var k in o) {
    console.log('key', k)
    console.log('object', o)
    traverse(o[k])
  }
}

// TODO need to work with WeakSet
// traverse(mysetProxy)

describe('bla', () => {
  it('Should blub', (done) => {
    let actual = false
    const WHOOPERINIO = function cb(action, sender) {
      console.log('smells like someone just whooped')
      actual = true
    }
    const mysetProxy = new DelegableProxy(myset, WHOOPERINIO)
    mysetProxy.push({'barfoo': 'yeap'})

    setTimeout(() => {
      expect(actual).to.be.true
      done()
    }, 10)
  })
})
