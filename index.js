const { run } = require('npm-check-updates')

/*
 * From https://github.com/unpkg/unpkg-website/blob/c49efe2de1fa4bd673999d607f0df73b374ba4e7/server/utils/parsePackageURL.js#L3
 * TODO: wait until the unpkg project picks an open source license and mention it here
 */
const URLFormat = /https?:\/\/unpkg.com\/((?:@[^/@]+\/)?[^/@]+)(?:@([^/]+))?(\/.*)?/g

exports.list = html =>
  (html.match(URLFormat) || [])
    .map(dependency => URLFormat.exec(dependency).slice(1)) // Extract capture groups
    .reduce((memo, [name, version]) => ({ ...memo, [name]: version }), {}) // Build object from key/value pairs

exports.update = async html => {
  const { dependencies } = await run({
    jsonAll: true,
    packageData: JSON.stringify({ dependencies: exports.list(html) })
  })

  return html.replace(URLFormat, (match, name, version, file) => {
    const newVersion = dependencies[name]
    return ['https://unpkg.com/', name, newVersion && '@', newVersion, file].join('')
  })
}
