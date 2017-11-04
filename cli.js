#!/usr/bin/env node
// Provides a CLI wrapper for each major function performing file IO

const cdnm = require('.')
const program = require('commander')
const fsBase = require('fs')
const getStdin = require('get-stdin')
const pkg = require('./package')
const pify = require('pify')

const fs = pify(fsBase)

const readHtml = path => path ? fs.readFile(path, 'utf8') : getStdin()

// Commands

program
  .command('list [path]')
  .description('list CDN dependencies in HTML file')
  .action(path =>
    readHtml(path).then(html => {
      const dependencies = cdnm.list(html)

      // Print dependencies
      Object.keys(dependencies).forEach(name => {
        const version = dependencies[name]
        console.log([name, version && '@', version].join(''))
      })
    })
  )

program
  .command('update [path]')
  .description('update CDN dependencies in HTML file')
  .action(path =>
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
    )
  )

// Setup and parsing
program
  .description(pkg.description)
  .version(pkg.version)
  .parse(process.argv)

// Display help when no command is given
program.args.length || program.help()
