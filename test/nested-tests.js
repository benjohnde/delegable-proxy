import { expect } from 'chai'
import fs from 'fs'
import DelegableProxy from '../src/DelegableProxy'

// noop handler
const dummy = function cb(action, sender) {}

describe('Nested tests', () => {
  let dataset = [
    {coffees: []},
    {vines: [
      {
        name: 'Merlot',
        regions: ['bianco', 'riserva']
      }
    ]},
    {waters: []}
  ]
  it('should notify delegate properly after pushing on a simple array', done => {
    const delegate = function cb(action, sender) {
      expect(action).to.be.a('string')
      expect(action).to.equal('add')
      expect(sender).to.equal(2)
      done()
    }
    const proxied = DelegableProxy.wire(['ben', 'thorsten'], delegate)
    proxied.push('guido')
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
})
