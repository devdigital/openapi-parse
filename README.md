# openapi-parse

Basic parser for OpenAPI specs. This is a thin wrapper around existing libraries. If you need more power/flexibility, check out [Swagger/OpenAPI Parser](https://github.com/James-Messinger/swagger-parser), [JSON Schema $Ref Parser](https://github.com/James-Messinger/json-schema-ref-parser), or [swagger2openapi](https://github.com/Mermade/oas-kit/tree/master/packages/swagger2openapi).

## Installation

```
npm i openapi-parse
```

or

```
yarn add openapi-parse
```

## Usage

```javascript
import parse from 'openapi-parse'
// or const parse = require('openapi-parse').default

const options = { ... }
const specPathOrSchemaObject = ... // specify Swagger/OpenAPI spec path or a loaded schema object

const result = await parse(options)(specPathOrSchemaObject)
```

## Options

| Option                | Default Value                     | Description                                                                                                                                                                                                                                                                                                          |
| --------------------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `basePath`            | `null`                            | Used as the base path for relative references within the spec.                                                                                                                                                                                                                                                       |
| `dereference.mode`    | `['none']`                        | Set to an array of dereference modes. Possible mode values are `none` (no references will be dereferenced), `external` (only external references will be dereferenced), and `all` (both external and internal references will be dereferenced). The result will be an array of schemas, one for each mode specified. |
| `dereference.resolve` | `(original, result) => result[0]` | After dereferencing, the result collection is passed to the specified `resolve` function. The `resolve` function also receives the original loaded schema, the return value will be used as the final dereferenced schema.                                                                                           |
| `upgrade.enabled`     | `false`                           | If enabled, OpenAPI 2.0 specs will be automatically upgraded to OpenAPI 3.0 using [swagger2openapi](https://github.com/Mermade/oas-kit/tree/master/packages/swagger2openapi).                                                                                                                                        |
| `upgrade.options`     | `{}`                              | These options are passed down to `swagger2openapi`. [More info](https://github.com/Mermade/oas-kit/blob/master/docs/options.md).                                                                                                                                                                                     |
| `parser.canParse`     | `fileInfo => false`               | Receives `{ path, extension, data }` about referenced content. You can override and return `true` if you can parse the provided file information. [More info](https://github.com/James-Messinger/json-schema-ref-parser/blob/master/docs/plugins/parsers.md).                                                        |
| `parser.parse`        | `async fileInfo => {}`            | Receives `{ path, extension, data }` about referenced content. You can override to implement a parser for the specified content. [More info](https://github.com/James-Messinger/json-schema-ref-parser/blob/master/docs/plugins/parsers.md).                                                                         |
| `resolver.canResolve` | `fileInfo => false`               | Receives `{ path, extension }` about referenced content. You can override and return `true` if you are able to resolve the `path`. [More info](https://github.com/James-Messinger/json-schema-ref-parser/blob/master/docs/plugins/resolvers.md).                                                                     |
| `resolver.resolve`    | `async fileInfo => {}`            | Receives `{ path, extension }` about referenced content. You can override to implement a resolver for the specified content. [More info](https://github.com/James-Messinger/json-schema-ref-parser/blob/master/docs/plugins/resolvers.md).                                                                           |
