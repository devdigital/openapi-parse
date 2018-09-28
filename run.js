const fs = require('fs')
const fsExtra = require('fs-extra')
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

      resolve(parser(data))
    })
  })
}

const fromJsonFile = fromFile(data => JSON.parse(data))
const fromYamlFile = fromFile(data => yaml.safeLoad(data))

const toFile = (filePath, content) => {
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, content, { encoding: 'utf8', flag: 'w' }, err => {
      if (err) {
        reject(err)
        return
      }

      resolve()
    })
  })
}

const outputSpec = async (basePath, filePath) => {
  const parsedPath = path.parse(filePath)

  let spec = null
  if (parsedPath.ext === '.json') {
    spec = await fromJsonFile(filePath)
  } else {
    spec = await fromYamlFile(filePath)
  }

  const versionFolder = filePath.split(path.sep).find(p => p.startsWith('v'))
  const outputFolder = path.resolve(__dirname, './output', versionFolder)

  fsExtra.ensureDirSync(outputFolder)

  const outputPath = path.join(outputFolder, `${parsedPath.name}.json`)

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
        return await fromJsonFile(info.path)
      },
    },
  })(spec)

  await toFile(outputPath, JSON.stringify(content, null, 2))
}

const outputSpecs = async specsFolder => {
  fs.readdir(specsFolder, (err, files) => {
    if (err) {
      throw new Error('Error reading specs folder.')
    }

    files.forEach(async file => {
      console.log(`outputting spec '${file}'...`)
      await outputSpec(specsFolder, path.resolve(__dirname, specsFolder, file))
      console.log(`spec file '${file}' successfully outputted.`)
    })
  })
}
;(async () => {
  // await outputSpecs('./src/specs/v2.0/json')
  await outputSpecs('./src/specs/v3.0')

  console.log('complete')
})()
