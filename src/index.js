import $RefParser from 'json-schema-ref-parser'
import isNil from 'inspected/schema/is-nil'
import isString from 'inspected/schema/is-string'
import isObject from 'inspected/schema/is-object'
import merge from 'deepmerge'

const resolve = ({ dereference, parser, resolver }) => async schema => {
  const refParserOptions = {
    parse: { parser },
    resolve: { custom: resolver },
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
      dereference: false,
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

    return await resolve({
      dereference: compiledOptions.dereference,
      parser,
      resolver,
    })(schema)
  } catch (error) {
    throw new Error(`There was an error parsing the specified spec:\n${error}`)
  }
}

export default parse
