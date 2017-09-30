const cdnm = require('..')

it('list', async () => {
  expect(await cdnm.list('fixture.html')).toEqual({ 'normalize.css': '6.0.0' })
})
