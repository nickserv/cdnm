const cdnm = require('.')
const fs = require('fs')
const { JSDOM } = require('jsdom')
const { promisify } = require('util')

const file = 'fixture.html'

const pkg = {
  name: 'juggernaut',
  version: '2.1.0',
  newVersion: '2.1.1',
  file: '/index.js'
}

test('list', async () => {
  await expect(cdnm.list(file)).resolves.toEqual({ [pkg.name]: pkg.version })
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
  const expected = (await readHTML(file)).replace(pkg.version, pkg.newVersion)
  await expect(readHTML(fileTmp)).resolves.toEqual(expected)
  await unlink(fileTmp)
})

test('updateLink', async () => {
  const document = new JSDOM().window.document
  const createLink = (name, version, file) => Object.assign(document.createElement('link'), {
    href: `https://unpkg.com/${name}@${version}${file}`,
    rel: 'stylesheet'
  })

  const link = createLink(pkg.name, pkg.version, pkg.file)
  const newLink = createLink(pkg.name, pkg.newVersion, pkg.file)
  await expect(cdnm.updateLink(link)).resolves.toEqual(newLink)
})
