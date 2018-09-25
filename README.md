# openapi-parse

Basic parser for OpenAPI specs

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
