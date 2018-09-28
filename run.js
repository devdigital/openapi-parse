const fs = require('fs')
const fsExtra = require('fs-extra')
const path = require('path')
const parse = require('./src').default
const yaml = require('js-yaml')

const fromFile = parser => filePath => {
  const content = fs.readFileSync(filePath, 'utf8')
  return parser(content)
}

const fromJsonFile = fromFile(data => JSON.parse(data))
const fromYamlFile = fromFile(data => yaml.safeLoad(data))

const toFile = (filePath, content) => {
  fs.writeFileSync(filePath, content, { encoding: 'utf8', flag: 'w' })
}

const outputSpec = async (basePath, filePath) => {
  const parsedPath = path.parse(filePath)

  let spec = null
  if (parsedPath.ext === '.json') {
    spec = fromJsonFile(filePath)
  } else {
    spec = fromYamlFile(filePath)
  }

  const versionFolder = filePath.split(path.sep).find(p => p.startsWith('v'))
  const outputFolder = path.resolve(__dirname, './output', versionFolder)

  fsExtra.ensureDirSync(outputFolder)

  const outputPath = path.join(outputFolder, `${parsedPath.name}.json`)

  const content = await parse({
    basePath,
    dereference: true,
    // upgrade: {
    //   enabled: true,
    //   options: { patch: true, warnOnly: true },
    // },
    resolver: {
      canResolve: () => true,
      resolve: info => Promise.resolve(fromJsonFile(info.path)),
    },
  })(spec)

  toFile(outputPath, JSON.stringify(content, null, 2))
}

const getFiles = folder => {
  return fs
    .readdirSync(folder)
    .filter(file => fs.lstatSync(path.join(folder, file)).isFile())
}

const outputSpecs = async specsFolder => {
  const files = getFiles(specsFolder)

  files.forEach(async file => {
    console.log(`outputting spec '${file}'...`)
    await outputSpec(specsFolder, path.resolve(__dirname, specsFolder, file))
    console.log(`spec file '${file}' successfully outputted.`)
  })
}
;(async () => {
  await outputSpecs('./src/specs/v2.0/json')
  await outputSpecs('./src/specs/v3.0')

  console.log('complete')
})()
