#!/usr/bin/env node
// Provides a CLI wrapper for each major function performing file IO

const cdnm = require('.')
const program = require('commander')
const fs = require('fs')
const pkg = require('./package')

// Commands

program
  .command('list <path>')
  .description('list CDN dependencies in HTML file')
  .action(path => {
    const dependencies = cdnm.list(fs.readFileSync(path, 'utf8'))

    // Print dependencies
    Object.keys(dependencies).forEach(name => {
      const version = dependencies[name]
      console.log(`${name}@${version}`)
    })
  })

program
  .command('update <path>')
  .description('update CDN dependencies in HTML file')
  .action(path => {
    const html = fs.readFileSync(path, 'utf8')

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

        fs.writeFileSync(path, newHtml)
      }
    })
  })

// Setup and parsing
program
  .description(pkg.description)
  .version(pkg.version)
  .parse(process.argv)

// Display help when no command is given
program.args.length || program.help()
