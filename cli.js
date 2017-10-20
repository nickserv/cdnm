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
  .action(path => console.log(cdnm.list(fs.readFileSync(path, 'utf8'))))

program
  .command('update <path>')
  .description('update CDN dependencies in HTML file')
  .action(path => cdnm.update(fs.readFileSync(path, 'utf8')).then(html => fs.writeFileSync(path, html)))

// Setup and parsing
program
  .description(pkg.description)
  .version(pkg.version)
  .parse(process.argv)

// Display help when no command is given
program.args.length || program.help()
