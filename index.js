const hacktoberfestRepositoryPath = '../hacktoberfest'
const simpleGit = require('simple-git')(hacktoberfestRepositoryPath)
const puppeteer = require('puppeteer')
const _async = require('async')
const path = require('path')

function dateFormat (date) {
  const year =  date.getFullYear()
  const month =  date.getMonth()
  const day =  date.getDate()
  const hour =  date.getHours()
  const minutes =  date.getMinutes()
  const seconds =  date.getSeconds()
  return `${year}-${month}-${day}-${hour}-${minutes}-${seconds}`
}

const alph = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z']
const toAlphName = (alph, nr, name = '') =>
  nr > alph.length - 1
    ? toAlphName(
      alph,
      nr - alph.length,
      name + alph[alph.length - 1]
    )
    : name + alph[nr]


async function takeScreenshot (name, browser) {
  /* const [index, help, last] = await Promise.all([
    browser.newPage(),
    browser.newPage(),
    browser.newPage()
  ]) */
  const index = await browser.newPage()

  await index.goto(`file:${path.join(__dirname, `${hacktoberfestRepositoryPath}/index.html`)}`)
  /* await Promise.all([
    index.goto(`file:${path.join(__dirname, `${hacktoberfestRepositoryPath}/index.html`)}`),
    help.goto(`file:${path.join(__dirname, `${hacktoberfestRepositoryPath}/helpful-material.html`)}`),
    last.goto(`file:${path.join(__dirname, `${hacktoberfestRepositoryPath}/contributors.html`)}`)
  ]) */

  await index.setViewport({ height: 1920, width: 1024 })
  /* await Promise.all([
    index.setViewport({ height: 1080, width: 640 }),
    help.setViewport({ height: 1080, width: 640 }),
    last.setViewport({ height: 1080, width: 640 })
  ]) */
  await index.screenshot({ path: `images/index-loong/${name}-index.png` })
  /* await Promise.all([
    index.screenshot({ path: `images/index/${name}-index.png` }),
    help.screenshot({ path: `images/help/${name}-help.png` }),
    last.screenshot({ path: `images/contri/${name}-contru.png` })
  ]) */

  /* return await Promise.all([
    index.close(),
    help.close(),
    last.close()
  ]) */

  await help.close()
  /* await index.close() */
  /* return last.close() */
  return index.close()
}

function walkGit (commits, browser) {
  const commits2 = commits.slice(3, commits.length)

  return new Promise((resolve, reject) => {
    const length = commits2.length
    let index = 0
    _async.eachLimit(commits2.reverse(), 2, (commit, done) => {
      index += 1
      console.log(`commit: ${index} - ${length}`, commit.message)

      simpleGit
        .checkout(commit.hash, (error) => {
          if (error) {
            // swallow
            console.log('Error, could not checkout', error)
            return
          }

          takeScreenshot(toAlphName(alph, index), browser)
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

function getAllEmails (commits) {
  const mySet = new Set()

  commits.forEach((commit) => {
    mySet.add(commit.author_email)
  })

  const emails = [...mySet].filter((email) => {
    if (email.includes('@hotmail.com') || email.includes('@live.com') || email.includes('@icloud.com')) {
      return true
    }
    return false
  }).join(' ')

  console.log(emails)
}

async function start () {
  await goToMaster()
  const commits = await getAllCommits()
  /* getAllEmails(commits) */
  const browser = await puppeteer.launch()
  await walkGit(commits, browser)
  await browser.close()
}

start()
  .catch((error) => {
    console.log(error)
  })

/*
  cd images && convert -delay 0.800 -loop 0 *.png animated.gif
  ffmpeg -r 10 -i *.png -vcodec mjpeg -y movie.mp4
  ffmpeg -r 10 -i *.png -vcodec h264 -y -pix_fmt yuv420p movie2.mp4

  ffmpeg -r 1/5 -i *.png -c:v libx264 -vf fps=25 -pix_fmt yuv420p 001.mp4

  // correcty
  ffmpeg -framerate 30 -pattern_type glob -i '*.png' \
  -c:v libx264 -pix_fmt yuv420p index_small_2.mp4





  ffmpeg -framerate 1 -pattern_type glob -i '*.png' \
  -c:v libx264 -r 1 -pix_fmt yuv420p out2.mp4

  // speed

  ffmpeg -i out2.mp4 -filter:v "setpts=0.5*PTS" out3.mp4
 */
