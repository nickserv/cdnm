const cdnm = require('..')

it('list', () => {
  return cdnm.list('fixture.html').then(actual => {
    expect(actual).toEqual({
      'normalize.css': '6.0.0'
    })
  })
})
