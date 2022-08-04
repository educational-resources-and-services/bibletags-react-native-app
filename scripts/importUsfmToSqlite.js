const Database = require('better-sqlite3')
const fs = require('fs-extra')
const readline = require('readline')
const stream = require('stream')
const CryptoJS = require("react-native-crypto-js")
const { i18n, i18nNumber } = require("inline-i18n")
const { wordPartDividerRegex, defaultWordDividerRegex, passOverI18n, passOverI18nNumber, normalizeSearchStr,
        getBookIdFromUsfmBibleBookAbbr, getAllLanguages, getBibleBookName } = require("@bibletags/bibletags-ui-helper")
const { getCorrespondingRefs, getRefFromLoc, getLocFromRef, getVerseMappingsByVersionInfo, getNextOriginalLoc, getPreviousOriginalLoc } = require('@bibletags/bibletags-versification')
const { exec } = require('child_process')
require('colors')
const inquirer = require('inquirer')
inquirer.registerPrompt('file-tree-selection', require('inquirer-file-tree-selection-prompt'))
inquirer.registerPrompt('search-list', require('inquirer-search-list'))
inquirer.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'))
const { request, gql } = require('graphql-request')
const Spinnies = require('spinnies')
const spinnies = new Spinnies()

const goSyncVersions = require('./goSyncVersions')
const confirmAndCorrectMapping = require('./utils/confirmAndCorrectMapping')

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
const poetryWithoutBiblicalContentRegex = /^\\q(?:[0-9rcd]?|m[0-9]?|a .*)$/
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

  // NOTE: Leave this comment for easy testing when I hit a bug
  // console.log(
  //   await confirmAndCorrectMapping({
  //     originalLocs: ['58012022'],
  //     versionInfo: {
  //       id: 'sdf',
  //       versificationModel: 'kjv',
  //     },
  //     tenant: 'biblearc',
  //     progress: 0
  //   })
  // )
  // process.exit()

  let hasChange
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
      if(decryptedPrevContents) console.log(`replaced file (${numRows} rows).`.magenta)
      hasChange = true
    } else {
      console.log(`[no change]`.gray)
    }

  }

  try {

    console.log(``)
    console.log(`This script will walk you through importing USFM files (of a Bible translation) into your Bible Tags powered app.`.yellow)
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

    spinnies.add('get-versions', { text: `Looking up existing versions (see downloads.bibletags.org)` })

    let existingVersions
    try {
      const response = await request(
        `https://data.bibletags.org/graphql`,
        gql`
          query {
            versions {
              id
              name
              languageId
              wordDividerRegex
              partialScope
              versificationModel
              skipsUnlikelyOriginals
              extraVerseMappings
            }
          }
        `,
      )
      existingVersions = response.versions
      spinnies.succeed('get-versions', { text: 'Found existing versions list for search (see downloads.bibletags.org)' })
    } catch(err) {
      spinnies.fail('get-versions', { text: 'Could not fetch existing versions from data.bibletags.org.' })
    }

    const defaultVersionId = folders[0].split('/').reverse().map(dirName => dirName.toLowerCase()).filter(dirName => /^[a-z0-9]{2,9}$/.test(dirName))[0]
    const noneFoundMessage = `None found. CREATE A NEW VERSION`
    let { versionStr, versionId } = (await inquirer.prompt([
      {
        type: 'autocomplete',
        name: 'versionStr',
        message: 'Version',
        when: () => !!existingVersions,
        source: async (answersSoFar, input) => {
          const lowerCaseInput = (input || "").toLowerCase()
          const options = []

          if(input === undefined && defaultVersionId) {
            const defaultVersion = existingVersions.find(({ id }) => id === defaultVersionId)
            if(defaultVersion) {
              options.push(`${defaultVersion.name} (ID: ${defaultVersion.id})`)
            }
          }

          for(let version of existingVersions) {
            if(version.id === defaultVersionId) continue
            if(
              version.id.indexOf(lowerCaseInput) === 0
              || (
                version.name.split(' ').some(nameWord => (
                  nameWord.toLowerCase().indexOf(lowerCaseInput) === 0
                ))
              )
            ) {
              options.push(`${version.name} (ID: ${version.id})`)
              if(options.length >= 10) break
            }
          }

          if(options.length === 0) {
            options.push(noneFoundMessage)
          }

          return options
        },
      },
      {
        type: `input`,
        name: `versionId`,
        message: `Enter a new version id`,
        default: defaultVersionId,
        when: ({ versionStr }) => !existingVersions || versionStr === noneFoundMessage,
        validate: v => (
          (!/^[a-z0-9]{2,9}$/.test(v) && `Invalid version id (must use only a-z or 0-9, and be 2-9 characters long)`)
          || ((existingVersions || []).some(({ id }) => id === v) && `That version id is already in use`)
          || true
        ),
      },
    ]))
    if(!versionId) {
      versionId = versionStr.match(/\(ID: ([a-z0-9]{2,9})\)$/)[1]
    }
    let versionInfo = existingVersions.find(({ id }) => id === versionId) || {}

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
    const versionWithEncryptedIfRelevant = encryptEveryXChunks ? `${versionId}-encrypted` : versionId
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
    let versionsFile
    try {

      versionsFile = fs.readFileSync(`${tenantDir}/versions.js`, { encoding: 'utf8' })
      const matches = (
        versionsFile
          .replace(/copyright\s*:\s*removeIndentAndBlankStartEndLines\(`(?:[^`]|\\n)+`\)\s*,?/g, '')  // get rid of removeIndentAndBlankStartEndLines
          .replace(/files\s*:.*/g, '')  // get rid of files: requires
          .replace(/\/\/.*|\/\*(?:.|\n)*?\*\//g, '')  // get rid of comments
          .match(new RegExp(`{(?:(?:[^{}\\n]|{[^}]*})*\\n)*?[\\t ]*(?:id|"id"|'id')[\\t ]*:[\\t ]*(?:"${versionId}"|'${versionId}')[\\t ]*,[\\t ]*\\n(?:(?:[^{}\\n]|{[^}]*})*\\n)*(?:[^{}\\n]|{[^}]*})*}`))
      )
      versionInfo = eval(`(${matches[0]})`)

    } catch(err) {
      // version doesn't exist in versions.js

      let { addToVersionsJs, ...vInfo } = (await inquirer.prompt([
        {
          type: 'list',
          name: `addToVersionsJs`,
          message: `This version is missing from \`tenants/${tenant}/version.js\`. Add it?`,
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
          default: versionInfo.name,
          when: ({ addToVersionsJs }) => addToVersionsJs,
          validate: n => n.trim() !== `` || `You must specify a name.`,
        },
        {
          type: 'input',
          name: `abbr`,
          message: `Version abbreviation`,
          default: versionId.toUpperCase(),
          when: ({ addToVersionsJs }) => addToVersionsJs,
          validate: a => !/ /.test(a) && a.length <= 10 || `Cannot be more than 10 characters long or include a space`,
        },
        {
          type: 'search-list',
          name: `languageId`,
          message: `Language`,
          default: versionInfo.languageId,
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
          when: ({ addToVersionsJs }) => addToVersionsJs,
          validate: t => t.trim() !== `` || `You must include copyright information. If this version is public domain, then indicate that.`,
        },
        {
          type: 'list',
          name: `bundled`,
          message: `Do you want to bundle this version within the initial app download?`.white+` You should do so for 1-3 versions.`.gray,
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
        extraVerseMappings: {},
        ...versionInfo,
        ...vInfo,
        id: versionId,
      }

    }

    const { confirmCreateUpdateVersesDBFiles } = (await inquirer.prompt([{
      type: 'list',
      name: `confirmCreateUpdateVersesDBFiles`,
      message: [
        `Continue with the import?`,
        ``,
        `  NOTE:`.gray,
        `   (1) This will create or update the following database files`.gray,
        `       ${tenantDir}/versions/${versionId}/*`.gray,
        (versionInfo.bundled ? `       ${bundledVersionDir}/verses/*` : null).gray,
        `   (2) This will modify the following files`.gray,
        `       ${tenantDir}/versions.js`.gray,
        (versionInfo.bundled ? `       ${bundledVersionDir}/requires.js` : null).gray,
        ``,
        ``,
      ].filter(l => l !== null).join(`\n`),
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
    }]))
    if(!confirmCreateUpdateVersesDBFiles) {
      console.log(``)
      process.exit()
    }

    console.log(``)

    await fs.remove(`${versionsDir}/temp`)
    await fs.ensureDir(`${versionsDir}/temp`)
    await fs.remove(`${versionsDir}/${!encryptEveryXChunks ? `${versionId}-encrypted` : versionId}`)
    await fs.remove(`${bundledVersionsDir}/${!encryptEveryXChunks ? `${versionId}-encrypted` : versionId}`)
    await fs.ensureDir(`${versionDir}/verses`)

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

            const tableName = `${versionId}VersesBook${bookId}`

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
            || poetryWithoutBiblicalContentRegex.test(line)
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

    console.log(``)

    if(!requires[0]) {
      versionInfo.partialScope = `nt`
    } else if(!requires[40]) {
      versionInfo.partialScope = `ot`
    } else {
      delete versionInfo.partialScope
    }

    if(versionInfo.partialScope === `nt`) requires.splice(0, 39)
    if(versionInfo.partialScope === `ot`) requires.splice(39, 27)

    if(!requires.every(Boolean)) throw new Error(`Chosen directory does not contain complete testaments.`)

    let extraRequires = ``

    if(versionId === 'original') {

      extraRequires = `
          require("./definitions.db"),
      `

    } else {

      allVerses.sort((a,b) => a[0].loc < b[0].loc ? -1 : 1)

      const getWordsFromUsfm = usfm => (
        normalizeSearchStr({
          str: (
            usfm
              .replace(wordRegex, '$1')
              .replace(extraBiblicalRegex, '')
              .replace(footnoteRegex, '')
              .replace(crossRefRegex, '')
              .replace(allTagsRegex, '')
              .replace(wordPartDividerRegex, '')
              .replace(new RegExp(versionInfo.wordDividerRegex || defaultWordDividerRegex, 'g'), ' ')
              .replace(newlinesRegex, ' ')
              .replace(doubleSpacesRegex, ' ')
              .trim()
          )
        })
          .split(' ')
          .filter(Boolean)
      )

      const getOriginalLocsFromLoc = (loc, testVersionInfo) => {
        const originalRefs = getCorrespondingRefs({
          baseVersion: {
            info: testVersionInfo || versionInfo,
            ref: getRefFromLoc(loc),
          },
          lookupVersionInfo: {
            versificationModel: 'original',
          },
        })
  
        if(!originalRefs) {
          if(testVersionInfo) return
          console.log(loc)
          throw new Error(`Versification error`)
        }
  
        return originalRefs.map(originalRef => getLocFromRef(originalRef).split(':')[0])
      }

      if(!versionInfo.versificationModel) {

        // 1. wordDividerRegex

        while(true) {

          const sampleVerse = allVerses[0][0]
          const { bookId, chapter, verse } = getRefFromLoc(sampleVerse.loc)
          const wordDividerText = versionInfo.wordDividerRegex ? `word divider specified for this version` : `standard word divider`
          const { correctlySplitsIntoWords } = (await inquirer.prompt([{
            type: 'list',
            name: `correctlySplitsIntoWords`,
            message: [
              `Does the ${wordDividerText} correctly split this verse into individual words?`,
              (!versionInfo.wordDividerRegex ? [] : [
                ``,
                `  ${versionInfo.wordDividerRegex}`.magenta,
              ]),
              ``,
              `  To enable Bible search functionality, the app must correctly divide up a verse into words.`.gray,
              `  Using the ${wordDividerText}, ${getBibleBookName(bookId)} ${chapter}:${verse} gets divided like this:`.gray,
              getWordsFromUsfm(sampleVerse.usfm).map(word => `    ${word}`.white),
              ``,
              `  Is that right?`.gray,
              ``,
              ``,
            ].flat().filter(l => l !== null).join(`\n`),
      
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
          }]))
          if(correctlySplitsIntoWords) break

          console.log(``)
          console.log(`You will need to provide a Regular Expression for word dividers. As a reference, a simplified version of the standard Regular Expression is as follows:`)
          console.log(``)
          console.log(`(?:[\\0-\\/:-@\\[-\`\\{-\\xA9\\xAB-\\xB4\\xB6-\\xB9\\xBB-\\xBF\\xD7\\xF7\\u02C2-\\u02C5])`.gray)
          console.log(``)
          const { wordDividerRegex } = (await inquirer.prompt([{
            type: 'input',
            name: `wordDividerRegex`,
            message: `Word divider Regular Expression (leave blank to use the default)`,
          }]))
          if(wordDividerRegex) {
            versionInfo.wordDividerRegex = wordDividerRegex
          } else {
            delete versionInfo.wordDividerRegex
          }

        }

        console.log(``)

        // 2. versificationModel + skipsUnlikelyOriginals

        spinnies.add('determine-versification-model', { text: `Determining versification model, etc` })
        await new Promise(r => setTimeout(r, 50))  // need to make this async so the spinner works

        const unlikelyOriginals = [ "40012047", "40017021", "40018011", "40023014", "41007016", "41009044", "41009046", "41011026", "41015028", "42017036", "42023017", "43005004", "44008037", "44015034", "44024007", "44028029", "45016024" ]
        let numUnlikelyOriginalsUsed = 0
        const versificationModels = [ 'original', 'kjv', 'lxx', 'synodal' ]
        const translationLocsNotMappingByModel = {}
        for(let versificationModel of versificationModels) {
          translationLocsNotMappingByModel[versificationModel] = []
          for(let verses of allVerses) {
            await new Promise(r => setTimeout(r))  // need to make this async so the spinner works
            verses.forEach(({ loc }) => {
              if(!getOriginalLocsFromLoc(loc, { versificationModel })) {
                translationLocsNotMappingByModel[versificationModel].push(loc)
              }
              if(unlikelyOriginals.includes(loc) && versificationModel === 'kjv') {
                numUnlikelyOriginalsUsed++
              }
            })
          }
        }
        versionInfo.versificationModel = versificationModels.reduce((a,b) => translationLocsNotMappingByModel[a].length < translationLocsNotMappingByModel[b].length ? a : b)
        versionInfo.skipsUnlikelyOriginals = versionInfo.partialScope !== `ot` && numUnlikelyOriginalsUsed < unlikelyOriginals.length / 2

        spinnies.succeed('determine-versification-model', { text: `Will use ${versionInfo.versificationModel} versification model` })
        console.log(`✓ Setting skipsUnlikelyOriginals to ${versionInfo.skipsUnlikelyOriginals}`.green)

        // 2. extraVerseMappings

        console.log(``)
        console.log(`Confirm and correct versification mappings...`.gray)

        let originalLocsToCheck = []

        // find translation mappings with wordRanges and add to originalLocsToCheck
        const { translationToOriginal } = getVerseMappingsByVersionInfo(versionInfo)
        Object.keys(translationToOriginal).map(translationLoc => {
          if(typeof translationToOriginal[translationLoc] !== 'string') {
            originalLocsToCheck.push(
              ...Object.values(translationToOriginal[translationLoc]).map(origLoc => origLoc.split(':')[0])
            )
          }
        })

        // find exceptions to skipsUnlikelyOriginals setting and auto-correct them + add in verses that do not match
        for(let verses of allVerses) {
          verses.forEach(({ loc }) => {
            if(!getOriginalLocsFromLoc(loc, versionInfo)) {
              if(unlikelyOriginals.includes(loc) && versionInfo.skipsUnlikelyOriginals) {
                versionInfo.extraVerseMappings[loc] = loc
              } else {
                const { bookId } = getRefFromLoc(loc)
                const verses = allVerses[bookId - 1]
                const verseIndex = verses.findIndex(v => v.loc === loc)
                if(verseIndex != null) {
                  for(let i=verseIndex-1; i>=0; i--) {
                    const originalLocs = getOriginalLocsFromLoc(verses[i].loc, versionInfo)
                    if(originalLocs) {
                      originalLocsToCheck.push(...originalLocs)
                      break
                    }
                  }
                  for(let i=verseIndex+1; i<verses.length; i++) {
                    const originalLocs = getOriginalLocsFromLoc(verses[i].loc, versionInfo)
                    if(originalLocs) {
                      originalLocsToCheck.push(...originalLocs)
                      break
                    }
                  }
                }
              }
            }
          })
        }

        // find exceptions to skipsUnlikelyOriginals setting and auto-correct them + add in verses that do not match
        if(versionInfo.versificationModel !== `lxx`) {
          originalLoc = `01001000`
          while(originalLoc = getNextOriginalLoc(originalLoc)) {
            const { bookId } = getRefFromLoc(originalLoc)
            if(versionInfo.partialScope === `nt` && bookId < 40) continue
            if(versionInfo.partialScope === `ot` && bookId > 39) continue

            if(!getCorrespondingRefs({
              baseVersion: {
                info: {
                  versificationModel: 'original',
                },
                ref: getRefFromLoc(originalLoc),
              },
              lookupVersionInfo: versionInfo,
            })) {

              if(unlikelyOriginals.includes(originalLoc) && !versionInfo.skipsUnlikelyOriginals) {
                versionInfo.extraVerseMappings[originalLoc] = null
              } else {
                originalLocsToCheck.push(originalLoc)
              }

            }
          }
        }

        const originalLocsSets = []
        ;[ ...new Set(originalLocsToCheck) ].sort().forEach(originalLoc => {
          if((originalLocsSets.slice(-1)[0] || []).slice(-1)[0] === getPreviousOriginalLoc(originalLoc)) {
            originalLocsSets.slice(-1)[0].push(originalLoc)
          } else {
            originalLocsSets.push([ originalLoc ])
          }
        })

        for(let i=0; i<originalLocsSets.length; i++) {
          versionInfo.extraVerseMappings = await confirmAndCorrectMapping({
            originalLocs: originalLocsSets[i],
            versionInfo,
            tenant: 'biblearc',
            progress: (i+1) / originalLocsSets.length
          })
          if(i !== originalLocsSets.length-1) {
            process.stdout.moveCursor(0,-1)
            process.stdout.clearLine()
            process.stdout.moveCursor(0,-1)
            process.stdout.clearLine()
            process.stdout.moveCursor(0,-1)
            process.stdout.clearLine()
          }
        }

        console.log('versionInfo.extraVerseMappings', versionInfo.extraVerseMappings)

      }
  
      process.exit()

      console.log(``)
      process.stdout.write(`Creating search database...`)

      allVerses.forEach(verses => {
        let wordNumber = 0

        verses.forEach(verse => {

          const newWords = getWordsFromUsfm(verse.usfm)
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
      const tableName = `${versionId}UnitWords`

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

    if(versionId === 'original' || versionInfo.bundled) {

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

    if(!hasChange) {
      console.log(``)
      const { confirmUpdateVersionsJs } = (await inquirer.prompt([{
        type: 'list',
        name: `confirmUpdateVersionsJs`,
        message: `There were no changes since the last import. Update \`${tenantDir}/versions.js\` anyway?`,
        default: false,
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
      }]))
      hasChange = confirmUpdateVersionsJs
    }

    if(hasChange) {

      // update versions.js
      let newVersionsFile = versionsFile
      newVersionsFile = newVersionsFile.replace(new RegExp(` *import ${versionId}Requires from '\\./assets/bundledVersions/${!encryptEveryXChunks ? `${versionId}-encrypted` : versionId}/requires'.*\\n`), ``)
      const newImportLine = `import ${versionId}Requires from './assets/bundledVersions/${versionWithEncryptedIfRelevant}/requires'`
      const newFilesLine = `    files: ${versionId}Requires,`

      if(versionInfo.bundled) {
        if(!newVersionsFile.includes(newImportLine)) {
          newVersionsFile = newVersionsFile.replace(/((?:^|\n)[^\/].*\n)/, `$1${newImportLine}\n`)
        }
        if(!newVersionsFile.includes(newFilesLine)) {
          newVersionsFile = newVersionsFile.replace(new RegExp(`(\\n[\\t ]*(?:id|"id"|'id')[\\t ]*:[\\t ]*(?:"${versionId}"|'${versionId}')[\\t ]*,[\\t ]*\\n)`), `$1${newFilesLine}\n`)
        }
      } else {
        if(newVersionsFile.includes(newImportLine)) {
          newVersionsFile = newVersionsFile.replace(new RegExp(` *import ${versionId}Requires from '\\./assets/bundledVersions/${versionWithEncryptedIfRelevant}/requires'.*\\n`), ``)
        }
        if(newVersionsFile.includes(newFilesLine)) {
          newVersionsFile = newVersionsFile.replace(new RegExp(`\\n[\\t ]*files: ${versionId}Requires,[\\t ]*`), ``)
        }
      }

      const versionRevisionNumRegexp = new RegExp(`(\\n[\\t ]*(?:${versionId}RevisionNum|"${versionId}RevisionNum"|'${versionId}RevisionNum')[\\t ]*:[\\t ]*)[0-9]+([\\t ]*,[\\t ]*\\n)`)
      if(versionRevisionNumRegexp.test(newVersionsFile)) {
        newVersionsFile = newVersionsFile.replace(versionRevisionNumRegexp, `$1${versionInfo[`${versionId}RevisionNum`] + 1}$2`)
      } else {
        newVersionsFile = newVersionsFile.replace(new RegExp(`(\\n[\\t ]*(?:files|"files"|'files')[\\t ]*:[\\t ]*${versionId}Requires[\\t ]*,[\\t ]*\\n)`), `$1    ${versionId}RevisionNum: 1,\n`)
      }
      if(encryptEveryXChunks && !versionInfo.encrypted) {
        newVersionsFile = newVersionsFile.replace(new RegExp(`(\\n[\\t ]*(?:files|"files"|'files')[\\t ]*:[\\t ]*${versionId}Requires[\\t ]*,[\\t ]*\\n)`), `$1    encrypted: true,\n`)
      } else if(!encryptEveryXChunks && versionInfo.encrypted) {
        newVersionsFile = newVersionsFile.replace(new RegExp(`(\\n[\\t ]*(?:id|"id"|'id')[\\t ]*:[\\t ]*(?:"${versionId}"|'${versionId}')[\\t ]*,[\\t ]*(?:(?:[^{}\\n]|{[^}]*})*\\n)*?)[\\t ]*encrypted[\\t ]*:[\\t ]*true[\\t ]*,[\\t ]*\\n`), `$1`)
      }
      await fs.writeFile(`${tenantDir}/versions.js`, newVersionsFile)
      console.log(``)
      console.log(`Updated ${tenantDir}/versions.js`)

    }

    // update tenant and sync them to dev
    if(versionId !== 'original') {
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
            } else if(stdout.includes(`Changed tenant to`)) {
              console.log(stdout.split('\n').filter(line => !/^> /.test(line)).join('\n').replace(/\n\n+/g, '\n\n'))
              resolve()
            } else if(stdout) {
              console.log(stdout)
            }
          }
        )
      })
    }

    const { confirmSyncVersionToDev } = (await inquirer.prompt([{
      type: 'list',
      name: `confirmSyncVersionToDev`,
      message: `Set this version up for testing locally? (Includes adding this version to local DB, syncing to \`/dev\` in the cloud, and submitting word hashes locally. Requires @bibletags/bibletags-data installation.)`,
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
    }]))
    if(confirmSyncVersionToDev) {
      // TODO: update/insert results in local BibleTags.versions row
      await goSyncVersions({ stage: `dev` })
    }

    if(versionId !== 'original') {

      console.log(removeIndent(`
        Successfully...
          (1) Created sqlite db files and placed them in \`${versionDir}\`${versionInfo.bundled ? ` and \`${bundledVersionDir}/verses\`` : ``}
          (2) Updated \`${tenantDir}/versions.js\`${versionInfo.bundled ? ` and \`${bundledVersionDir}/requires.js\`` : ``}
          (3) Reran change-tenant (to update the state so it is ready for running \`npm run dev\`)
          (4) Synced \`${versionsDir}\` to the cloud for use in dev
          ${confirmSyncVersionToDev ? `(5) Submitted word hashes for ${versionId} to the dev db for bibletags-data` : ``}
      `).green)

    }

  } catch(err) {

    console.log(``)
    console.log(`ERROR: ${err.message}`.bgRed.brightWhite)
    console.log(``)

  }

  process.exit()

})()
