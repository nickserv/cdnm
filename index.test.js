const cdnm = require('.')
const { readFileSync } = require('fs')

// Package metadata
const html = readFileSync('fixture.html', 'utf8')
const name = 'juggernaut'
const version = '2.1.0'
const newVersion = '2.1.1'
const replaceVersion = string => string.replace(version, newVersion)

describe('list', () => {
  test('empty string', () => {
    expect(cdnm.list('')).toEqual({})
  })

  test('complete html document', () => {
    expect(cdnm.list(html)).toEqual({ [name]: version })
  })
})

describe('update', () => {
  test('empty string', async () => {
    expect(await cdnm.update('')).toEqual('')
  })

  test('complete html document', async () => {
    expect(await cdnm.update(html)).toBe(replaceVersion(html))
  })

  test('fixed version', async () => {
    const url = `https://unpkg.com/${name}@${version}/index.js`
    expect(await cdnm.update(url)).toBe(replaceVersion(url))
  })

  test('latest version', async () => {
    const url = `https://unpkg.com/${name}@${newVersion}/index.js`
    expect(await cdnm.update(url)).toBe(url)
  })

  test('semver range', async () => {
    const url = `https://unpkg.com/${name}@^${newVersion}/index.js`
    expect(await cdnm.update(url)).toBe(url)
  })

  test('tag', async () => {
    const url = `https://unpkg.com/${name}@latest/index.js`
    expect(await cdnm.update(url)).toBe(url)
  })

  test('without vesion', async () => {
    const url = `https://unpkg.com/${name}/index.js`
    expect(await cdnm.update(url)).toBe(url)
  })

  test('without path', async () => {
    const url = `https://unpkg.com/${name}@${version}`
    expect(await cdnm.update(url)).toBe(replaceVersion(url))
  })

  test('trailing slash', async () => {
    const url = `https://unpkg.com/${name}@${version}/`
    expect(await cdnm.update(url)).toBe(replaceVersion(url))
  })

  test('home page', async () => {
    const url = `https://unpkg.com`
    expect(await cdnm.update(url)).toBe(url)
  })

  test('query', async () => {
    const url = `https://unpkg.com/${name}@${version}/index.js?main=example`
    expect(await cdnm.update(url)).toBe(replaceVersion(url))
  })

  test('absolute href', async () => {
    const url = 'https://example.com/index.js'
    expect(await cdnm.update(url)).toBe(url)
  })

  test('relative href', async () => {
    const url = 'index.js'
    expect(await cdnm.update(url)).toBe(url)
  })

  test('root relative href', async () => {
    const url = '/index.js'
    expect(await cdnm.update(url)).toBe(url)
  })
})
