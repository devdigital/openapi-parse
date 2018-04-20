import parse from '../parse'

describe('parse', () => {
  it('throws exception when no file provided', () => {
    expect(() => parse()).toThrow('No content specified.')
  })
})
