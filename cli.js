#!/usr/bin/env node
// Provides a CLI wrapper for each major function performing file IO

const cdnm = require('.')
const program = require('commander')
const fsBase = require('fs')
const pkg = require('./package')
const pify = require('pify')

const fs = pify(fsBase)

// Commands

program
  .command('list <path>')
  .description('list CDN dependencies in HTML file')
  .action(path => {
    fs.readFile(path, 'utf8').then(html => {
      const dependencies = cdnm.list(html)

      // Print dependencies
      Object.keys(dependencies).forEach(name => {
        const version = dependencies[name]
        console.log(`${name}@${version}`)
      })
    })
  })

program
  .command('update <path>')
  .description('update CDN dependencies in HTML file')
  .action(path =>
    fs.readFile(path, 'utf8').then(html =>
      cdnm.update(html).then(newHtml => {
        if (newHtml !== html) {
          const dependencies = cdnm.list(html)
          const newDependencies = cdnm.list(newHtml)

          // Print updated dependencies
          Object.keys(dependencies).forEach(name => {
            const version = dependencies[name]
            const newVersion = newDependencies[name]
            newVersion !== version && console.log(`${name}@${version} → ${newVersion}`)
          })

          return fs.writeFile(path, newHtml)
        }
      })
    )
  )

// Setup and parsing
program
  .description(pkg.description)
  .version(pkg.version)
  .parse(process.argv)

// Display help when no command is given
program.args.length || program.help()
