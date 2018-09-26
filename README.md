# openapi-parse

Basic parser for OpenAPI specs. This is a thin wrapper around existing libraries. If you need more power/flexibility, check out [Swagger/OpenAPI Parser](https://github.com/James-Messinger/swagger-parser) or [JSON Schema $Ref Parser](https://github.com/James-Messinger/json-schema-ref-parser).

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

| Option                | Default Value          | Description                                                                                                                                                                                        |
| --------------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `basePath`            | `null`                 | Used as the base path for relative references within the spec.                                                                                                                                     |
| `dereference`         | `false`                | If set to `true`, all references (including internal references) will be fully dereferenced. If set to `false`, all external references will be dereferenced, but internal references will remain. |
| `parser.canParse`     | `fileInfo => false`    | Receives `{ path, extension, data }` about referenced content. You can override and return `true` if you can parse the provided file information.                                                  |
| `parser.parse`        | `async fileInfo => {}` | Receives `{ path, extension, data }` about referenced content. You can override to implement a parser for the specified content.                                                                   |
| `resolver.canResolve` | `fileInfo => false`    | Receives `{ path, extension }` about referenced content. You can override and return `true` if you are able to resolve the `path`.                                                                 |
| `resolver.resolve`    | `async fileInfo => {}` | Receives `{ path, extension }` about referenced content. You can override to implement a resolver for the specified content.                                                                       |
