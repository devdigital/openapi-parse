const fs = require('fs')
const path = require('path')
const parse = require('./src')

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
    const basePath = './src/__tests__/specs/v2.0/json/petstore-separate/spec/'

    const spec = await fromFile(
      path.resolve(__dirname, basePath, 'swagger.json')
    )

    const output = path.resolve(__dirname, './output.json')
    const content = await parse({
      basePath,
      dereference: true,
      resolver: {
        canResolve: () => true,
        resolve: async info => await fromFile(info.path),
      },
    })(spec)

    await toFile(output, JSON.stringify(content, null, 2))
    console.log('complete')
  } catch (error) {
    console.log(error)
  }
})()
