import fs from 'fs'
import path from 'path'
import parse from './index'

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
    await expect(parse()()).rejects.toHaveProperty(
      'message',
      'No schema specified.'
    )
  })

  it('throws exception when schema is not a string or object', async () => {
    await expect(parse()(false)).rejects.toHaveProperty(
      'message',
      'Schema must be a string path or spec object.'
    )
  })

  it('returns simple spec when path provided', async () => {
    const filePath = path.resolve(
      __dirname,
      './specs/v2.0/json/petstore-simple.json'
    )

    await expect(parse()(filePath)).resolves.toBeTruthy()
  })

  it('returns simple spec when spec object provided', async () => {
    const spec = await fromFile(
      path.resolve(__dirname, './specs/v2.0/json/petstore-simple.json')
    )

    await expect(parse()(spec)).resolves.toBeTruthy()
  })

  it('invokes resolver for separated schema', async () => {
    const fileInfos = []
    const capturingResolver = {
      canResolve: () => true,
      resolve: fileInfo => {
        fileInfos.push(fileInfo)
        return fromFile(fileInfo.path)
      },
    }

    const spec = await fromFile(
      path.resolve(
        __dirname,
        './specs/v2.0/json/petstore-separate/spec/swagger.json'
      )
    )

    const basePath = `${path.resolve(
      __dirname,
      './specs/v2.0/json/petstore-separate/spec'
    )}/`

    await parse({
      basePath,
      dereference: { mode: ['all'] },
      resolver: capturingResolver,
    })(spec)

    const toFileCompare = filePath =>
      path.resolve(basePath.toLowerCase(), filePath).replace(/\\/g, '/')

    expect(fileInfos.map(f => f.path)).toEqual([
      toFileCompare('parameters.json'),
      toFileCompare('Pet.json'),
      toFileCompare('../common/Error.json'),
      toFileCompare('NewPet.json'),
    ])
  })
})
