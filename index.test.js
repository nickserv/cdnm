const cdnm = require('.')
const fs = require('fs')

// Package metadata
const html = fs.readFileSync('fixture.html', 'utf8')
const name = 'juggernaut'
const version = '2.1.0'
const newVersion = '2.1.1'
const replaceVersion = string => string.replace(RegExp(version, 'g'), newVersion)

test('list', () => {
  [
    ['', {}],
    [html, { [name]: version }],
    [`https://cdn.jsdelivr.net/npm/${name}@${version}/index.js`, { [name]: version }],
    [`https://bundle.run/${name}@${version}/index.js`, { [name]: version }],
    [`https://unpkg.com/${name}@latest/index.js`, { [name]: 'latest' }],
    [`https://unpkg.com/${name}@*/index.js`, { [name]: '*' }],
    [`https://unpkg.com/${name}/index.js`, { [name]: '' }],
    [`https://unpkg.com/${name}@${version}/1.js\nhttps://unpkg.com/${name}@${version}/2.js`, { [name]: version }],
    [`https://unpkg.com/${name}@${version}/index.js\nhttps://unpkg.com/${name}@${newVersion}/index.js`, new Error(`cdnm: ${name} must not have multiple versions, found ${version} and ${newVersion}`)]
  ].forEach(([html, dependencies]) => {
    if (dependencies instanceof Error) {
      expect(() => cdnm.list(html)).toThrow(dependencies)
    } else {
      expect(cdnm.list(html)).toEqual(dependencies)
    }
  })
})

test('outdated', () => {
  [
    ['', {}],
    [replaceVersion(html), {}],
    [html, { [name]: [version, newVersion] }]
  ].forEach(([html, dependencies]) =>
    expect(cdnm.outdated(html)).resolves.toEqual(dependencies)
  )
})

test('package', () => {
  [
    ['', {}],
    [html, { [name]: version }]
  ].forEach(([html, dependencies]) =>
    expect(cdnm.package(html)).toEqual({ private: true, dependencies })
  )
})

test('update', () => {
  [
    ['', false],
    [html, true],
    [`https://cdn.jsdelivr.net/npm/${name}@${version}/index.js`, true],
    [`https://bundle.run/${name}@${version}/index.js`, true],
    [`https://unpkg.com/${name}@${version}/index.js`, true],
    [`https://unpkg.com/${name}@${newVersion}/index.js`, false],
    [`https://unpkg.com/${name}@^${newVersion}/index.js`, false],
    [`https://unpkg.com/${name}@latest/index.js`, false],
    [`https://unpkg.com/${name}@*/index.js`, false],
    [`https://unpkg.com/${name}/index.js`, false],
    [`https://unpkg.com/${name}@${version}/1.js\nhttps://unpkg.com/${name}@${version}/2.js`],
    [`https://unpkg.com/${name}@${version}/index.js\nhttps://unpkg.com/${name}@${newVersion}/index.js`, new Error(`cdnm: ${name} must not have multiple versions, found ${version} and ${newVersion}`)],
    [`https://unpkg.com/${name}@${version}`, true],
    [`https://unpkg.com/${name}@${version}/`, true],
    ['https://unpkg.com', false],
    [`https://unpkg.com/${name}@${version}/index.js?main=example`, true],
    ['https://example.com/index.js', false],
    ['index.js', false],
    ['/index.js', false]
  ].forEach(([html, update]) => {
    if (update instanceof Error) {
      expect(() => cdnm.update(html)).toThrow(update)
    } else {
      expect(cdnm.update(html)).resolves.toBe(update ? replaceVersion(html) : html)
    }
  })
})
