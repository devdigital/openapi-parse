const $RefParser = require('json-schema-ref-parser')
const isNil = require('inspected/schema/is-nil').default
const isString = require('inspected/schema/is-string').default
const isObject = require('inspected/schema/is-object').default
const merge = require('deepmerge')
const fs = require('fs')

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

const dereference = async (content, basePath, parser, resolver) => {
  const options = {
    parse: { custom: parser },
    resolve: { custom: resolver },
  }

  if (basePath) {
    return await $RefParser.dereference(basePath, content, options)
  }

  return await $RefParser.dereference(content, options)
}

const parse = async (content, options) => {
  if (isNil(content)) {
    throw new Error('No content specified.')
  }

  if (!isString(content) && !isObject(content)) {
    throw new Error('Content must be a string or spec object.')
  }

  // TODO: validate options against schema
  if (!isNil(options) && !isObject(options)) {
    throw new Error('Options should be an object.')
  }

  try {
    const defaultOptions = {
      parser: {
        canParse: file => false,
        parse: async file => {},
      },
      resolver: {
        canResolve: info => false,
        resolve: async info => {},
      },
    }

    const compiledOptions = options
      ? merge(defaultOptions, options)
      : defaultOptions

    const parser = {
      order: 1,
      canParse: info => {
        return compiledOptions.parser.canParse(info)
      },
      parse: async info => {
        return compiledOptions.parser.parse(info)
      },
    }

    const resolver = {
      order: 1,
      canRead: info => {
        return compiledOptions.resolver.canResolve({
          path: info.url,
          extension: info.extension,
        })
      },
      read: async info => {
        return await compiledOptions.resolver.resolve({
          path: info.url,
          extension: info.extension,
        })
      },
    }

    const spec = await dereference(
      content,
      compiledOptions.basePath,
      parser,
      resolver
    )

    return spec
  } catch (error) {
    throw new Error(`There was an error parsing the specified spec:\n${error}`)
  }
}

module.exports = parse
