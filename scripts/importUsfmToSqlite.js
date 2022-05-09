const Database = require('better-sqlite3')
const fs = require('fs-extra')
const readline = require('readline')
const stream = require('stream')
const CryptoJS = require("react-native-crypto-js")
const { wordPartDividerRegex, defaultWordDividerRegex } = require("@bibletags/bibletags-ui-helper")
const { getCorrespondingRefs, getRefFromLoc, getLocFromRef } = require('@bibletags/bibletags-versification')
const { exec } = require('child_process')

const ENCRYPT_CHUNK_SIZE = 11 * 1000  // ~ 11 kb chunks (was fastest)

const bookAbbrs = [
  "",
  "GEN",
  "EXO",
  "LEV",
  "NUM",
  "DEU",
  "JOS",
  "JDG",
  "RUT",
  "1SA",
  "2SA",
  "1KI",
  "2KI",
  "1CH",
  "2CH",
  "EZR",
  "NEH",
  "EST",
  "JOB",
  "PSA",
  "PRO",
  "ECC",
  "SNG",
  "ISA",
  "JER",
  "LAM",
  "EZK",
  "DAN",
  "HOS",
  "JOL",
  "AMO",
  "OBA",
  "JON",
  "MIC",
  "NAM",
  "HAB",
  "ZEP",
  "HAG",
  "ZEC",
  "MAL",
  "MAT",
  "MRK",
  "LUK",
  "JHN",
  "ACT",
  "ROM",
  "1CO",
  "2CO",
  "GAL",
  "EPH",
  "PHP",
  "COL",
  "1TH",
  "2TH",
  "1TI",
  "2TI",
  "TIT",
  "PHM",
  "HEB",
  "JAS",
  "1PE",
  "2PE",
  "1JN",
  "2JN",
  "3JN",
  "JUD",
  "REV",
]

const readLines = ({ input }) => {
  const output = new stream.PassThrough({ objectMode: true })
  const rl = readline.createInterface({ input })
  rl.on("line", line => { 
    output.write(line)
  })
  rl.on("close", () => {
    output.push(null)
  })
  return output
}

const sliceStr = ({ str, sliceSize }) => {
  const slices = []
  for(let i=0, length=str.length; i<length; i+=sliceSize) {
    slices.push(str.substring(i, i + sliceSize))
  }
  return slices
}

const removeIndent = str => {
  const lines = str.split(`\n`)
  const numSpacesInIndent = (lines[0] || lines[1]).match(/^ */)[0].length
  return lines.map(line => line.replace(new RegExp(` {1,${numSpacesInIndent}}`), ``)).join(`\n`)
}

// See the Search component for some of the same variables
const bookIdRegex = /^\\id ([A-Z1-3]{3}) .*$/
const irrelevantLinesRegex = /^\\(?:usfm|ide|h|toc[0-9]*)(?: .*)?$/
const majorTitleRegex = /^\\mt[0-9]? .*$/
const majorSectionRegex = /^\\ms[0-9]? .*$/
const sectionRegex = /^\\s[0-9]? .*$/
const chapterCharacterRegex = /^\\cp .*$/
const chapterRegex = /^\\c ([0-9]+)$/
const paragraphRegex = /^\\(?:[pm]|p[ormc]|cls|pm[ocr]|pi[0-9]|mi|nb|ph[0-9])(?: .*)?$/
const poetryRegex = /^\\q(?:[0-9rcad]?|m[0-9]?)(?: .*)?$/
const psalmTitleRegex = /^\\d(?: .*)?$/
const verseRegex = /^\\v ([0-9]+)(?: .*)?$/
const wordRegex = /\\w (?:([^\|]+?)\|.*?|.*?)\\w\*/g
const extraBiblicalRegex = /(?:^\\(?:mt|ms|s)[0-9]? .*$|^\\(?:cp|c) .*$|\\v [0-9]+(?: \\vp [0-9]+-[0-9]+\\vp\*)? ?)/gm
const crossRefRegex = /\\f .*?\\f\*|\\fe .*?\\fe\*/g
const footnoteRegex = /\\x .*?\\x\*/g
const allTagsRegex = /\\[a-z0-9]+ ?/g
const hebrewCantillationRegex = /[\u0591-\u05AF\u05A5\u05BD\u05BF\u05C0\u05C5\u05C7]/g
const hebrewVowelsRegex = /[\u05B0-\u05BC\u05C1\u05C2\u05C4]/g
String.prototype.normalizeGreek = function () { return this.normalize('NFD').replace(/[\u0300-\u036f]/g, "") }
const newlinesRegex = /\n/g
const doubleSpacesRegex = /  +/g

