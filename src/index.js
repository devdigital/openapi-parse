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
}) => async content => {
  const refParserOptions = {
    parse: { parser },
    resolve: { custom: resolver },
  }

  if (basePath) {
    return dereference
      ? await $RefParser.dereference(basePath, content, refParserOptions)
      : await $RefParser.bundle(basePath, content, refParserOptions)
  }

  return dereference
    ? await $RefParser.dereference(content, refParserOptions)
    : await $RefParser.bundle(content, refParserOptions)
}

const parse = options => async content => {
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
      basePath: null,
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
      basePath: compiledOptions.basePath,
      dereference: compiledOptions.dereference,
      parser,
      resolver,
    })(content)
  } catch (error) {
    throw new Error(`There was an error parsing the specified spec:\n${error}`)
  }
}

export default parse
