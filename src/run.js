const fs = require('fs')
const path = require('path')
const parse = require('./parse')
const $RefParser = require('json-schema-ref-parser')

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

const toFile = (filePath, content) => {
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, content, 'utf8', err => {
      if (err) {
        reject(err)
        return
      }

      resolve()
    })
  })
}
;(async () => {
  try {
    const spec = await fromFile(
      path.resolve(
        __dirname,
        './__tests__/specs/v2.0/json/petstore-separate/spec/swagger.json'
      )
    )

    // const foo = await $RefParser.dereference(
    //   './src/__tests__/specs/v2.0/json/petstore-separate/spec/',
    //   spec,
    //   {}
    // )
    //console.log(foo)

    const output = path.resolve(__dirname, './output.json')
    const content = await parse(spec, {
      basePath: './src/__tests__/specs/v2.0/json/petstore-separate/spec/',
      resolver: {
        canResolve: info => true,
        resolve: async info => {
          console.log(info)
          return await fromFile(info.path)
        },
      },
    })
    await toFile(output, JSON.stringify(content, null, 2))
    console.log('complete')
  } catch (error) {
    console.log(error)
  }
})()
