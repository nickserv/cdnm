const cdnm = require('.')
const fs = require('fs')

// Package metadata
const html = fs.readFileSync('fixture.html', 'utf8')
const name = 'juggernaut'
const version = '2.1.0'
const newVersion = '2.1.1'
const replaceVersion = string => string.replace(RegExp(version, 'g'), newVersion)

describe('list', () => {
  test('empty string', () => expect(cdnm.list('')).toEqual({}))
  test('complete html document', () => expect(cdnm.list(html)).toEqual({ [name]: version }))
  test('jsDelivr', () => expect(cdnm.list(`https://cdn.jsdelivr.net/npm/${name}@${version}/index.js`)).toEqual({ [name]: version }))
  test('bundle.run', () => expect(cdnm.list(`https://bundle.run/${name}@${version}/index.js`)).toEqual({ [name]: version }))
  test('tag', () => expect(cdnm.list(`https://unpkg.com/${name}@latest/index.js`)).toEqual({ [name]: 'latest' }))
  test('star', () => expect(cdnm.list(`https://unpkg.com/${name}@*/index.js`)).toEqual({ [name]: '*' }))
  test('without version', () => expect(cdnm.list(`https://unpkg.com/${name}/index.js`)).toEqual({ [name]: '' }))
  test('multiple files', () => expect(cdnm.list(`https://unpkg.com/${name}@${version}/1.js\nhttps://unpkg.com/${name}@${version}/2.js`)).toEqual({ [name]: version }))
  test('multiple versions', () => expect(() => cdnm.list(`https://unpkg.com/${name}@${version}/index.js\nhttps://unpkg.com/${name}@${newVersion}/index.js`)).toThrow(`cdnm: ${name} must not have multiple versions, found ${version} and ${newVersion}`))
})

describe('outdated', () => {
  test('empty string', () => expect(cdnm.outdated('')).resolves.toEqual({}))
  test('up to date html document', () => expect(cdnm.outdated(replaceVersion(html))).resolves.toEqual({}))
  test('outdated html document', () => expect(cdnm.outdated(html)).resolves.toEqual({ [name]: [version, newVersion] }))
})

describe('package', () => {
  test('empty string', () =>
    expect(cdnm.package('')).toEqual({
      private: true,
      dependencies: {}
    })
  )

  test('complete html document', () =>
    expect(cdnm.package(html)).toEqual({
      private: true,
      dependencies: {
        [name]: version
      }
    })
  )
})

describe('update', () => {
  const expectToUpdate = url => () => expect(cdnm.update(url)).resolves.toBe(replaceVersion(url))
  const expectNotToUpdate = url => () => expect(cdnm.update(url)).resolves.toBe(url)

  test('empty string', expectNotToUpdate(''))
  test('complete html document', expectToUpdate(html))
  test('jsDelivr', expectToUpdate(`https://cdn.jsdelivr.net/npm/${name}@${version}/index.js`))
  test('bundle.run', expectToUpdate(`https://bundle.run/${name}@${version}/index.js`))
  test('fixed version', expectToUpdate(`https://unpkg.com/${name}@${version}/index.js`))
  test('latest version', expectNotToUpdate(`https://unpkg.com/${name}@${newVersion}/index.js`))
  test('semver range', expectNotToUpdate(`https://unpkg.com/${name}@^${newVersion}/index.js`))
  test('tag', expectNotToUpdate(`https://unpkg.com/${name}@latest/index.js`))
  test('star', expectNotToUpdate(`https://unpkg.com/${name}@*/index.js`))
  test('without version', expectNotToUpdate(`https://unpkg.com/${name}/index.js`))
  test('multiple files', expectToUpdate(`https://unpkg.com/${name}@${version}/1.js\nhttps://unpkg.com/${name}@${version}/2.js`))
  test('multiple versions', () => expect(() => cdnm.update(`https://unpkg.com/${name}@${version}/index.js\nhttps://unpkg.com/${name}@${newVersion}/index.js`)).toThrow(`cdnm: ${name} must not have multiple versions, found ${version} and ${newVersion}`))
  test('without path', expectToUpdate(`https://unpkg.com/${name}@${version}`))
  test('trailing slash', expectToUpdate(`https://unpkg.com/${name}@${version}/`))
  test('home page', expectNotToUpdate('https://unpkg.com'))
  test('query', expectToUpdate(`https://unpkg.com/${name}@${version}/index.js?main=example`))
  test('absolute href', expectNotToUpdate('https://example.com/index.js'))
  test('relative href', expectNotToUpdate('index.js'))
  test('root relative href', expectNotToUpdate('/index.js'))
})
