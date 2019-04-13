import fs from 'fs'
import path from 'path'
import parse from './index'

const capturingResolver = () => {
  const fileInfos = []
  return {
    canResolve: () => true,
    resolve: fileInfo => {
      fileInfos.push(fileInfo)
      return fromFile(fileInfo.path)
    },
    getFileInfos: () => fileInfos,
  }
}

const capturingParser = () => {
  const fileInfos = []
  return {
    canParse: () => true,
    parse: fileInfo => {
      fileInfos.push(fileInfo)
      return fromFile(fileInfo.path)
    },
    getFileInfos: () => fileInfos,
  }
}

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

  it('invokes parser for separated schema', async () => {
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

    const parser = capturingParser()

    await parse({
      basePath,
      dereference: { mode: ['all'] },
      parser,
    })(spec)

    const toFileCompare = filePath =>
      path.resolve(basePath.toLowerCase(), filePath).replace(/\\/g, '/')

    expect(parser.getFileInfos().map(f => f.path)).toIncludeSameMembers([
      toFileCompare('parameters.json'),
      toFileCompare('Pet.json'),
      toFileCompare('../common/Error.json'),
      toFileCompare('NewPet.json'),
    ])
  })

  it('invokes resolver for separated schema', async () => {
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

    const resolver = capturingResolver()

    await parse({
      basePath,
      dereference: { mode: ['all'] },
      resolver,
    })(spec)

    const toFileCompare = filePath =>
      path.resolve(basePath.toLowerCase(), filePath).replace(/\\/g, '/')

    expect(resolver.getFileInfos().map(f => f.path)).toIncludeSameMembers([
      toFileCompare('parameters.json'),
      toFileCompare('Pet.json'),
      toFileCompare('../common/Error.json'),
      toFileCompare('NewPet.json'),
    ])
  })
})
