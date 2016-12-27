import { expect } from 'chai'
import fs from 'fs'
import DelegableProxy from '../src/DelegableProxy'


// noop handler
const dummy = function cb(action, sender) {}

describe('Cloning tests', () => {
  let dataset = []

  beforeEach(() => {
    dataset = JSON.parse(fs.readFileSync('./test/data/dataset1.json'))
  })

  it('should not clone the object, references remain the same', () => {
    const proxied = DelegableProxy.wire(dataset, dummy)
    expect(dataset).to.deep.equal(proxied)

    proxied.push({'barfoo': 'yeap'})
    expect(dataset).to.deep.equal(proxied)
  })
  it('should clone the object', () => {
    const proxied = DelegableProxy.wire(dataset, dummy, true)
    expect(dataset).to.deep.equal(proxied)

    proxied.push({'barfoo': 'yeap'})
    expect(dataset).to.not.deep.equal(proxied)
  })
})
