const presets = [
  [
    '@babel/env',
    {
      targets: {
        node: '6.10',
      },
      useBuiltIns: 'usage',
    },
  ],
]

module.exports = { presets }
