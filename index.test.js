const cdnm = require('.')

test('list', async () => {
  await expect(cdnm.list('fixture.html')).resolves.toEqual({ 'normalize.css': '6.0.0' })
})
