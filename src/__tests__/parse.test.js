import fs from 'fs'
import path from 'path'
import parse from '../index'

const fromFile = filePath => {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        reject(err)
        return
      }

      const spec = JSON.parse(data)
      resolve(spec)
    })
  })
}

describe('parse', () => {
  it('throws exception when no content provided', async () => {
    await expect(parse()).rejects.toHaveProperty(
      'message',
      'No content specified.'
    )
  })

  it('throws exception when content is not a string or object', async () => {
    await expect(parse(false)).rejects.toHaveProperty(
      'message',
      'Content must be a string or spec object.'
    )
  })

  it('returns spec when path provided', async () => {
    const file = path.resolve(
      __dirname,
      './specs/v2.0/json/petstore-simple.json'
    )

    await expect(parse(file)).resolves.toBeTruthy()
  })

  it('returns spec when spec object provided', async () => {
    const spec = await fromFile(
      path.resolve(__dirname, './specs/v2.0/json/petstore-simple.json')
    )

    await expect(parse(spec)).resolves.toBeTruthy()
  })
})
