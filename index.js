const { run } = require('npm-check-updates')

/*
 * From https://github.com/unpkg/unpkg-website/blob/c49efe2de1fa4bd673999d607f0df73b374ba4e7/server/utils/parsePackageURL.js#L3
 * TODO: wait until the unpkg project picks an open source license and mention it here
 */
const URLFormat = /https?:\/\/unpkg.com\/((?:@[^/@]+\/)?[^/@]+)(?:@([^/]+))?(\/.*)?/g

exports.list = html => {
  const matches = html.match(URLFormat) || []

  return matches.reduce((memo, dependency) => {
    const [, name, version] = URLFormat.exec(dependency)
    return { ...memo, [name]: version }
  }, {})
}

exports.update = async html => {
  const dependencies = exports.list(html)

  const updatedDependencies = (await run({
    jsonAll: true,
    packageData: JSON.stringify({ dependencies })
  })).dependencies

  return html.replace(URLFormat, (match, name, version, file) => {
    const newVersion = updatedDependencies[name]
    return `https://unpkg.com/${name !== undefined ? name : ''}${newVersion !== undefined ? '@' + newVersion : ''}${file !== undefined ? file : ''}`
  })
}
