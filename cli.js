#!/usr/bin/env node

const program = require('commander')
const cdnm = require('.')
const { version } = require('./package')

program
  .command('list <path>')
  .description('list CDN dependencies in HTML file')
  .action(async path => console.log(await cdnm.list(path)))

program
  .command('update <path>')
  .description('update CDN dependencies in HTML file')
  .action(cdnm.update)

program
  .description('CDN Manager')
  .version(version)
  .parse(process.argv)

if (!program.args.length) program.help()
