#!/usr/bin/env node
// Provides a CLI wrapper for each major function performing file IO

const cdnm = require('.')
const fsBase = require('fs')
const getStdin = require('get-stdin')
const neodoc = require('neodoc')
const pify = require('pify')

const fs = pify(fsBase)
const readHtml = path => path ? fs.readFile(path, 'utf8') : getStdin()

const args = neodoc.run(`CDN Manager: Manage dependencies through CDN URLs in HTML files.

Usage:
  cdnm list [<path>]
  cdnm outdated [<path>]
  cdnm package [<path>]
  cdnm update [<path>]
  cdnm -h | --help
  cdnm --version

Options:
  -h --help     Show this screen.
  --version     Show version.`)

const path = args['<path>']

if (args.list) {
  readHtml(path).then(cdnm.list).then(dependencies => {
    // Print dependencies
    Object.keys(dependencies).forEach(name => {
      const version = dependencies[name]
      console.log([name, version && '@', version].join(''))
    })
  }).catch(console.error)
} else if (args.outdated) {
  readHtml(path).then(cdnm.outdated).then(outdated => {
    // Print outdated dependencies
    Object.keys(outdated).forEach(name => {
      const version = outdated[name][0]
      const newVersion = outdated[name][1]
      console.log(`${name}@${version} → ${newVersion}`)
    })

    // Set erroring exit code if dependencies are outdated
    if (Object.keys(outdated).length) process.exit(1)
  }).catch(console.error)
} else if (args.package) {
  readHtml(path).then(html => {
    const pkg = JSON.stringify(cdnm.package(html), null, 2)

    return fs.writeFile('package.json', pkg)
  }).catch(console.error)
} else if (args.update) {
  readHtml(path).then(html =>
    cdnm.update(html).then(newHtml => {
      if (newHtml !== html) {
        const dependencies = cdnm.list(html)
        const newDependencies = cdnm.list(newHtml)

        // Print updated dependencies
        if (path) {
          Object.keys(dependencies).forEach(name => {
            const version = dependencies[name]
            const newVersion = newDependencies[name]
            newVersion !== version && console.log(`${name}@${version} → ${newVersion}`)
          })
        }

        return path ? fs.writeFile(path, newHtml) : process.stdout.write(newHtml)
      }
    })
  ).catch(console.error)
}
