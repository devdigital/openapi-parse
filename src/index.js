import $RefParser from 'json-schema-ref-parser'
import isNil from 'inspected/schema/is-nil'
import isString from 'inspected/schema/is-string'
import isObject from 'inspected/schema/is-object'
import upgrader from 'swagger2openapi'

const getParsed = async (basePath, dereference, parser, resolver, schema) => {
  const refParserOptions = {
    parse: { parser },
    resolve: { custom: resolver },
  }

  if (basePath) {
    return dereference
      ? await $RefParser.dereference(basePath, schema, refParserOptions)
      : await $RefParser.bundle(basePath, schema, refParserOptions)
  }

  return dereference
    ? await $RefParser.dereference(schema, refParserOptions)
    : await $RefParser.bundle(schema, refParserOptions)
}

const resolve = ({
  basePath,
  dereference,
  upgrade,
  parser,
  resolver,
}) => async schema => {
  let parsed = await getParsed(basePath, dereference, parser, resolver, schema)

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

  // TODO: validate options against schema
  if (!isNil(options) && !isObject(options)) {
    throw new Error('Options should be an object.')
  }

  const defaultOptions = {
    basePath: null,
    dereference: false,
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

  const compiledOptions = Object.assign({}, defaultOptions, options)

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
