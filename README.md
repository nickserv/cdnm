# cdnm (CDN Manager)
[![npm version](https://badge.fury.io/js/cdnm.svg)](https://badge.fury.io/js/cdnm)
[![Build Status](https://travis-ci.org/nickmccurdy/cdnm.svg?branch=master)](https://travis-ci.org/nickmccurdy/cdnm)

Manage dependencies through CDN URLs in HTML files. Makes maintaining
dependencies in HTML files almost as easy as using a package manager, but
without relying on a module bundler. Provides the convenience of package manager
commands like `npm ls` and `npm update` while automatically maintaining CDN URLs
with version constraints in existing HTML files. Useful for projects that depend
on packages provided by CDNs which are backed by package managers like npm.

## Supported CDNs
Currently only npm-based CDNs are supported, though [other
CDNs](https://github.com/nickmccurdy/cdnm/issues/4) are planned.

- [unpkg](https://unpkg.com)
- [jsDelivr for npm](https://www.jsdelivr.com/) (GitHub, WordPress, and combine
  endpoints are unsupported)

## Installation
1. Install Node 4 or newer.
2. `npm install --global cdnm`

## Example
```html
<!doctype html>
<html lang="en">
  <head>
    <title>Hello, world!</title>
    <link rel="stylesheet" href="https://unpkg.com/juggernaut@2.1.0/index.js">
  </head>
  <body>Hello, world!</body>
</html>
```

```cdnm update fixture.html```

```html
<!doctype html>
<html lang="en">
  <head>
    <title>Hello, world!</title>
    <link rel="stylesheet" href="https://unpkg.com/juggernaut@2.1.1/index.js">
  </head>
  <body>Hello, world!</body>
</html>
```

## Help
```

  Usage: cdnm [options] [command]

  CDN Manager: Manage dependencies through CDN URLs in HTML files.


  Options:

    -V, --version  output the version number
    -h, --help     output usage information


  Commands:

    list [path]      list CDN dependencies in HTML file or stdin
    outdated [path]  list outdated CDN dependencies in HTML file or stdin
    package [path]   write package.json file for CDN dependencies in HTML file or stdin
    update [path]    update CDN dependencies in HTML file or stdin
```
