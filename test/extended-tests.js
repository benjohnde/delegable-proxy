import { expect } from 'chai'
import fs from 'fs'
import DelegableProxy from '../src/DelegableProxy'


// noop handler
const dummy = function cb(action, sender) {}

describe('Extended tests', () => {
  let dataset = []

  beforeEach(() => {
    dataset = JSON.parse(fs.readFileSync('./test/data/dataset2.json'))
  })

  it('should get on with a much bigger set', () => {
    const proxied = DelegableProxy.wire(dataset, dummy)
    expect(dataset).to.deep.equal(proxied)
  }).timeout(10000)
})
