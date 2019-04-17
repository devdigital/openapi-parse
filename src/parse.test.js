import fs from 'fs'
import path from 'path'
import parse from './index'

const fileResolver = {
  canResolve: () => true,
  resolve: fileInfo => fromFile(fileInfo.path),
}

const separatedSpecOptions = options =>
  Object.assign(
    {},
    {
      basePath: `${path.resolve(
        __dirname,
        './specs/v2.0/json/petstore-separate/spec'
      )}/`,
      resolver: fileResolver,
    },
    options
  )

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

const fromJsonSpecPath = specPath =>
  path.resolve(__dirname, './specs/v2.0/json', specPath)

const fromJsonSpecFile = async specPath =>
  await fromFile(fromJsonSpecPath(specPath))

const toPath = basePath => filePath =>
  path.resolve(basePath.toLowerCase(), filePath).replace(/\\/g, '/')

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
    const filePath = fromJsonSpecPath('petstore-simple.json')
    await expect(parse()(filePath)).resolves.toBeTruthy()
  })

  it('returns simple spec when spec object provided', async () => {
    const spec = await fromJsonSpecFile('petstore-simple.json')
    await expect(parse()(spec)).resolves.toBeTruthy()
  })

  it('invokes parser for separated schema', async () => {
    const spec = await fromJsonSpecFile('./petstore-separate/spec/swagger.json')

    const parser = capturingParser()
    const options = separatedSpecOptions({
      parser,
      dereference: { mode: ['all'] },
    })

    await parse(options)(spec)
    const cleanPath = toPath(options.basePath)

    expect(parser.getFileInfos().map(f => f.path)).toIncludeSameMembers([
      cleanPath('parameters.json'),
      cleanPath('Pet.json'),
      cleanPath('../common/Error.json'),
      cleanPath('NewPet.json'),
    ])
  })

  it('invokes resolver for separated schema', async () => {
    const spec = await fromJsonSpecFile('./petstore-separate/spec/swagger.json')

    const resolver = capturingResolver()
    const options = separatedSpecOptions({
      resolver,
      dereference: { mode: ['all'] },
    })

    await parse(options)(spec)
    const cleanPath = toPath(options.basePath)

    expect(resolver.getFileInfos().map(f => f.path)).toIncludeSameMembers([
      cleanPath('parameters.json'),
      cleanPath('Pet.json'),
      cleanPath('../common/Error.json'),
      cleanPath('NewPet.json'),
    ])
  })

  it('dereference none does not alter references', async () => {
    const spec = await fromJsonSpecFile('./petstore-separate/spec/swagger.json')
    const options = separatedSpecOptions({ dereference: { mode: ['none'] } })
    const result = await parse(options)(spec)
    expect(result).toEqual(spec)
  })

  it('dereference external does not alter references', async () => {
    const spec = await fromJsonSpecFile('./petstore-separate/spec/swagger.json')
    const options = separatedSpecOptions({ dereference: { mode: ['all'] } })
    const result = await parse(options)(spec)
    expect(result).toEqual(spec)
  })
})
