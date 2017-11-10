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
  .description('list CDN dependencies in HTML file or stdin')
  .action(path =>
    readHtml(path).then(cdnm.list).then(dependencies => {
      // Print dependencies
      Object.keys(dependencies).forEach(name => {
        const version = dependencies[name]
        console.log([name, version && '@', version].join(''))
      })
    }).catch(console.error)
  )

program
  .command('outdated [path]')
  .description('list outdated CDN dependencies in HTML file or stdin')
  .action(path =>
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
  )

program
  .command('package [path]')
  .description('write package.json file for CDN dependencies in HTML file or stdin')
  .action(path =>
    readHtml(path).then(html => {
      const pkg = JSON.stringify(cdnm.package(html), null, 2)

      return fs.writeFile('package.json', pkg)
    }).catch(console.error)
  )

program
  .command('update [path]')
  .description('update CDN dependencies in HTML file or stdin')
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
    ).catch(console.error)
  )

// Setup and parsing
program
  .description(pkg.description)
  .version(pkg.version)
  .parse(process.argv)

// Display help when no command is given
program.args.length || program.help()
