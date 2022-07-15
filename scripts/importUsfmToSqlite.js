const Database = require('better-sqlite3')
const fs = require('fs-extra')
const readline = require('readline')
const stream = require('stream')
const CryptoJS = require("react-native-crypto-js")
const { i18n, i18nNumber } = require("inline-i18n")
const { wordPartDividerRegex, defaultWordDividerRegex, passOverI18n, passOverI18nNumber, normalizeSearchStr,
        getBookIdFromUsfmBibleBookAbbr, getAllLanguages } = require("@bibletags/bibletags-ui-helper")
const { getCorrespondingRefs, getRefFromLoc, getLocFromRef } = require('@bibletags/bibletags-versification')
const { exec } = require('child_process')
require('colors')
const inquirer = require('inquirer')
inquirer.registerPrompt('file-tree-selection', require('inquirer-file-tree-selection-prompt'))
inquirer.registerPrompt('search-list', require('inquirer-search-list'))

passOverI18n(i18n)
passOverI18nNumber(i18nNumber)

const ENCRYPT_CHUNK_SIZE = 11 * 1000  // ~ 11 kb chunks (was fastest)

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
const majorTitleRegex = /^\\mte?[0-9]? .*$/
const majorSectionRegex = /^\\ms[0-9]? .*$/
const referenceRegex = /^\\[ms]?r .*$/
const sectionHeadingRegex = /^\\s[0-9p]? .*$/
const chapterCharacterRegex = /^\\cp .*$/
const chapterRegex = /^\\c ([0-9]+)$/
const paragraphWithoutContentRegex = /^\\(?:[pm]|p[ormc]|cls|pm[ocr]|pi[0-9]|mi|nb|ph[0-9])$/
const poetryWithoutContentRegex = /^\\q(?:[0-9rcad]?|m[0-9]?)$/
const psalmTitleRegex = /^\\d(?: .*)?$/
const verseRegex = /^\\v ([0-9]+)(?: .*)?$/
const wordRegex = /\\w (?:([^\|]+?)\|.*?|.*?)\\w\*/g
const extraBiblicalRegex = /(?:^\\(?:mte?|ms|s)[0-9]? .*$|^\\(?:[ms]?r|sp) .*$|\\rq .*?\\rq\*|^\\(?:cp|c) .*$|\\v [0-9]+(?: \\vp [0-9]+-[0-9]+\\vp\*)? ?)/gm
const crossRefRegex = /\\f .*?\\f\*|\\fe .*?\\fe\*/g
const footnoteRegex = /\\x .*?\\x\*/g
const allTagsRegex = /\\[a-z0-9]+ ?/g
const newlinesRegex = /\n/g
const doubleSpacesRegex = /  +/g

