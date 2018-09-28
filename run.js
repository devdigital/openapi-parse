const fs = require('fs')
const path = require('path')
const parse = require('./src').default
const yaml = require('js-yaml')

const fromFile = parser => filePath => {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        reject(err)
        return
      }

      const spec = parser(data)
      resolve(spec)
    })
  })
}

const fromJsonFile = fromFile(data => JSON.parse(data))
const fromYamlFile = fromFile(data => yaml.safeLoad(data))

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
  const basePath = './src/__tests__/specs/v3.0'
  const spec = await fromYamlFile(
    path.resolve(__dirname, basePath, './petstore.yaml')
  )

  const output = path.resolve(__dirname, './output.json')
  const content = await parse({
    basePath,
    dereference: true,
    upgrade: {
      enabled: true,
      options: { patch: true, warnOnly: true },
    },
    parser: {
      canParse: info => {
        console.log('canParse info', info)
        return false
      },
      parse: info => {
        console.log('parse info', info)
      },
    },
    resolver: {
      canResolve: info => {
        console.log('canResolve info', info)
        return true
      },
      resolve: async info => {
        console.log('resolve info', info)
        return await fromFile(info.path)
      },
    },
  })(spec)

  await toFile(output, JSON.stringify(content, null, 2))
  console.log('complete')
})()
