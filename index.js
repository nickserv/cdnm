// Public API

const { run } = require('npm-check-updates')

/*
   unpkg's URL format with a name, version (optional), and file (optional)
   From https://github.com/unpkg/unpkg-website/blob/c49efe2de1fa4bd673999d607f0df73b374ba4e7/server/utils/parsePackageURL.js#L3
   TODO: wait until the unpkg project picks an open source license and mention it here
 */
const URLFormat = /https?:\/\/unpkg.com\/((?:@[^/@]+\/)?[^/@]+)(?:@([^/]+))?(\/.*)?/g

/*
   Returns an HTML String's npm dependencies as an Object of names and versions
   (Strings compatible with the semver package), extracted from unpkg URLs. The
   result is similar to the dependencies property of package.json. Versions may
   be undefined, representing a package's latest tag on npm (usually the latest
   stable version).
 */
exports.list = html =>
  (html.match(URLFormat) || [])
    .map(dependency => URLFormat.exec(dependency).slice(1)) // Extract capture groups
    .reduce((memo, [name, version]) => ({ ...memo, [name]: version }), {}) // Build object from key/value pairs

/*
   Returns a copy of an HTML String with its unpkg URL versions updated in
   place. Version ranges are maintained and only updated when they do not
   include the latest version of a package. Works similarly to the
   npm-check-updates package.
 */
exports.update = async html => {
  const { dependencies } = await run({
    jsonAll: true,
    packageData: JSON.stringify({ dependencies: exports.list(html) })
  })

  return html.replace(URLFormat, (match, name, version, file) => {
    const newVersion = dependencies[name]

    // Build the new package URL using HTTPS and leaving missing sections empty
    return ['https://unpkg.com/', name, newVersion && '@', newVersion, file].join('')
  })
}
