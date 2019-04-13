import $RefParser from 'json-schema-ref-parser'
import isArray from 'inspected/schema/is-array'
import isNil from 'inspected/schema/is-nil'
import isFunction from 'inspected/schema/is-function'
import isString from 'inspected/schema/is-string'
import isObject from 'inspected/schema/is-object'
import upgrader from 'swagger2openapi'
import deepmerge from 'deepmerge'

const getParsed = async (basePath, dereference, parser, resolver, schema) => {
  const refParserOptions = {
    parse: { parser },
    resolve: { custom: resolver },
  }

  if (!isArray(dereference.mode)) {
    throw new Error('Dereference mode should be an array.')
  }

  if (!isFunction(dereference.resolve)) {
    throw new Error('Dereference resolve should be a function.')
  }

  const params = (basePath ? [basePath] : []).concat([schema, refParserOptions])
  const result = await Promise.all(
    dereference.mode.map(async mode => {
      switch (mode) {
        case 'none':
          return await $RefParser.parse(...params)
        case 'external':
          return await $RefParser.bundle(...params)
        case 'all':
          return await $RefParser.dereference(...params)
        default:
          throw new Error(`Unknown dereference mode ${mode}.`)
      }
    })
  )

  return dereference.resolve(schema, result)
}

const resolve = ({
  basePath,
  dereference,
  upgrade,
  parser,
  resolver,
}) => async schema => {
  const parsed = await getParsed(
    basePath,
    dereference,
    parser,
    resolver,
    schema
  )

  if (upgrade.enabled) {
    const upgraded = await upgrader.convertObj(parsed, upgrade.options || {})
    return upgraded.openapi
  }

  return parsed
}

const parse = options => async schema => {
  if (isNil(schema)) {
    throw new Error('No schema specified.')
  }

  if (!isString(schema) && !isObject(schema)) {
    throw new Error('Schema must be a string path or spec object.')
  }

  if (!isNil(options) && !isObject(options)) {
    throw new Error('Options should be an object.')
  }

  const defaultOptions = {
    basePath: null,
    dereference: {
      mode: ['none'],
      resolve: (_, result) => result[0],
    },
    upgrade: {
      enabled: false,
    },
    parser: {
      canParse: fileInfo => false,
      parse: async fileInfo => {},
    },
    resolver: {
      canResolve: fileInfo => false,
      resolve: async fileInfo => {},
    },
  }

  const compiledOptions = options
    ? deepmerge(defaultOptions, options)
    : defaultOptions

  // TODO: validate compiled options against schema with inspected

  const parser = compiledOptions.parser
    ? {
        order: 1,
        canParse: fileInfo => {
          return compiledOptions.parser.canParse({
            path: fileInfo.url,
            extension: fileInfo.extension,
            data: fileInfo.data,
          })
        },
        parse: async fileInfo => {
          return compiledOptions.parser.parse({
            path: fileInfo.url,
            extension: fileInfo.extension,
            data: fileInfo.data,
          })
        },
      }
    : undefined

  const resolver = compiledOptions.resolver
    ? {
        order: 1,
        canRead: fileInfo => {
          return compiledOptions.resolver.canResolve({
            path: fileInfo.url,
            extension: fileInfo.extension,
          })
        },
        read: async fileInfo => {
          return await compiledOptions.resolver.resolve({
            path: fileInfo.url,
            extension: fileInfo.extension,
          })
        },
      }
    : undefined

  return await resolve({
    basePath: compiledOptions.basePath,
    dereference: compiledOptions.dereference,
    upgrade: compiledOptions.upgrade,
    parser,
    resolver,
  })(schema)
}

export default parse
