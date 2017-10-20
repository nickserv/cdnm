const cdnm = require('.')
const fs = require('fs')

// Package metadata
const html = fs.readFileSync('fixture.html', 'utf8')
const name = 'juggernaut'
const version = '2.1.0'
const newVersion = '2.1.1'
const replaceVersion = string => string.replace(version, newVersion)

describe('list', () => {
  test('empty string', () => expect(cdnm.list('')).toEqual({}))
  test('complete html document', () => expect(cdnm.list(html)).toEqual({ [name]: version }))
})

describe('update', () => {
  const expectToUpdate = url => () => expect(cdnm.update(url)).resolves.toBe(replaceVersion(url))
  const expectNotToUpdate = url => () => expect(cdnm.update(url)).resolves.toBe(url)

  test('empty string', expectNotToUpdate(''))
  test('complete html document', expectToUpdate(html))
  test('fixed version', expectToUpdate(`https://unpkg.com/${name}@${version}/index.js`))
  test('latest version', expectNotToUpdate(`https://unpkg.com/${name}@${newVersion}/index.js`))
  test('semver range', expectNotToUpdate(`https://unpkg.com/${name}@^${newVersion}/index.js`))
  test('tag', expectNotToUpdate(`https://unpkg.com/${name}@latest/index.js`))
  test('without vesion', expectNotToUpdate(`https://unpkg.com/${name}/index.js`))
  test('without path', expectToUpdate(`https://unpkg.com/${name}@${version}`))
  test('trailing slash', expectToUpdate(`https://unpkg.com/${name}@${version}/`))
  test('home page', expectNotToUpdate('https://unpkg.com'))
  test('query', expectToUpdate(`https://unpkg.com/${name}@${version}/index.js?main=example`))
  test('absolute href', expectNotToUpdate('https://example.com/index.js'))
  test('relative href', expectNotToUpdate('index.js'))
  test('root relative href', expectNotToUpdate('/index.js'))
})
