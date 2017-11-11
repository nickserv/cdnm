#!/usr/bin/env node
// Provides a CLI wrapper for each major function performing file IO

const cdnm = require('.')
const fsBase = require('fs')
const getStdin = require('get-stdin')
const pify = require('pify')
const yargs = require('yargs')

const fs = pify(fsBase)
const noop = () => {}
const readHtml = path => path ? fs.readFile(path, 'utf8') : getStdin()

// eslint-disable-next-line no-unused-expressions
yargs
  .usage('$0 <command> [path]')
  .command('list [path]', 'list CDN dependencies', noop, argv => {
    readHtml(argv.path).then(cdnm.list).then(dependencies => {
      // Print dependencies
      Object.keys(dependencies).forEach(name => {
        const version = dependencies[name]
        console.log([name, version && '@', version].join(''))
      })
    }).catch(console.error)
  })
  .command('outdated [path]', 'list outdated CDN dependencies in HTML file or stdin', noop, argv => {
    readHtml(argv.path).then(cdnm.outdated).then(outdated => {
      // Print outdated dependencies
      Object.keys(outdated).forEach(name => {
        const version = outdated[name][0]
        const newVersion = outdated[name][1]
        console.log(`${name}@${version} → ${newVersion}`)
      })

      // Set erroring exit code if dependencies are outdated
      if (Object.keys(outdated).length) process.exit(1)
    }).catch(console.error)
  })
  .command('package [path]', 'write package.json file for CDN dependencies', noop, argv => {
    readHtml(argv.path).then(html => {
      const pkg = JSON.stringify(cdnm.package(html), null, 2)

      return fs.writeFile('package.json', pkg)
    }).catch(console.error)
  })
  .command('update [path]', 'update CDN dependencies', noop, argv => {
    readHtml(argv.path).then(html =>
      cdnm.update(html).then(newHtml => {
        if (newHtml !== html) {
          const dependencies = cdnm.list(html)
          const newDependencies = cdnm.list(newHtml)

          // Print updated dependencies
          if (argv.path) {
            Object.keys(dependencies).forEach(name => {
              const version = dependencies[name]
              const newVersion = newDependencies[name]
              newVersion !== version && console.log(`${name}@${version} → ${newVersion}`)
            })
          }

          return argv.path ? fs.writeFile(argv.path, newHtml) : process.stdout.write(newHtml)
        }
      })
    ).catch(console.error)
  })
  .demandCommand()
  .argv
