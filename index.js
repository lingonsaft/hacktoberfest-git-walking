const simpleGit = require('simple-git')('../hacktoberfest')
const puppeteer = require('puppeteer')
const _async = require('async')
const path = require('path')

async function takeScreenshot (name) {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()

  await page.goto(`file:${path.join(__dirname, '../hacktoberfest/index.html')}`)
  await page.setViewport({ height: 1600, width: 1600 })
  await page.screenshot({ path: `images/${name}.png` })
  return browser.close()
}

function walkGit () {
  return new Promise((resolve) => {
    simpleGit.log((err, commits) => {
      if (err) {
        return console.log('error', err)
      }
      const length = commits.all.length
      let index = 0

      _async.eachSeries(commits.all.reverse(), (commit, done) => {
        index += 1
        console.log(`commit: ${index} - ${length}`, commit)

        simpleGit
          .checkout(commit.hash, () => {
            takeScreenshot(new Date(commit.date).toISOString())
              .then(done)
              .catch(() => done())
          })
      }, () => {
        resolve()
      })
    })
  })
}

walkGit()
