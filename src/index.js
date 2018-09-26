import $RefParser from 'json-schema-ref-parser'
import isNil from 'inspected/schema/is-nil'
import isString from 'inspected/schema/is-string'
import isObject from 'inspected/schema/is-object'
import merge from 'deepmerge'

const resolve = ({
  basePath,
  dereference,
  parser,
  resolver,
}) => async schema => {
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

  try {
    const defaultOptions = {
      basePath: null,
      dereference: false,
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
      ? merge(defaultOptions, options)
      : defaultOptions

    const parser = {
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

    const resolver = {
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

    return await resolve({
      basePath: compiledOptions.basePath,
      dereference: compiledOptions.dereference,
      parser,
      resolver,
    })(schema)
  } catch (error) {
    throw new Error(`There was an error parsing the specified spec:\n${error}`)
  }
}

export default parse
