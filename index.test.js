const cdnm = require('.')

test('list', () => {
  return expect(cdnm.list('fixture.html')).resolves.toEqual({
    'normalize.css': '6.0.0'
  })
})
