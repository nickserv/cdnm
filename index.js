const fs = require('fs')
const { JSDOM } = require('jsdom')
const ncu = require('npm-check-updates')
const { promisify } = require('util')
const { URL } = require('url')

const writeFile = promisify(fs.writeFile)

/*
 * From https://github.com/unpkg/unpkg-website/blob/c49efe2de1fa4bd673999d607f0df73b374ba4e7/server/utils/parsePackageURL.js#L3
 * TODO: wait until the unpkg project picks an open source license and mention it here
 */
const URLFormat = /^\/((?:@[^/@]+\/)?[^/@]+)(?:@([^/]+))?(\/.*)?$/

exports.createURL = url => {
  try {
    return new URL(url)
  } catch (error) {
    return null
  }
}

exports.findDependencies = dom => Array.from(dom.window.document.querySelectorAll('link, script'))

exports.list = async path => {
  const dom = await JSDOM.fromFile(path)

  return exports.findDependencies(dom).reduce((memo, dependency) => {
    const url = exports.createURL(dependency[exports.urlProperty(dependency)])

    if (url) {
      const [, name, version] = URLFormat.exec(url.pathname)
      return { ...memo, [name]: version }
    } else return memo
  }, {})
}

exports.update = async path => {
  const dom = await JSDOM.fromFile(path)
  await Promise.all(exports.findDependencies(dom).map(exports.updateDependency))
  await writeFile(path, dom.serialize())
}

exports.updateDependency = async dependency => {
  const url = exports.createURL(dependency[exports.urlProperty(dependency)])

  if (url && url.hostname === 'unpkg.com') {
    const [, name, version, file] = URLFormat.exec(url.pathname)
    const newVersion = Object.values(await ncu.run({ packageData: JSON.stringify({ dependencies: { [name]: version } }) }))[0]
    url.pathname = `/${name}@${newVersion}${file}`
    dependency[exports.urlProperty(dependency)] = url.toString()
  }

  return dependency
}

exports.urlProperty = element => {
  if (element.tagName === 'LINK') return 'href'
  else if (element.tagName === 'SCRIPT') return 'src'
}
