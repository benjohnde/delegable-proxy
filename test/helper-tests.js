import { expect } from 'chai'
import { isInt } from '../src/Helper'

describe('Helper penetration', () => {
  it('should return true for isInt', () => {
    const o = 200
    expect(isInt(o)).to.be.true
  })
  it('should return true for isInt', () => {
    const o = 400
    expect(isInt(o)).to.be.true
  })
  it('should return true for isInt', () => {
    const o = -200
    expect(isInt(o)).to.be.true
  })
  it('should return true for isInt', () => {
    const o = 1.0
    expect(isInt(o)).to.be.true
  })
  it('should return false for isInt', () => {
    const o = -1.1
    expect(isInt(o)).not.to.be.true
  })
  it('should return false for isInt', () => {
    const o = 1.337
    expect(isInt(o)).not.to.be.true
  })
  it('should return false for isInt', () => {
    const o = {}
    expect(isInt(o)).not.to.be.true
  })
  it('should return false for isInt', () => {
    const o = []
    expect(isInt(o)).not.to.be.true
  })
})