;(async () => {

  const replaceIfUpdated = async ({ path, tempPath, options, encryptionKey }) => {

    const decrypt = encryptedContent => (
      encryptedContent
        .split('\n')
        .map(slice => (
          slice.substring(0, 1) === '@'
            ? CryptoJS.AES.decrypt(slice.substring(1), encryptionKey).toString(CryptoJS.enc.Utf8)
            : slice
        ))
        .join('')
    )

    const contents = await fs.readFile(tempPath, options)
    let decryptedContents = contents
    let decryptedPrevContents
    try {
      decryptedPrevContents = await fs.readFile(path, options)
    } catch(e) {}
    if(encryptionKey) {
      decryptedContents = decrypt(decryptedContents)
      decryptedPrevContents = decryptedPrevContents && decrypt(decryptedPrevContents)
    }

    await fs.remove(tempPath)

    if(decryptedContents !== decryptedPrevContents) {
      await fs.writeFile(path, contents, options)
      if(decryptedPrevContents) console.log(`  > Overwriting`)
    }

  }

  try {

    const params = process.argv.slice(2)
    const encryptEveryXChunks = /^encrypt/.test(params.slice(-1)[0]) ? (parseInt(params.pop().substr("encrypt=".length)) || 20) : false
    const tenant = params.pop()
    const version = params.pop()
    const folders = params
    const requires = Array(66).fill()

    const tenantDir = tenant === 'defaultTenant' ? `./${tenant}` : `./tenants/${tenant}`
    const versionsDir = `${tenantDir}/versions`
    const versionWithEncryptedIfRelevant = encryptEveryXChunks ? `${version}-encrypted` : version
    const versionDir = `${versionsDir}/${versionWithEncryptedIfRelevant}`
    const bundledVersionsDir = `${tenantDir}/assets/bundledVersions`
    const bundledVersionDir = `${bundledVersionsDir}/${versionWithEncryptedIfRelevant}`

    if(!tenant) {
      throw new Error(`NO_PARAMS`)
    }

    if(!await fs.pathExists(tenantDir)) {
      throw new Error(`Invalid tenant.`)
    }

    const appJsonUri = `${tenantDir}/app.json`
    const appJson = await fs.readJson(appJsonUri)
    const encryptionKey = appJson.expo.extra.BIBLE_VERSIONS_FILE_SECRET || "None"

    const scopeMapsById = {}
    let versionInfo, versionsFile
    try {
      versionsFile = fs.readFileSync(`${tenantDir}/versions.js`, { encoding: 'utf8' })
      const matches = (
        versionsFile
          .replace(/copyright\s*:\s*removeIndentAndBlankStartEndLines\(`(?:[^`]|\\n)+`\)\s*,?/g, '')  // get rid of removeIndentAndBlankStartEndLines
          .replace(/files\s*:.*/g, '')  // get rid of files: requires
          .replace(/\/\/.*|\/\*(?:.|\n)*?\*\//g, '')  // get rid of comments
          .match(new RegExp(`{(?:(?:[^{}\\n]|{[^}]*})*\\n)*?[\\t ]*(?:id|"id"|'id')[\\t ]*:[\\t ]*(?:"${version}"|'${version}')[\\t ]*,[\\t ]*\\n(?:(?:[^{}\\n]|{[^}]*})*\\n)*(?:[^{}\\n]|{[^}]*})*}`))
      )
      versionInfo = eval(`(${matches[0]})`)
    } catch(err) {
      throw new Error(`${version} doesn’t exist or is malformed. Add this version to \`tenants/${tenant}/version.js\` in the proper format.`)
    }

    await fs.remove(`${versionsDir}/${!encryptEveryXChunks ? `${version}-encrypted` : version}`)
    await fs.remove(`${bundledVersionsDir}/${!encryptEveryXChunks ? `${version}-encrypted` : version}`)
    await fs.ensureDir(`${versionDir}/verses`)

    // loop through folders
    for(let folder of folders) {

      // loop through all files, parse them and do the inserts
      const files = await fs.readdir(folder)

      for(let file of files) {
        if(!file.match(/\.u?sfm$/i)) continue

        const input = fs.createReadStream(`${folder}/${file}`)
        let bookId, chapter, insertMany, dbFilePath, dbInFormationFilePath
        const verses = []
        let wordNumber = 0
        let lastVerse = 0
        let goesWithNextVsText = []

        for await (const line of readLines({ input })) {

          if(!bookId) {

            while(!line.match(bookIdRegex)) continue
            
            const bookAbbr = line.replace(bookIdRegex, '$1')
            bookId = bookAbbrs.indexOf(bookAbbr)
      
            if(bookId < 1) break

            dbFilePath = `${versionDir}/verses/${bookId}.db`
            dbInFormationFilePath = `${versionDir}/verses/${bookId}-inFormation.db`
            const db = new Database(dbInFormationFilePath)

            const tableName = `${version}VersesBook${bookId}`

            const create = db.prepare(
              `CREATE TABLE ${tableName} (
                loc TEXT PRIMARY KEY,
                usfm TEXT
              );`
            )

            create.run()

            const insert = db.prepare(`INSERT INTO ${tableName} (loc, usfm) VALUES (@loc, @usfm)`)

            insertMany = db.transaction((verses) => {
              for(const verse of verses) insert.run(verse)
            })

            console.log(`Importing ${bookAbbr}...`)
            continue

          }

          if(line === '') continue
          if(irrelevantLinesRegex.test(line)) continue

          // get chapter
          if(chapterRegex.test(line)) {
            chapter = line.replace(chapterRegex, '$1')
          }

          // get tags which connect to verse text to follow
          if(
            majorTitleRegex.test(line)
            || majorSectionRegex.test(line)
            || sectionRegex.test(line)
            || chapterRegex.test(line)
            || chapterCharacterRegex.test(line)
            || paragraphRegex.test(line)
            || poetryRegex.test(line)
          ) {
            goesWithNextVsText.push(line)
            continue
          }

          // get verse
          if(verseRegex.test(line) || psalmTitleRegex.test(line)) {

            let verse

            if(psalmTitleRegex.test(line)) {
              verse = '0'
              lastVerse = 0

            } else {
              verse = line.replace(verseRegex, '$1')
              if(verse !== '1' && parseInt(verse, 10) !== lastVerse + 1) {
                console.log(`  > Non-consecutive verses: ${chapter}:${lastVerse} > ${chapter}:${verse}`)
              }
              lastVerse = parseInt(verse, 10)
            }  

            verses.push({
              loc: getLocFromRef({ bookId, chapter, verse }),
              usfm: [
                ...goesWithNextVsText,
                line,
              ],
            })
            goesWithNextVsText = []
            continue
          }

          // add on verse text
          verses[verses.length - 1].usfm = [
            ...verses[verses.length - 1].usfm,
            ...goesWithNextVsText,
            line,
          ]
          goesWithNextVsText = []

        }

        verses.forEach(verse => {
          verse.usfm = verse.usfm.join("\n")

          if(version !== 'original') {

            const getOriginalLocsFromLoc = loc => {
              const originalRefs = getCorrespondingRefs({
                baseVersion: {
                  info: versionInfo,
                  ref: getRefFromLoc(loc),
                },
                lookupVersionInfo: {
                  versificationModel: 'original',
                },
              })

              if(!originalRefs) {
                console.log(loc)
                throw new Error(`Versification error`)
              }

              return originalRefs.map(originalRef => getLocFromRef(originalRef).split(':')[0])
            }

            const newWords = (
              verse.usfm
                .replace(wordRegex, '$1')
                .replace(extraBiblicalRegex, '')
                .replace(footnoteRegex, '')
                .replace(crossRefRegex, '')
                .replace(allTagsRegex, '')
                .replace(hebrewCantillationRegex, '')
                .replace(hebrewVowelsRegex, '')
                .normalizeGreek()
                .replace(wordPartDividerRegex, '')
                .replace(versionInfo.wordDividerRegex || defaultWordDividerRegex, ' ')
                .replace(newlinesRegex, ' ')
                .replace(doubleSpacesRegex, ' ')
                .trim()
                .toLowerCase()
                .split(' ')
                .filter(Boolean)
            )

            const originalLocs = verse.loc ? getOriginalLocsFromLoc(verse.loc) : []
            let originalLoc = `${originalLocs[0]}-${originalLocs.length > 1 ? originalLocs.slice(-1)[0] : ``}`
            // previous line purposely has a dash at the end if it is not a range; this is so that the object keys keep insert ordering

            newWords.forEach(word => {

              wordNumber++

              scopeMapsById[`verse:${word}`] = scopeMapsById[`verse:${word}`] || {}
              scopeMapsById[`verse:${word}`][originalLoc] = scopeMapsById[`verse:${word}`][originalLoc] || []
              scopeMapsById[`verse:${word}`][originalLoc].push(wordNumber)

            })

          }

        })

        // console.log(verses.slice(0,5))
        insertMany(verses)

        if(encryptEveryXChunks) {
          const base64Contents = await fs.readFile(dbInFormationFilePath, { encoding: 'base64' })
          const base64Slices = sliceStr({ str: base64Contents, sliceSize: ENCRYPT_CHUNK_SIZE })
          const base64SlicesSomeEncrypted = base64Slices.map((slice, idx) => (
            idx % encryptEveryXChunks === 0
              ? `@${CryptoJS.AES.encrypt(slice, encryptionKey).toString()}`
              : slice
          ))
          const encryptedContents = base64SlicesSomeEncrypted.join('\n')
          await fs.writeFile(dbInFormationFilePath, encryptedContents)
        }

        await replaceIfUpdated({
          path: dbFilePath,
          tempPath: dbInFormationFilePath,
          options: !encryptEveryXChunks ? { encoding: 'base64' } : { encoding: 'utf8' },
          encryptionKey,
        })

        requires[bookId-1] = `require("./verses/${bookId}.db"),`

        console.log(`  ...inserted ${verses.length} verses.`)

      }

    }

    let extraRequires = ``

    if(version === 'original') {

      extraRequires = `
          require("./definitions.db"),
      `

    } else {

      console.log(``)
      console.log(`Creating unitWords db...`)

      await fs.ensureDir(`${versionDir}/search`)
      const dbFilePath = `${versionDir}/search/unitWords.db`
      const dbInFormationFilePath = `${versionDir}/search/unitWords-inFormation.db`
      const db = new Database(dbInFormationFilePath)
      const tableName = `${version}UnitWords`

      const create = db.prepare(
        `CREATE TABLE ${tableName} (
          id TEXT PRIMARY KEY,
          scopeMap TEXT
        );`
      )
      create.run()

      const insert = db.prepare(`INSERT INTO ${tableName} (id, scopeMap) VALUES (@id, @scopeMap)`)
      db.transaction(() => {
        Object.keys(scopeMapsById).forEach(id => {
          insert.run({ id, scopeMap: JSON.stringify(scopeMapsById[id]) })
        })
      })()

      await replaceIfUpdated({
        path: dbFilePath,
        tempPath: dbInFormationFilePath,
        options: { encoding: 'base64' },
      })

      console.log(`  ...inserted ${Object.values(scopeMapsById).length} rows.`)
    }

    if(version === 'original' || versionInfo.bundled) {

      await fs.ensureDir(`${bundledVersionDir}/verses`)
      await fs.copy(`${versionDir}/verses`, `${bundledVersionDir}/verses`, { overwrite: true })

      const requiresContent = removeIndent(`
        const requires = [
          ${requires.join(`\n          `)}
          ${extraRequires}
        ]

        export default requires 
      `)

      await fs.writeFile(`${bundledVersionDir}/requires.js`, requiresContent)

    }

    // update versions.js
    let newVersionsFile = versionsFile
    newVersionsFile = newVersionsFile.replace(new RegExp(` *import ${version}Requires from '\\./assets/bundledVersions/${!encryptEveryXChunks ? `${version}-encrypted` : version}/requires'.*\\n`), ``)
    const newImportLine = `import ${version}Requires from './assets/bundledVersions/${versionWithEncryptedIfRelevant}/requires'`
    const newFilesLine = `    files: ${version}Requires,`

    if(versionInfo.bundled) {
      if(!newVersionsFile.includes(newImportLine)) {
        newVersionsFile = newVersionsFile.replace(/((?:^|\n)[^\/].*\n)/, `$1${newImportLine}\n`)
      }
      if(!newVersionsFile.includes(newFilesLine)) {
        newVersionsFile = newVersionsFile.replace(new RegExp(`(\\n[\\t ]*(?:id|"id"|'id')[\\t ]*:[\\t ]*(?:"${version}"|'${version}')[\\t ]*,[\\t ]*\\n)`), `$1${newFilesLine}\n`)
      }
    } else {
      if(newVersionsFile.includes(newImportLine)) {
        newVersionsFile = newVersionsFile.replace(new RegExp(` *import ${version}Requires from '\\./assets/bundledVersions/${versionWithEncryptedIfRelevant}/requires'.*\\n`), ``)
      }
      if(newVersionsFile.includes(newFilesLine)) {
        newVersionsFile = newVersionsFile.replace(new RegExp(`\\n[\\t ]*files: ${version}Requires,[\\t ]*`), ``)
      }
    }

    const versionRevisionNumRegexp = new RegExp(`(\\n[\\t ]*(?:${version}RevisionNum|"${version}RevisionNum"|'${version}RevisionNum')[\\t ]*:[\\t ]*)[0-9]+([\\t ]*,[\\t ]*\\n)`)
    if(versionRevisionNumRegexp.test(newVersionsFile)) {
      newVersionsFile = newVersionsFile.replace(versionRevisionNumRegexp, `$1${versionInfo[`${version}RevisionNum`] + 1}$2`)
    } else {
      newVersionsFile = newVersionsFile.replace(new RegExp(`(\\n[\\t ]*(?:files|"files"|'files')[\\t ]*:[\\t ]*${version}Requires[\\t ]*,[\\t ]*\\n)`), `$1    ${version}RevisionNum: 1,\n`)
    }
    if(encryptEveryXChunks && !versionInfo.encrypted) {
      newVersionsFile = newVersionsFile.replace(new RegExp(`(\\n[\\t ]*(?:files|"files"|'files')[\\t ]*:[\\t ]*${version}Requires[\\t ]*,[\\t ]*\\n)`), `$1    encrypted: true,\n`)
    } else if(!encryptEveryXChunks && versionInfo.encrypted) {
      newVersionsFile = newVersionsFile.replace(new RegExp(`(\\n[\\t ]*(?:id|"id"|'id')[\\t ]*:[\\t ]*(?:"${version}"|'${version}')[\\t ]*,[\\t ]*(?:(?:[^{}\\n]|{[^}]*})*\\n)*?)[\\t ]*encrypted[\\t ]*:[\\t ]*true[\\t ]*,[\\t ]*\\n`), `$1`)
    }
    await fs.writeFile(`${tenantDir}/versions.js`, newVersionsFile)
    console.log(``)
    console.log(`Updated ${tenantDir}/versions.js`)

    // update tenant and sync them to dev
    if(version !== 'original') {
      console.log(``)
      console.log(`Starting \`bibletags-data\` to be able to submit word hashes locally...`)
      exec(`cd ../bibletags-data && npm start`)
      console.log(``)
      console.log(`Rerunning \`change-tenant\`...`)
      await new Promise(resolve => exec(`find tenants/${tenant} -name ".DS_Store" -delete`, resolve))
      await new Promise((resolve, reject) => {
        exec(
          `npm run change-tenant ${tenant}`,
          (error, stdout, stderr) => {
            if(error !== null || stderr) {
              console.log(`Error in rerunning \`change-tenant\`: ${error || stderr}`)
              reject()
            } else if(stdout.includes(`...done.`)) {
              console.log(stdout.split('\n').filter(line => !/^> /.test(line)).join('\n').replace(/\n\n+/g, '\n\n'))
              resolve()
            }
          }
        )
      })
      exec(`kill -9 $(lsof -i:8082 -t) 2> /dev/null`)  // kills the npm start on /bibletags-data
    }

    if(version !== 'original') {

      console.log(removeIndent(`
        Successfully...
          (1) created sqlite db files
          (2) placed them into \`${versionDir}\`${versionInfo.bundled ? ` and \`${bundledVersionDir}\`` : ``}
          (3) updated versions.js
          (4) reran change-tenant
          (5) synced \`${versionsDir}\` to the cloud for use in dev
          (6) submitted word hashes for ${version} to the dev db for bibletags-data
      `))

    }

  } catch(err) {

    const logSyntax = () => {
      console.log(`Syntax: \`npm run usfm-to-sqlite -- path/to/directory/of/usfm/files [optional/path/to/second/directory/of/usfm/files] versionId tenant [encrypt[=encryptEveryXChunks]]\`\n`)
      console.log(`Example #1: \`npm run usfm-to-sqlite -- ../../versions/esv esv bibletags\``)
      console.log(`Example #2: \`npm run usfm-to-sqlite -- ../../versions/esv esv bibletags encrypt\``)
      console.log(`Example #3: \`npm run usfm-to-sqlite -- ../../versions/esv esv bibletags encrypt=10\``)
      console.log(`Note: You may completely encrypt a version by sending encrypt=1. However, this will cause a significant performance hit when the text is first loaded. The bare \`encrypt\` flag will default to encrypting every 20 chunks. Do not include this flag to leave the file(s) unencrypted.\n`)
    }

    switch(err.message.split(',')[0]) {

      case `NO_PARAMS`: {
        logSyntax()
        break
      }

      default: {
        console.log(`\nERROR: ${err.message}\n`)
        logSyntax()
      }

    }
  }

  process.exit()

})()
