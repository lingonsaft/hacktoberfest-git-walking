const hacktoberfestRepositoryPath = '../hacktoberfest'
const simpleGit = require('simple-git')(hacktoberfestRepositoryPath)
const puppeteer = require('puppeteer')
const _async = require('async')
const path = require('path')

async function takeScreenshot (name, browser) {
  const page = await browser.newPage()

  await page.goto(`file:${path.join(__dirname, `${hacktoberfestRepositoryPath}/index.html`)}`)
  await page.setViewport({ height: 1600, width: 1600 })
  await page.screenshot({ path: `images/${name}.png` })
  return page.close()
}

function walkGit (commits, browser) {
  return new Promise((resolve, reject) => {
    const length = commits.length
    let index = 0
    _async.eachLimit(commits.reverse(), 4, (commit, done) => {
      index += 1
      console.log(`commit: ${index} - ${length}`, commit)

      simpleGit
        .checkout(commit.hash, (error) => {
          if (error) {
            // swallow
            console.log('Error, could not checkout', error)
            return
          }

          takeScreenshot(new Date(commit.date).toISOString(), browser)
            .then(done)
            .catch((error) => {
              console.log(`Error, failed on ${index}`, commit)
              console.log(error)
              // swallow
              done()
            })
        })
    }, (error) => {
      if (error) {
        return reject(error)
      }
      resolve()
    })
  })
}

function getAllCommits () {
  return new Promise((resolve, reject) => {
    simpleGit.log((err, commits) => {
      if (err) {
        return reject(err)
      }
      resolve(commits.all)
    })
  })
}

function goToMaster () {
  return new Promise((resolve, reject) => {
    simpleGit
      .checkout('master', (error) => {
        if (error) {
          reject(error)
        }
        resolve()
      })
  })
}

async function start () {
  await goToMaster()
  const commits = await getAllCommits()
  const browser = await puppeteer.launch()
  await walkGit(commits, browser)
  await browser.close()
}

start()
  .catch((error) => {
    console.log(error)
  })
