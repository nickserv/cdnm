const fs = require('fs')
const { JSDOM: { fromFile} } = require('jsdom')
const { run } = require('npm-check-updates')
const { promisify } = require('util')
const { URL } = require('url')

const writeFile = promisify(fs.writeFile)

/*
 * From https://github.com/unpkg/unpkg-website/blob/c49efe2de1fa4bd673999d607f0df73b374ba4e7/server/utils/parsePackageURL.js#L3
 * TODO: wait until the unpkg project picks an open source license and mention it here
 */
const URLFormat = /^\/((?:@[^\/@]+\/)?[^\/@]+)(?:@([^\/]+))?(\/.*)?$/

exports.list = async path => {
  const dom = await fromFile(path)
  const links = dom.window.document.querySelectorAll('link[rel=stylesheet]')

  return Array.from(links).reduce((memo, link) => {
    const pathname = new URL(link.href).pathname
    const [, name, version] = URLFormat.exec(pathname)

    return { ...memo, [name]: version }
  }, {})
}

exports.update = async path => {
  const dom = await fromFile(path)
  const links = dom.window.document.querySelectorAll('link[rel=stylesheet]')

  for (const link of links) {
    const url = new URL(link.href)
    const [, name, version, file] = URLFormat.exec(url.pathname)
    const newVersion = Object.values(await run({ packageData: JSON.stringify({ dependencies: { [name]: version } }) }))[0]
    url.pathname = `/${name}@${newVersion}${file}`
    link.href = url.toString()
  }

  await writeFile(path, dom.serialize())
}
