const fs = require('fs')
const ncu = require('npm-check-updates')
const { parse, serialize } = require('parse5')
const { promisify } = require('util')
const { URL } = require('url')

const readFile = promisify(fs.readFile)
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

exports.findDependencies = node => {
  if (node.nodeName === 'link' || node.nodeName === 'script') {
    return [node]
  } else if (node.childNodes) {
    return Array.prototype.concat.apply([], node.childNodes.map(exports.findDependencies))
  } else {
    return []
  }
}

exports.list = async path => {
  const dom = parse(await readFile(path, 'utf8'))

  return exports.findDependencies(dom).reduce((memo, dependency) => {
    const property = dependency.attrs.find(attr => attr.name === exports.urlProperty(dependency))
    const url = exports.createURL(property.value)

    if (url && url.hostname === 'unpkg.com' && URLFormat.exec(url.pathname)) {
      const [, name, version] = URLFormat.exec(url.pathname)
      return { ...memo, [name]: version }
    } else return memo
  }, {})
}

exports.update = async path => {
  const dom = parse(await readFile(path, 'utf8'))
  await Promise.all(exports.findDependencies(dom).map(exports.updateDependency))
  await writeFile(path, serialize(dom))
}

exports.updateDependency = async dependency => {
  const property = dependency.attrs.find(attr => attr.name === exports.urlProperty(dependency))
  const url = exports.createURL(property.value)

  if (url && url.hostname === 'unpkg.com' && URLFormat.exec(url.pathname)) {
    const [, name, version, file] = URLFormat.exec(url.pathname)

    const dependencies = (await ncu.run({
      jsonAll: true,
      packageData: JSON.stringify({ dependencies: { [name]: version } })
    })).dependencies

    const newVersion = Object.values(dependencies)[0]
    url.pathname = `/${name !== undefined ? name : ''}${newVersion !== undefined ? '@' + newVersion : ''}${file !== undefined ? file : ''}`
    property.value = url.toString()
  }

  return dependency
}

exports.urlProperty = element => ({ link: 'href', script: 'src' }[element.nodeName])
