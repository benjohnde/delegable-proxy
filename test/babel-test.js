import { expect } from 'chai'
import fs from 'fs'
import DelegableProxy from '../index'

// noop handler
const dummy = function cb(action, sender) {}

describe('Babel compiled version', () => {
  let dataset = []

  beforeEach(() => {
    dataset = JSON.parse(fs.readFileSync('./test/data/dataset1.json'))
  })

  it('should wire the test set after import of built version', () => {
    const proxied = DelegableProxy.wire(dataset, dummy)
    expect(dataset).to.deep.equal(proxied)
  })
})
