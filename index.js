const JSDOM = require('jsdom').JSDOM
const URL = require('whatwg-url').URL

/*
 * From https://github.com/unpkg/unpkg-website/blob/c49efe2de1fa4bd673999d607f0df73b374ba4e7/server/utils/parsePackageURL.js#L3
 * TODO: wait until the unpkg project picks an open source license and mention it here
 */
const URLFormat = /^\/((?:@[^\/@]+\/)?[^\/@]+)(?:@([^\/]+))?(\/.*)?$/

exports.list = path => {
  return JSDOM.fromFile(path).then(dom => {
    const nodes = Array.from(dom.window.document.querySelectorAll('link[rel=stylesheet]'))

    return nodes.reduce((memo, node) => {
      const pathname = new URL(node.href).pathname
      const match = URLFormat.exec(pathname)
      const name = match[1]
      const version = match[2]

      return Object.assign({}, memo, { [name]: version })
    }, {})
  })
}
