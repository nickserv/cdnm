const cdnm = require('.')
const fs = require('fs')
const { parse, parseFragment, serialize } = require('parse5')
const { URL } = require('url')
const { promisify } = require('util')

const copyFile = promisify(fs.copyFile)
const readFile = promisify(fs.readFile)
const unlink = promisify(fs.unlink)

const parseNode = node => parseFragment(node).childNodes[0]
const createLink = href => parseNode(`<link  href="${href}" rel="stylesheet">`)
const createScript = src => parseNode(`<script src=${src}></script>`)
const file = 'fixture.html'
const fileTmp = 'fixture_tmp.html'
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
    cdnm.findDependencies(parse(await readFile(file, 'utf8'))).map(serialize)
  ).toEqual([createScript(unpkgURL)].map(serialize))
})

test('list', async () => {
  await expect(cdnm.list(file)).resolves.toEqual({ [name]: version })
})

test('update', async () => {
  async function readHTML (file) {
    const contents = await readFile(file, 'utf8')
    return contents
      .replace('DOCTYPE', 'doctype')
      .replace(/\n/g, '')
      .replace(/>\s+</g, '><')
  }

  await copyFile(file, fileTmp)
  await expect(cdnm.update(fileTmp)).resolves.toBe(undefined)
  const expected = (await readHTML(file)).replace(version, newVersion)
  await expect(readHTML(fileTmp)).resolves.toBe(expected)
  await unlink(fileTmp)
})

describe('updateDependency', () => {
  test('script with fixed version', async () => {
    await expect(
      cdnm.updateDependency(createScript(`https://unpkg.com/${name}@${version}/index.js`))
    ).resolves.toEqual(createScript(`https://unpkg.com/${name}@${newVersion}/index.js`))
  })

  test('script with latest version', async () => {
    await expect(
      cdnm.updateDependency(createScript(`https://unpkg.com/${name}@${newVersion}/index.js`))
    ).resolves.toEqual(createScript(`https://unpkg.com/${name}@${newVersion}/index.js`))
  })

  test('script with semver range', async () => {
    await expect(
      cdnm.updateDependency(createScript(`https://unpkg.com/${name}@^${newVersion}/index.js`))
    ).resolves.toEqual(createScript(`https://unpkg.com/${name}@^${newVersion}/index.js`))
  })

  test('script with tag', async () => {
    await expect(
      cdnm.updateDependency(createScript(`https://unpkg.com/${name}@latest/index.js`))
    ).resolves.toEqual(createScript(`https://unpkg.com/${name}@latest/index.js`))
  })

  test('script without vesion', async () => {
    await expect(
      cdnm.updateDependency(createScript(`https://unpkg.com/${name}/index.js`))
    ).resolves.toEqual(createScript(`https://unpkg.com/${name}/index.js`))
  })

  test('script without path', async () => {
    await expect(
      cdnm.updateDependency(createScript(`https://unpkg.com/${name}@${version}`))
    ).resolves.toEqual(createScript(`https://unpkg.com/${name}@${newVersion}`))
  })

  test('script with trailing slash', async () => {
    await expect(
      cdnm.updateDependency(createScript(`https://unpkg.com/${name}@${version}/`))
    ).resolves.toEqual(createScript(`https://unpkg.com/${name}@${newVersion}/`))
  })

  test('script for home page', async () => {
    await expect(
      cdnm.updateDependency(createScript(`https://unpkg.com`))
    ).resolves.toEqual(createScript(`https://unpkg.com`))
  })

  test('script with query', async () => {
    await expect(
      cdnm.updateDependency(createScript(`https://unpkg.com/${name}@${version}/index.js?main=example`))
    ).resolves.toEqual(createScript(`https://unpkg.com/${name}@${newVersion}/index.js?main=example`))
  })

  test('link', async () => {
    await expect(
      cdnm.updateDependency(createLink(unpkgURL))
    ).resolves.toEqual(createLink(newUnpkgURL))
  })

  test('any link rel', async () => {
    await expect(
      cdnm.updateDependency(parseNode(`<link href="${unpkgURL}" rel="invalid">`))
    ).resolves.toEqual(parseNode(`<link href="${newUnpkgURL}" rel="invalid">`))
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