;(async () => {

  const replaceIfUpdated = async ({ path, tempPath, options, encryptionKey, numRows }) => {

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
      if(!decryptedPrevContents) console.log(`wrote file (${numRows} rows).`.yellow)
      if(decryptedPrevContents) console.log(`replaced file (${numRows} rows).`.pink)
    } else {
      console.log(`[no change]`.gray)
    }

  }

  try {

    console.log(``)
    console.log(`This script will walk you through importing USFM files for a translation into your Bible Tags powered app.`.yellow)
    console.log(`To cancel at any time, hit Ctrl-C. Should you discover a bug, email us at admin@bibletags.org.`.gray)
    console.log(``)

    let folders = process.argv.slice(2)
    const requires = Array(66).fill()

    const tenantChoices = (
      (await fs.readdir('./tenants'))
        .filter(path => !/^\./.test(path))
        .map(path => path.split('/').pop())
    )
    const { tenant } = await inquirer.prompt([{
      type: 'list',
      name: `tenant`,
      message: `Select the app`,
      choices: tenantChoices,
    }])

    if(folders.length === 0) {
      folders.push(
        (await inquirer.prompt([
          {
            type: 'file-tree-selection',
            name: 'usfmDir',
            message: 'Locate the directory with your USFM files',
            onlyShowDir: true,
            enableGoUpperDirectory: true,
            onlyShowValid: true,
            root: '../',
            hideRoot: true,
            validate: fileOrDir => !/^\.|node_modules/.test(fileOrDir.split('/').pop()),
          }
        ])).usfmDir
      )
    } else {
      process.stdout.write(`? `.green)
      process.stdout.write(`Locate the directory with your USFM files `.bold)
      process.stdout.write(`${folders.join(` + `)}`.cyan)
      console.log(``)
    }

    const { version } = (await inquirer.prompt([{
      type: `input`,
      name: `version`,
      message: `Enter the version id`,
      default: folders[0].split('/').reverse().filter(dirName => /^[a-z0-9]{2,9}$/.test(dirName))[0],
      validate: v => /^[a-z0-9]{2,9}$/.test(v) || `Invalid version id (must use only a-z or 0-9, and be 2-9 characters long)`,
    }]))

    let { encryptEveryXChunks } = (await inquirer.prompt([
      {
        type: 'list',
        name: `encrypt`,
        message: `Would you like to encrypt the version files that will be delivered to user’s devices from the cloud?`,
        default: false,
        choices: [
          {
            name: `Yes`,
            value: true,
          },
          {
            name: `No (recommended)`,
            value: false,
          },
        ],
      },
      {
        type: 'input',
        name: `encryptEveryXChunks`,
        message: `One in every how many chunks would like you to encrypt? (Choosing 1 will completely encrypt the files, but also comes with a significant performance hit when the text is first loaded.)`,
        default: 20,
        when: ({ encrypt }) => encrypt,
        validate: e => (parseInt(e, 10) >= 1 && parseInt(e, 10) <= 100) || `Must be a number between 1 and 100`,
      },
    ]))
    if(encryptEveryXChunks) {
      encryptEveryXChunks = parseInt(encryptEveryXChunks, 10)
    }

    const tenantDir = tenant === 'defaultTenant' ? `./${tenant}` : `./tenants/${tenant}`
    const versionsDir = `${tenantDir}/versions`
    const versionWithEncryptedIfRelevant = encryptEveryXChunks ? `${version}-encrypted` : version
    const versionDir = `${versionsDir}/${versionWithEncryptedIfRelevant}`
    const bundledVersionsDir = `${tenantDir}/assets/bundledVersions`
    const bundledVersionDir = `${bundledVersionsDir}/${versionWithEncryptedIfRelevant}`

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
      // version doesn't exist in versions.js

      let { addToVersionsJs, ...vInfo } = (await inquirer.prompt([
        {
          type: 'list',
          name: `addToVersionsJs`,
          message: `This version is missing from \`tenants/${tenant}/version.js\. Add it?`,
          choices: [
            {
              name: `Yes`,
              value: true,
            },
            {
              name: `No (i.e. cancel import)`,
              value: false,
            },
          ],
        },
        {
          type: 'input',
          name: `name`,
          message: `Version name`,
          when: ({ addToVersionsJs }) => addToVersionsJs,
        },
        {
          type: 'input',
          name: `abbr`,
          message: `Version abbreviation`,
          default: version.toUpperCase(),
          when: ({ addToVersionsJs }) => addToVersionsJs,
          validate: a => !/ /.test(a) && a.length <= 10 || `Cannot be more than 10 characters long or include a space`,
        },
        {
          type: 'search-list',
          name: `languageId`,
          message: `Language`,
          when: ({ addToVersionsJs }) => addToVersionsJs,
          choices: (
            getAllLanguages()
              .map(({ englishName, nativeName, iso6393 }) => ({
                name: englishName === nativeName ? englishName : `${nativeName} (${englishName})`,
                value: iso6393,
              }))
          ),
          pageSize: 10,
        },
        {
          type: 'input',
          name: `copyright`,
          message: `Copyright text`,
          default: `Public domain.`,
          when: ({ addToVersionsJs }) => addToVersionsJs,
        },
        {
          type: 'list',
          name: `bundled`,
          message: `Do you want to bundle this version within the initial app download? (You should do so for 1-3 versions.)`,
          choices: [
            {
              name: `Yes`,
              value: true,
            },
            {
              name: `No`,
              value: false,
            },
          ],
          when: ({ addToVersionsJs }) => addToVersionsJs,
        },
      ]))

      if(!addToVersionsJs) {
        console.log(``)
        process.exit()
      }

      versionInfo = {
        vInfo,
        id: version,
        versificationModel: 'kjv',
      }

    }

    console.log(``)

    await fs.remove(`${versionsDir}/temp`)
    await fs.ensureDir(`${versionsDir}/temp`)
    await fs.remove(`${versionsDir}/${!encryptEveryXChunks ? `${version}-encrypted` : version}`)
    await fs.remove(`${bundledVersionsDir}/${!encryptEveryXChunks ? `${version}-encrypted` : version}`)
    await fs.ensureDir(`${versionDir}/verses`)

    const getOriginalLocsFromLoc = (loc, failSilently) => {
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
        if(failSilently) return
        console.log(loc)
        throw new Error(`Versification error`)
      }

      return originalRefs.map(originalRef => getLocFromRef(originalRef).split(':')[0])
    }

    const allVerses = []

    // loop through folders
    for(let folder of folders) {

      // loop through all files, parse them and do the inserts
      const files = await fs.readdir(folder)

      for(let file of files) {
        if(!file.match(/\.u?sfm$/i)) continue

        const input = fs.createReadStream(`${folder}/${file}`)
        let bookId, chapter, insertMany, dbFilePath, dbInFormationFilePath
        const verses = []
        let goesWithNextVsText = []

        for await (let line of readLines({ input })) {

          // fix common invalid USFM where a verse range is presented (e.g. `\v 1-2`)
          line = line.replace(/\\v ([0-9]+)([-–־])([0-9]+)( \\vp .*?\\vp\*)?( |$)/g, (match, v1, dash, v2, vp, final) => {
            if(vp) {
              return `\\v ${v1}${vp}${final}`
            } else {
              return `\\v ${v1} \\vp ${v1}${dash}${v2}\\vp*${final}`
            }
          })

          if(!bookId) {

            while(!line.match(bookIdRegex)) continue
            
            const bookAbbr = line.replace(bookIdRegex, '$1')
            bookId = getBookIdFromUsfmBibleBookAbbr(bookAbbr)
      
            if(bookId < 1) break

            dbFilePath = `${versionDir}/verses/${bookId}.db`
            dbInFormationFilePath = `${versionsDir}/temp/${bookId}-inFormation.db`
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

            process.stdout.write(`Importing ${bookAbbr}...`)
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
            || referenceRegex.test(line)
            || sectionHeadingRegex.test(line)
            || chapterRegex.test(line)
            || chapterCharacterRegex.test(line)
            || paragraphWithoutContentRegex.test(line)
            || poetryWithoutContentRegex.test(line)
          ) {
            goesWithNextVsText.push(line)
            continue
          }

          // get verse
          if(verseRegex.test(line) || psalmTitleRegex.test(line)) {

            let verse

            if(psalmTitleRegex.test(line)) {
              verse = '0'

            } else {
              verse = line.replace(verseRegex, '$1')
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

          if(verses.length === 0) throw new Error(`File contains unknown marker prior to first verse.`)

          verses[verses.length - 1].usfm = [
            ...verses[verses.length - 1].usfm,
            ...goesWithNextVsText,
            line,
          ]
          goesWithNextVsText = []

        }

        verses.forEach(verse => {
          verse.usfm = verse.usfm.join("\n")
        })

        // console.log(verses.slice(0,5))
        insertMany(verses)
        allVerses.push(verses)

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
          numRows: verses.length,
        })

        requires[bookId-1] = `require("./verses/${bookId}.db"),`

      }

    }

    let extraRequires = ``

    if(version === 'original') {

      extraRequires = `
          require("./definitions.db"),
      `

    } else {

      console.log(``)
      process.stdout.write(`Creating search database...`)

      allVerses.forEach(verses => {
        let wordNumber = 0

        verses.forEach(verse => {

          const newWords = (
            normalizeSearchStr({
              str: (
                verse.usfm
                  .replace(wordRegex, '$1')
                  .replace(extraBiblicalRegex, '')
                  .replace(footnoteRegex, '')
                  .replace(crossRefRegex, '')
                  .replace(allTagsRegex, '')
                  .replace(wordPartDividerRegex, '')
                  .replace(versionInfo.wordDividerRegex || defaultWordDividerRegex, ' ')
                  .replace(newlinesRegex, ' ')
                  .replace(doubleSpacesRegex, ' ')
                  .trim()
              )
            })
              .split(' ')
              .filter(Boolean)
          )

          const originalLocs = verse.loc ? getOriginalLocsFromLoc(verse.loc) : []
          const originalLoc = `${originalLocs[0]}-${originalLocs.length > 1 ? originalLocs.slice(-1)[0] : ``}`
          // previous line purposely has a dash at the end if it is not a range; this is so that the object keys keep insert ordering

          newWords.forEach(word => {

            wordNumber++

            scopeMapsById[`verse:${word}`] = scopeMapsById[`verse:${word}`] || {}
            scopeMapsById[`verse:${word}`][originalLoc] = scopeMapsById[`verse:${word}`][originalLoc] || []
            scopeMapsById[`verse:${word}`][originalLoc].push(wordNumber)

          })

        })
      })

      const orderedScopeMapsById = {}
      Object.keys(scopeMapsById).forEach(id => {
        orderedScopeMapsById[id] = {}
        const originalLocs = Object.keys(scopeMapsById[id])
        originalLocs.sort()
        originalLocs.forEach(originalLoc => {
          orderedScopeMapsById[id][originalLoc] = scopeMapsById[id][originalLoc]
        })
      })

      await fs.ensureDir(`${versionDir}/search`)
      const dbFilePath = `${versionDir}/search/unitWords.db`
      const dbInFormationFilePath = `${versionsDir}/temp/unitWords-inFormation.db`
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
        Object.keys(orderedScopeMapsById).forEach(id => {
          insert.run({ id, scopeMap: JSON.stringify(orderedScopeMapsById[id]) })
        })
      })()

      await replaceIfUpdated({
        path: dbFilePath,
        tempPath: dbInFormationFilePath,
        options: { encoding: 'base64' },
        numRows: Object.values(scopeMapsById).length,
      })

    }

    await fs.remove(`${versionsDir}/temp`)

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

    // TODO: uncomment this!
    // // update tenant and sync them to dev
    // if(version !== 'original') {
    //   console.log(``)
    //   console.log(`Rerunning \`change-tenant\`...`)
    //   await new Promise(resolve => exec(`find tenants/${tenant} -name ".DS_Store" -delete`, resolve))
    //   await new Promise((resolve, reject) => {
    //     exec(
    //       `npm run change-tenant ${tenant}`,
    //       (error, stdout, stderr) => {
    //         if(error !== null || stderr) {
    //           console.log(`Error in rerunning \`change-tenant\`: ${error || stderr}`)
    //           reject()
    //         } else if(stdout.includes(`...done.`)) {
    //           console.log(stdout.split('\n').filter(line => !/^> /.test(line)).join('\n').replace(/\n\n+/g, '\n\n'))
    //           resolve()
    //         } else if(stdout) {
    //           console.log(stdout)
    //         }
    //       }
    //     )
    //   })
    // }

    // if(version !== 'original') {

    //   console.log(removeIndent(`
    //     Successfully...
    //       (1) created sqlite db files
    //       (2) placed them into \`${versionDir}\`${versionInfo.bundled ? ` and \`${bundledVersionDir}\`` : ``}
    //       (3) updated versions.js
    //       (4) reran change-tenant
    //       (5) synced \`${versionsDir}\` to the cloud for use in dev
    //       (6) submitted word hashes for ${version} to the dev db for bibletags-data
    //   `))

    // }

  } catch(err) {

    console.log(``)
    console.log(`ERROR: ${err.message}`.bgRed.brightWhite)
    console.log(``)

  }

  process.exit()

})()
