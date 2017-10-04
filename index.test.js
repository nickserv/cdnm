const cdnm = require('.')
const fs = require('fs')
const { JSDOM } = require('jsdom')
const { URL } = require('url')
const { promisify } = require('util')

const document = new JSDOM().window.document
const createElement = (tagName, properties) => Object.assign(document.createElement(tagName), properties)
const createLink = href => createElement('link', { href, rel: 'stylesheet' })
const createScript = src => createElement('script', { src })
const file = 'fixture.html'
const name = 'juggernaut'
const version = '2.1.0'
const newVersion = '2.1.1'
const unpkgURL = `https://unpkg.com/${name}@${version}/index.js`
const newUnpkgURL = `https://unpkg.com/${name}@${newVersion}/index.js`

test('createURL', () => {
  expect(cdnm.createURL(unpkgURL)).toEqual(new URL(unpkgURL))
  expect(cdnm.createURL('')).toBe(null)
})

test('findDependencies', async () => {
  expect(
    cdnm.findDependencies(await JSDOM.fromFile(file))
  ).toEqual([createScript(unpkgURL)])
})

test('list', async () => {
  await expect(cdnm.list(file)).resolves.toEqual({ [name]: version })
})

test('update', async () => {
  const copyFile = promisify(fs.copyFile)
  const readFile = promisify(fs.readFile)
  const unlink = promisify(fs.unlink)

  async function readHTML (file) {
    const contents = await readFile(file, 'utf8')
    return contents
      .replace('DOCTYPE', 'doctype')
      .replace(/\n/g, '')
      .replace(/>\s+</g, '><')
  }

  const fileTmp = 'fixture_tmp.html'

  await copyFile(file, fileTmp)
  await expect(cdnm.update(fileTmp)).resolves.toBe(undefined)
  const expected = (await readHTML(file)).replace(version, newVersion)
  await expect(readHTML(fileTmp)).resolves.toBe(expected)
  await unlink(fileTmp)
})

describe('updateDependency', () => {
  test('link', async () => {
    await expect(
      cdnm.updateDependency(createLink(unpkgURL))
    ).resolves.toEqual(createLink(newUnpkgURL))
  })

  test('any link rel', async () => {
    await expect(
      cdnm.updateDependency(createElement('link', { href: unpkgURL, rel: 'invalid' }))
    ).resolves.toEqual(createElement('link', { href: newUnpkgURL, rel: 'invalid' }))
  })

  test('script', async () => {
    await expect(
      cdnm.updateDependency(createScript(unpkgURL))
    ).resolves.toEqual(createScript(newUnpkgURL))
  })

  test('absolute href', async () => {
    await expect(
      cdnm.updateDependency(createScript('https://example.com/index.js'))
    ).resolves.toEqual(createScript('https://example.com/index.js'))
  })

  test('relative href', async () => {
    await expect(
      cdnm.updateDependency(createScript('index.js'))
    ).resolves.toEqual(createScript('index.js'))
  })

  test('root relative href', async () => {
    await expect(
      cdnm.updateDependency(createScript('/index.js'))
    ).resolves.toEqual(createScript('/index.js'))
  })
})

describe('urlProperty', () => {
  test('link', () => {
    expect(cdnm.urlProperty(createLink(unpkgURL))).toBe('href')
  })

  test('script', () => {
    expect(cdnm.urlProperty(createScript(unpkgURL))).toBe('src')
  })
})
