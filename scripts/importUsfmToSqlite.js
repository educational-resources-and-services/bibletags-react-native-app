const Database = require('better-sqlite3')
const fs = require('fs-extra')
const readline = require('readline')
const stream = require('stream')
const CryptoJS = require("react-native-crypto-js")
const { i18n, i18nNumber } = require("inline-i18n")
const { wordPartDividerRegex, defaultWordDividerRegex, passOverI18n, passOverI18nNumber,
        normalizeSearchStr, getBibleBookNames,
        getBookIdFromUsfmBibleBookAbbr, getAllLanguages, getLanguageInfo, getBibleBookName } = require("@bibletags/bibletags-ui-helper")
const { getCorrespondingRefs, getRefFromLoc, getLocFromRef, getVerseMappingsByVersionInfo,
        isValidRefInOriginal, getNextOriginalLoc, getPreviousOriginalLoc } = require('@bibletags/bibletags-versification')
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
const equalObjsIgnoreKeyOrdering = confirmAndCorrectMapping.equalObjsIgnoreKeyOrdering

const graphqlUrl = `https://data.bibletags.org/graphql`
// const graphqlUrl = `https://data.staging.bibletags.org/graphql`

passOverI18n(i18n)
passOverI18nNumber(i18nNumber)

const cloneObj = obj => JSON.parse(JSON.stringify(obj))

const ENCRYPT_CHUNK_SIZE = 11 * 1000  // ~ 11 kb chunks (was fastest)

const clearLines = num => {
  for(let i=0; i<num; i++) {
    process.stdout.moveCursor(0,-1)
    process.stdout.clearLine()
  }
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
const bookIdRegex = /^\\id ([A-Z1-3]{3})(?: .*)?$/
const irrelevantLinesRegex = /^\\(?:usfm|ide|sts|rem|h|toca?[0-9]*|cl)(?: .*)?$/
const introductionLinesRegex = /^\\(?:imt[0-9]*|is[0-9]*|ipi?|imi?|ipq|imq|ipr|iq[0-9]*|ib|ili[0-9]*|iot|io[0-9]*|iex|imte[0-9]*|ie|iop)(?: .*)?$/
const majorTitleRegex = /^\\mte?[0-9]* .*$/
const majorSectionRegex = /^\\ms[0-9]* .*$/
const referenceRegex = /^\\[ms]?r .*$/
const sectionHeadingRegex = /^\\s[0-9p]? .*$/
const chapterCharacterRegex = /^\\cp .*$/
const chapterDescRegex = /^\\cd .*$/
const chapterRegex = /^\\c ([0-9]+)$/
const paragraphWithoutContentRegex = /^\\(?:[pm]|p[ormc]|cls|pm[ocr]|pi[0-9]*|mi|nb|ph[0-9]*)(?: \\add .*?\\add\*| \\f .*?\\f\*| \\fe .*?\\fe\*| \\x .*?\\x\*)*$/
const poetryWithoutBiblicalContentRegex = /^\\(?:q[0-9rcd]?|qm[0-9]*|qa .*|b)(?: \\f .*?\\f\*| \\fe .*?\\fe\*| \\x .*?\\x\*)*$/
const listItemWithoutBiblicalContentRegex = /^\\(?:lh|li[0-9]*|lf|lim[0-9]*)$/
const psalmTitleRegex = /^\\d( .*)?$/
const verseRegex = /^\\v ([0-9]+)(?: .*)?$/
const wordRegex = /\\w (?:([^\|]+?)\|.*?|.*?)\\w\*/g
const extraBiblicalRegex = /(?:^\\(?:mte?|ms|s)[0-9]* .*$|^\\(?:[ms]?r|sp|cd) .*$|\\rq .*?\\rq\*|^\\(?:cp|c) .*$|\\v [0-9]+(?: \\vp [0-9]+-[0-9]+\\vp\*)? ?|^\\(?:[pm]|p[ormc]|cls|pm[ocr]|pi[0-9]*|mi|nb|ph[0-9]*) \\add [^\\]+\\add\*$)/gm
const crossRefRegex = /\\f .*?\\f\*|\\fe .*?\\fe\*/g
const footnoteRegex = /\\x .*?\\x\*/g
const allTagsRegex = /\\[a-z0-9]+ ?/g
const newlinesRegex = /\n/g
const doubleSpacesRegex = /  +/g

;(async () => {

  // NOTE: Leave this comment for easy testing when I hit a bug
  // console.log(
  //   await confirmAndCorrectMapping({
  //     originalLocs: ['44002010', '44002011'],
  //     versionInfo: {
  //       id: 'esv',
  //       versificationModel: 'kjv',
  //       skipsUnlikelyOriginals: true,
  //       extraVerseMappings: {"42007018:1-9":"42007018:1-12","11022043:1-12":"11022043:1-27","11022044:1-9":"11022043:28-47","13012004:1-6":"13012004:1-15","13012005:1-5":"13012004:16-21","19018001:1-20":"19018000:1-43","19051001:1-3":"19051000:1-7","19051002:1-8":"19051000:8-21","19052001:1-3":"19052000:1-7","19052002:1-12":"19052000:8-23","19054001:1-4":"19054000:1-10","19054002:1-8":"19054000:11-23","19060001:1-6":"19060000:1-13","19060002:1-15":"19060000:14-40","40017014:1-10":"40017014:1-17","40017015:1-23":"40017015:1-27","40020004:1-16":"40020004:1-19","40020005:1-12":"40020005:1-18","41012014:1-39":"41012014:1-53","41012015:1-16":"41012015:1-24","42001073:1-11":"42001073:1-12","42001074:1-7":"42001074:1-15","42007019:1-12":"42007019:8-27","42022066:1-20":"42022066:1-26","44002010:1-17":"44002010:1-16","44002011:1-17":"44002011:1-20","44003019:1-10":"44003019:1-12","04025019:1-3":"04026001:1-3","04026001:1-10":"04026001:4-17","09020042:1-22":"09020042:1-38","09021001:1-5":"09020042:39-49","19018002:1-1":"19018000:44-45","19018002:2-4":"19018001:1-7","42007018:10-18":"42007019:1-7","42022067:1-1":"42022066:27-29","42022067:2-17":"42022067:1-20","44003020:4-16":"44003020:1-23","44003020:1-3":null},
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

    let tenant
    if(tenantChoices.includes(folders[0])) {
      tenant = folders.splice(0,1)[0]
    } else {
      tenant = (await inquirer.prompt([{
        type: 'list',
        name: `tenant`,
        message: `Select the app`,
        choices: tenantChoices,
      }])).tenant
    }

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
        graphqlUrl,
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

    const validateNewVersionId = vId => (
      (!/^[a-z0-9]{2,9}$/.test(vId) && `Invalid version id (must use only a-z or 0-9, and be 2-9 characters long)`)
      || ((existingVersions || []).some(({ id }) => id === vId) && `That version id is already in use`)
      || true
    )

    // look for biblearc-download-info.json; if found, go through the rest without interaction
    let infoFromJsonFile = {}
    try {
      infoFromJsonFile = JSON.parse(fs.readFileSync(`${folders[0]}/../../biblearc-download-info.json`, { encoding: 'utf8' }))
    } catch (err) {}
    const hasJsonInfoFile = !!infoFromJsonFile.versionId
    if(hasJsonInfoFile) {
      const errorMessage = validateNewVersionId(infoFromJsonFile.versionId)
      if(typeof errorMessage === 'string') {
        throw new Error(errorMessage)
      }
    }

    const defaultVersionId = folders[0].split('/').reverse().map(dirName => dirName.toLowerCase()).filter(dirName => /^[a-z0-9]{2,9}$/.test(dirName))[0]
    const noneFoundMessage = `None found. CREATE A NEW VERSION`
    let { versionStr, versionId=infoFromJsonFile.versionId } = (await inquirer.prompt([
      {
        type: 'autocomplete',
        name: 'versionStr',
        message: 'Version',
        when: () => !!existingVersions && !hasJsonInfoFile,
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
        when: () => !infoFromJsonFile,
        default: defaultVersionId,
        when: ({ versionStr }) => !existingVersions || versionStr === noneFoundMessage,
        validate: validateNewVersionId,
      },
    ]))
    if(!versionId) {
      versionId = versionStr.match(/\(ID: ([a-z0-9]{2,9})\)$/)[1]
    }
    const existingVersionInfo = existingVersions.find(({ id }) => id === versionId) || {}
    let versionInfo = {
      ...cloneObj(existingVersionInfo),
      ...(
        hasJsonInfoFile
          ? {
            name: infoFromJsonFile.name,
            abbr: infoFromJsonFile.abbr,
            languageId: infoFromJsonFile.languageId,
            partialScope: infoFromJsonFile.partialScope,
            copyright: infoFromJsonFile.copyright,
            bundled: false,
            encrypted: false,
          }
          : {}
      ),
    }

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
    
    const tempFilePath = `./.temp/extraVerseMappingsInProgress-${versionId}.json`
    await fs.ensureDir(tempFilePath.split('/').slice(0,-1).join('/'))

    const tenantDir = tenant === 'defaultTenant' ? `./${tenant}` : `./tenants/${tenant}`

    if(!await fs.pathExists(tenantDir)) {
      throw new Error(`Invalid tenant.`)
    }

    const appJsonUri = `${tenantDir}/app.json`
    const appJson = await fs.readJson(appJsonUri)
    const encryptionKey = appJson.expo.extra.BIBLE_VERSIONS_FILE_SECRET || "None"
    const versionInfoRegex = new RegExp(`{(?:(?:[^{}\\n]|{[^}]*})*\\n)*?[\\t ]*(?:id|"id"|'id')[\\t ]*:[\\t ]*(?:"${versionId}"|'${versionId}')[\\t ]*,[\\t ]*\\n(?:(?:[^{}\\n]|{[^}]*})*\\n)*(?:[^{}\\n]|{[^}]*})*}`)

    const scopeMapsById = {}
    let versionsFile, editVersionInfo=false
    try {

      versionsFile = fs.readFileSync(`${tenantDir}/versions.js`, { encoding: 'utf8' })
      const matches = (
        versionsFile
          .replace(/removeIndentAndBlankStartEndLines/g, '')  // get rid of removeIndentAndBlankStartEndLines
          .replace(/files\s*:.*/g, '')  // get rid of files: requires
          .match(versionInfoRegex)
      )
      versionInfo = {
        ...versionInfo,
        ...eval(`(${matches[0]})`),
      }
      if(versionInfo.copyright) {
        versionInfo.copyright = (
          versionInfo.copyright
            .replace(/\n +/g, '\n')
            .replace(/^\n|\n$/g, '')
        )
      }

      if(!hasJsonInfoFile) {
        editVersionInfo = !(await inquirer.prompt([{
          type: 'list',
          name: `useVersionInfo`,
          message: `Version found in \`tenants/${tenant}/version.js\`. Use that info?`,
          choices: [
            {
              name: `Yes, use existing version info`,
              value: true,
            },
            {
              name: `No, edit version info`,
              value: false,
            },
          ],
          default: true,
        }])).useVersionInfo
      }

    } catch(err) {

      // version doesn't exist in versions.js

      if(!hasJsonInfoFile) {
        const { addToVersionsJs } = await inquirer.prompt([{
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
        }])
  
        if(!addToVersionsJs) {
          console.log(``)
          process.exit()
        }

        editVersionInfo = true
      }

    }

    const getLanguageChoice = ({ englishName, nativeName, iso6393 }) => ({
      name: englishName === nativeName ? englishName : `${nativeName} (${englishName})`,
      value: iso6393,
    })
    const defaultLanguage = getLanguageInfo(versionInfo.languageId)
    const defaultLanguageChoiceArray = defaultLanguage.englishName ? [ getLanguageChoice(defaultLanguage) ] : []

    let { encryptEveryXChunks=false, ...vInfo } = await inquirer.prompt([
      {
        type: 'input',
        name: `name`,
        when: () => editVersionInfo || !versionInfo.name,
        message: `Version name`,
        default: versionInfo.name,
        validate: n => n.trim() !== `` || `You must specify a name.`,
      },
      {
        type: 'input',
        name: `abbr`,
        when: () => editVersionInfo || !versionInfo.abbr,
        message: `Version abbreviation`,
        default: versionId.toUpperCase(),
        validate: a => !/ /.test(a) && a.length <= 10 || `Cannot be more than 10 characters long or include a space`,
      },
      {
        type: 'search-list',
        name: `languageId`,
        when: () => editVersionInfo || !versionInfo.languageId,
        message: `Language`,
        choices: [
          ...defaultLanguageChoiceArray,
          ...(
            getAllLanguages()
              .sort((a,b) => a.nativeName < b.nativeName ? -1 : 1)
              .filter(({ iso6393 }) => iso6393 !== versionInfo.languageId)
              .map(getLanguageChoice)
          ),
        ],
        pageSize: 11,
      },
      {
        type: 'input',
        name: `copyright`,
        when: () => editVersionInfo || !versionInfo.copyright,
        message: `Copyright text`+` \\n = newline`.gray,
        default: versionInfo.copyright ? versionInfo.copyright.replace(/\n/g, '\\n') : undefined,
        validate: t => t.trim() !== `` || `You must include copyright information. If this version is public domain, then indicate that.`,
      },
      {
        type: 'list',
        name: `bundled`,
        when: () => editVersionInfo || versionInfo.bundled === undefined,
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
        default: !!versionInfo.bundled,
      },
      {
        type: 'list',
        name: `encrypted`,
        when: () => editVersionInfo || versionInfo.encrypted === undefined,
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
        default: !!versionInfo.encrypted,
      },
      {
        type: 'input',
        name: `encryptEveryXChunks`,
        when: ({ encrypt }) => encrypt,
        message: `One in every how many chunks would like you to encrypt? (Choosing 1 will completely encrypt the files, but also comes with a significant performance hit when the text is first loaded.)`,
        default: 20,
        validate: e => (parseInt(e, 10) >= 1 && parseInt(e, 10) <= 100) || `Must be a number between 1 and 100`,
      },
    ])

    if(encryptEveryXChunks) {
      encryptEveryXChunks = parseInt(encryptEveryXChunks, 10)
    }

    versionInfo = {
      wordDividerRegex: null,
      [`${versionId}RevisionNum`]: 1,
      ...versionInfo,
      ...vInfo,
      id: versionId,
    }
    versionInfo.extraVerseMappings = versionInfo.extraVerseMappings || {}

    const versionsDir = `${tenantDir}/versions`
    const versionWithEncryptedIfRelevant = encryptEveryXChunks ? `${versionId}-encrypted` : versionId
    const versionDir = `${versionsDir}/${versionWithEncryptedIfRelevant}`
    const bundledVersionsDir = `${tenantDir}/assets/bundledVersions`
    const bundledVersionDir = `${bundledVersionsDir}/${versionWithEncryptedIfRelevant}`

    if(!hasJsonInfoFile) {
      const { confirmCreateUpdateVersesDBFiles } = (await inquirer.prompt([{
        type: 'list',
        name: `confirmCreateUpdateVersesDBFiles`,
        message: [
          `Continue with the import?`,
          ``,
          `  NOTE:`.gray,
          `   (1) This will create or update the following database files`.gray,
          `       ${tenantDir}/versions/${versionId}/*`.gray,
          (versionInfo.bundled ? `       ${bundledVersionDir}/verses/*`.gray : null),
          `   (2) This will modify the following files`.gray,
          `       ${tenantDir}/versions.js`.gray,
          (versionInfo.bundled ? `       ${bundledVersionDir}/requires.js`.gray : null),
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

        const lines = (
          (await fs.promises.readFile(`${folder}/${file}`, { encoding: 'utf8' }))

            .replace(/\r/g, '')

            // fix common semi-invalid USFM where a verse range is presented (e.g. `\v 1-2`)
            .replace(/\\v ([0-9]+)(b?)([-–־\u200f\u200e]+)([0-9]+)(a?)( \\vp .*?\\vp\*)?( |$)/g, (match, v1, b, dash, v2, a, vp, final) => {
              if(vp) {
                return `\\v ${v1}${vp}${final}`
              } else {
                return `\\v ${v1} \\vp ${v1}${b}${dash}${v2}${a}\\vp*${final}`
              }
            })

            // handle bracketed [\\v #] coming in the middle of a line
            .replace(/([[(])(\\v [0-9]+)/g, '$1\n$2')

            .split('\n')
        )

        let bookId, chapter, insertMany, dbFilePath, dbInFormationFilePath, skip, lastVerseInLastChapter, atStartOfChapter
        let verses = []
        let goesWithNextVsText = []

        for(let line of lines) {

          if(/.\\[vc] /.test(line)) throw new Error(`\\v or \\c in the middle of a line: ${line}`)

          // fix common misuse of \d in Psalm 119
          if(
            bookId === 19
            && chapter === '119'
            && lastVerseInLastChapter === 29 // make sure we are really in Ps 119, given syno versification
            && psalmTitleRegex.test(line)
          ) {  
            line = line.replace(psalmTitleRegex, '\\qa$1')
          }

          // fix when there is a second \d or a \d somewhere other than the beginning of a psalm
          if(psalmTitleRegex.test(line) && (!atStartOfChapter || bookId !== 19)) {
            line = line.replace(psalmTitleRegex, '\\qd$1')
          }

          if(!bookId) {

            if(!line.match(bookIdRegex)) continue

            const bookAbbr = line.replace(bookIdRegex, '$1')
            bookId = getBookIdFromUsfmBibleBookAbbr(bookAbbr)

            if(
              bookId < 1
              || bookId > 66
              || (bookId > 39 && versionInfo.partialScope === `ot`)
              || (bookId < 40 && versionInfo.partialScope === `nt`)
            ) {
              skip = true
              break
            }

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
              for(const verse of verses) {
                try {
                  insert.run(verse)
                } catch(err) {
                  throw new Error(`${err.message} - ${JSON.stringify(verse)}`)
                }
              }
            })

            process.stdout.write(`Importing ${bookAbbr}...`)
            continue

          }

          if(line === '') continue
          if(irrelevantLinesRegex.test(line)) continue
          if(introductionLinesRegex.test(line)) continue  // presently, we do not handle introductions

          // get chapter
          if(chapterRegex.test(line)) {
            lastVerseInLastChapter = getRefFromLoc((verses[verses.length - 1] || {}).loc || `01001001`).verse
            chapter = line.replace(chapterRegex, '$1')
            atStartOfChapter = true
          }

          // get tags which connect to verse text to follow
          if(
            majorTitleRegex.test(line)
            || majorSectionRegex.test(line)
            || referenceRegex.test(line)
            || sectionHeadingRegex.test(line)
            || chapterRegex.test(line)
            || chapterCharacterRegex.test(line)
            || chapterDescRegex.test(line)
            || paragraphWithoutContentRegex.test(line)
            || poetryWithoutBiblicalContentRegex.test(line)
            || listItemWithoutBiblicalContentRegex.test(line)
          ) {
            goesWithNextVsText.push(line)
            continue
          }

          // get verse
          if(verseRegex.test(line) || psalmTitleRegex.test(line)) {

            atStartOfChapter = false

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

          if(verses.length === 0) throw new Error(`File contains unknown marker or scripture content prior to first verse: ${line}.`)

          verses[verses.length - 1].usfm = [
            ...verses[verses.length - 1].usfm,
            ...goesWithNextVsText,
            line,
          ]
          goesWithNextVsText = []

        }

        if(skip) continue

        verses.forEach(verse => {
          verse.usfm = verse.usfm.join("\n")
        })

        // get rid of verses without content
        verses = verses.filter(({ usfm }, idx) => {
          if(getWordsFromUsfm(usfm).length === 0) {  // this is before wordDividerRegex is confirmed, but it shouldn't matter since we are just making sure it has ANY words
            verses[idx+1].usfm = usfm.replace(/\\(?:d|v [0-9]+)(?= |\n|$)/g, '') + verses[idx+1].usfm
            return false
          }
          return true
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
      versionInfo.partialScope = null
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

      if(!versionInfo.versificationModel || editVersionInfo) {

        // 1. wordDividerRegex

        const sampleVerse = allVerses[0][0]

        if(hasJsonInfoFile) {

          if(getWordsFromUsfm(sampleVerse.usfm).length < 5) {
            throw new Error(`wordDividerRegex does not appear to be correct.`)
          }

        } else {
          while(true) {

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
              versionInfo.wordDividerRegex = null
            }

          }
        }

        console.log(``)

        // 2. versificationModel + skipsUnlikelyOriginals

        spinnies.add('determine-versification-model', { text: `Determining versification model, etc` })
        await new Promise(r => setTimeout(r, 50))  // need to make this async so the spinner works

        const unlikelyOriginals = [ "40012047", "40017021", "40018011", "40023014", "41007016", "41009044", "41009046", "41011026", "41015028", "42017036", "42023017", "43005004", "44008037", "44015034", "44024007", "44028029", "45016024" ]
        let numUnlikelyOriginalsUsed = 0
        const versificationModels = [ 'original', 'kjv', 'synodal', 'lxx' ]
        const numTranslationLocsNotMappingByModel = {}
        for(let versificationModel of versificationModels) {
          numTranslationLocsNotMappingByModel[versificationModel] = 0
          for(let verses of allVerses) {
            await new Promise(r => setTimeout(r))  // need to make this async so the spinner works
            verses.forEach(({ loc }) => {
              if(!getOriginalLocsFromLoc(loc, { versificationModel })) {
                numTranslationLocsNotMappingByModel[versificationModel]++
              }
              if(unlikelyOriginals.includes(loc) && versificationModel === 'kjv') {
                numUnlikelyOriginalsUsed++
              }
            })
          }
        }
        versionInfo.versificationModel = (
          (
            // strongly prefer the kjv if it is NT only
            versionInfo.partialScope === `nt`
            && numTranslationLocsNotMappingByModel.kjv < Math.min(...Object.values(numTranslationLocsNotMappingByModel)) + 5
          )
            ? `kjv`
            : versificationModels.reduce((a,b) => numTranslationLocsNotMappingByModel[b] < numTranslationLocsNotMappingByModel[a] ? b : a)
        )
        versionInfo.skipsUnlikelyOriginals = versionInfo.partialScope !== `ot` && numUnlikelyOriginalsUsed < unlikelyOriginals.length / 2

        spinnies.succeed('determine-versification-model', { text: `Will use ${versionInfo.versificationModel} versification model` })
        console.log(`✓ Setting skipsUnlikelyOriginals to ${versionInfo.skipsUnlikelyOriginals}`.green)

        // 3. extraVerseMappings

        console.log(``)
        console.log(`Confirm and correct versification mappings...`.gray)
        console.log(``)

        let originalLocsToCheck = []

        const confirmAndCorrect = async params => {
          versionInfo.extraVerseMappings = await confirmAndCorrectMapping({
            versionInfo,
            tenant,
            progress: 1,
            ...params,
          })
          await fs.writeFile(tempFilePath, JSON.stringify(versionInfo.extraVerseMappings))
          clearLines(3)
        }

        let confirmFullRecheckOfMappings = Object.values(versionInfo.extraVerseMappings).length === 0 && !hasJsonInfoFile

        try {
          const prevExtraVerseMappings = JSON.parse(await fs.readFile(tempFilePath, { encoding: 'utf8' }))
          const { confirmUsePrevExtraVerseMappings } = (await inquirer.prompt([{
            type: 'list',
            name: `confirmUsePrevExtraVerseMappings`,
            message: `This script was previously run on this version and left unfinished. Use those in-progress verse mappings?`,
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
          if(confirmUsePrevExtraVerseMappings) {
            versionInfo.extraVerseMappings = prevExtraVerseMappings
            confirmFullRecheckOfMappings = true
          }
        } catch(err) {}

        if(!confirmFullRecheckOfMappings && !hasJsonInfoFile) {
          const answers = (await inquirer.prompt([{
            type: 'list',
            name: `confirmFullRecheckOfMappings`,
            message: `Do you want to rerun a thorough versification mappings check?`,
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
            default: false,
          }]))
          confirmFullRecheckOfMappings = answers.confirmFullRecheckOfMappings

          if(confirmFullRecheckOfMappings) {
            originalLocsToCheck.push(...Object.keys(versionInfo.extraVerseMappings).map(origLoc => origLoc.split(':')[0]))
          }
        }

        if(confirmFullRecheckOfMappings) {
          // find translation mappings with wordRanges and add to originalLocsToCheck
          const { translationToOriginal } = getVerseMappingsByVersionInfo(versionInfo)
          Object.keys(translationToOriginal).map(translationLoc => {
            if(
              (
                !(versionInfo.partialScope === `ot` && getRefFromLoc(translationLoc).bookId > 39)
                && !(versionInfo.partialScope === `nt` && getRefFromLoc(translationLoc).bookId < 40)
              )
              && typeof translationToOriginal[translationLoc] !== 'string'
            ) {
              originalLocsToCheck.push(
                ...Object.values(translationToOriginal[translationLoc]).map(origLoc => origLoc.split(':')[0])
              )
            }
          })
        }

        while(true) {

          spinnies.add('checking-verse-mappings', { text: `Checking verse mappings` })
          await new Promise(r => setTimeout(r, 50))  // need to make this async so the spinner works

          // find exceptions to skipsUnlikelyOriginals setting and auto-correct them + add in verses that do not match
          for(let verses of allVerses) {
            await new Promise(r => setTimeout(r))  // need to make this async so the spinner works
            verses.forEach(({ loc }) => {
              if(!getOriginalLocsFromLoc(loc, versionInfo)) {
                if(unlikelyOriginals.includes(loc) && versionInfo.skipsUnlikelyOriginals) {
                  versionInfo.extraVerseMappings[loc] = loc
                } else {
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

          // TODO: for !hasJsonInfoFile, add any non-consecutive verses to originalLocsToCheck (except for those in skipsUnlikelyOriginals)

          // automatically handle a common versification correction
          if(
            hasJsonInfoFile
            && versionInfo.versificationModel === `kjv`
            && Object.values(versionInfo.extraVerseMappings).length === 0
          ) {
            if(equalObjsIgnoreKeyOrdering(originalLocsToCheck, [ '64001014', '64001015', '66012017', '66012018', '66013001' ])) {
              versionInfo.extraVerseMappings = {
                "64001014": "64001014",
                "64001015": "64001015",
                "66012018": "66012018",
                "66013001": "66013001"
              }
              originalLocsToCheck = []
              continue
            } else if(equalObjsIgnoreKeyOrdering(originalLocsToCheck, [ '64001014', '64001015' ])) {
              versionInfo.extraVerseMappings = {
                "64001014": "64001014",
                "64001015": "64001015",
              }
              originalLocsToCheck = []
              continue
            } else if(equalObjsIgnoreKeyOrdering(originalLocsToCheck, [ '66012017', '66012018', '66013001' ])) {
              versionInfo.extraVerseMappings = {
                "66012018": "66012018",
                "66013001": "66013001"
              }
              originalLocsToCheck = []
              continue
            }
          }

if(originalLocsToCheck.length > 0) {
  console.log(`REDO: ${versionId}`)
  process.exit()
}

          // find exceptions to skipsUnlikelyOriginals setting and auto-correct them + add in verses that do not match
          if(versionInfo.versificationModel !== `lxx`) {
            originalLoc = `01001000`
            while(originalLoc = getNextOriginalLoc(originalLoc)) {
              await new Promise(r => setTimeout(r))  // need to make this async so the spinner works
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

          spinnies.succeed('checking-verse-mappings', { text: originalLocsToCheck.length === 0 ? `All translation verses are mapped to the original` : `` })

          if(originalLocsToCheck.length === 0) {

            let errorToPrint
            while(true) {

              const extraVerseMappingsLocs = [ ...new Set(Object.keys(versionInfo.extraVerseMappings).map(originalLoc => (versionInfo.extraVerseMappings[originalLoc] || originalLoc).split(':')[0])) ]

              console.log(``)
              console.log(`  Versification mappings specific to the ${versionInfo.abbr}: `.gray)
              console.log(
                `    ` +
                extraVerseMappingsLocs
                  .sort()
                  .map(loc => {
                    const { bookId, chapter, verse } = getRefFromLoc(loc)
                    return `${getBibleBookName(bookId)} ${chapter}:${verse}`
                  })
                  .join('\n    ')
                  .white
              )
              console.log(``)
              
              if(errorToPrint) {
                console.log(errorToPrint.red)
                console.log(``)
                errorToPrint = null
                extraVerseMappingsLocs.push(null, null)
              }

              if(hasJsonInfoFile) break

              const { book, chapterVerse } = (await inquirer.prompt([
                {
                  type: 'list',
                  name: `confirmEditOthers`,
                  message: `Do you want to modify versification mappings for other verses?`,
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
                  default: false,
                },
                {
                  type: 'search-list',
                  name: `book`,
                  when: ({ confirmEditOthers }) => confirmEditOthers,
                  message: `Choose the book of the Bible`,
                  choices: getBibleBookNames().slice(1),
                  pageSize: 5,
                },
                {
                  type: 'input',
                  name: `chapterVerse`,
                  when: ({ confirmEditOthers }) => confirmEditOthers,
                  message: `Enter the chapter and verse of the original (e.g. 3:14)`,
                  transformer: (input, { book }, { isFinal }) => `${book} ${input}`,
                }
              ]))

              clearLines(1)

              if(!book) break

              clearLines(extraVerseMappingsLocs.length + 5)

              const [ chapter, verse ] = chapterVerse.split(':').map(n => parseInt(n))
              const originalRef = { bookId: getBibleBookNames().indexOf(book), chapter, verse }
              if(isValidRefInOriginal(originalRef)) {
                await confirmAndCorrect({
                  originalLocs: [ getLocFromRef(originalRef) ],
                })
              } else {
                errorToPrint = `${book} ${chapterVerse} is an invalid passage reference in the original.`
              }

            }

            break
          }

          clearLines(1)

          // group originalLocs into sets
          const originalLocsSets = []
          ;[ ...new Set(originalLocsToCheck) ].sort().forEach(originalLoc => {
            if((originalLocsSets.slice(-1)[0] || []).slice(-1)[0] === getPreviousOriginalLoc(originalLoc)) {
              originalLocsSets.slice(-1)[0].push(originalLoc)
            } else {
              originalLocsSets.push([ originalLoc ])
            }
          })

          for(let i=0; i<originalLocsSets.length; i++) {
            await confirmAndCorrect({
              originalLocs: originalLocsSets[i],
              progress: (i+1) / originalLocsSets.length
            })
          }

          originalLocsToCheck = []

        }

      }
  
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

    // update versions.js
    let newVersionsFile = versionsFile
    newVersionsFile = newVersionsFile.replace(new RegExp(` *import ${versionId}Requires from '\\./assets/bundledVersions/${!encryptEveryXChunks ? `${versionId}-encrypted` : versionId}/requires'.*\\n`), ``)
    const newImportLine = `import ${versionId}Requires from './assets/bundledVersions/${versionWithEncryptedIfRelevant}/requires'`

    if(versionInfo.bundled) {
      versionInfo.files = `${versionId}Requires`
      if(!newVersionsFile.includes(newImportLine)) {
        newVersionsFile = newVersionsFile.replace(/((?:^|\n)[^\/].*\n)/, `$1${newImportLine}\n`)
      }
    } else {
      if(newVersionsFile.includes(newImportLine)) {
        newVersionsFile = newVersionsFile.replace(new RegExp(` *import ${versionId}Requires from '\\./assets/bundledVersions/${versionWithEncryptedIfRelevant}/requires'.*\\n`), ``)
      }
    }

    // update revision number if there was a change
    if(hasChange) {
      versionInfo[`${versionId}RevisionNum`]++
    }

    // swap in or insert new versionInfo
    const insertStr = JSON.stringify(versionInfo, null, '  ').replace(/\n/g, '\n  ')
    newVersionsFile = (
      (
        versionInfoRegex.test(newVersionsFile)
          ? newVersionsFile.replace(versionInfoRegex, insertStr)
          : newVersionsFile.replace(/(\]\s*export default bibleVersions)/, `  ${insertStr},\n$1`)
      )
        .replace(/"([^"]+Requires)"/g, '$1')
        .replace(/\n    "([^"]+)"/g, '\n    $1')
        .replace(/copyright: "(.*)",?/g, `copyright: removeIndentAndBlankStartEndLines(\`\n      ${versionInfo.copyright.replace(/`/g, '\\`').replace(/(?:\\n|\n)/g, '\n      ')}\n    \`),`)
    )

    await fs.writeFile(`${tenantDir}/versions.js`, newVersionsFile)
    await fs.remove(tempFilePath)
    console.log(``)
    console.log(`Updated ${tenantDir}/versions.js`)

    // submit version to bible tags data, if changed
    const serverVersionInfoKeys = [
      "id",
      "name",
      "languageId",
      "wordDividerRegex",
      "partialScope",
      "versificationModel",
      "skipsUnlikelyOriginals",
      "extraVerseMappings",
    ]

    if(serverVersionInfoKeys.some(key => !equalObjsIgnoreKeyOrdering(existingVersionInfo[key], versionInfo[key]))) {

      console.log(``)
      spinnies.add('submit-version', { text: `Submitting version info to ${graphqlUrl}` })

      try {
        await request(
          graphqlUrl,
          gql`
            mutation {
              addVersion(
                input: {
                  ${serverVersionInfoKeys.map(key => {
                    let value = JSON.stringify(versionInfo[key] === undefined ? null : versionInfo[key])
                    if(key === 'extraVerseMappings') {
                      return `extraVerseMappingsStr: ${JSON.stringify(value)}`
                    } else {
                      return `${key}: ${value}`
                    }
                  })}
                }
              ) {
                id
              }
            }
          `,
        )
        spinnies.succeed('submit-version', { text: `Submitted version info to ${graphqlUrl}` })
      } catch(err) {
        spinnies.fail('submit-version', { text: `Could not submit version info to ${graphqlUrl}.` })
      }

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

    const { confirmSyncVersionToDev=false } = (await inquirer.prompt([{
      type: 'list',
      name: `confirmSyncVersionToDev`,
      message: `Set this version up for testing locally?`+` Includes adding this version to local DB, syncing to \`/dev\` in the cloud, and submitting word hashes locally. Requires @bibletags/bibletags-data installation.`.gray,
      when: () => !hasJsonInfoFile,
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

      // the following section is custom import help code for Biblearc
      if(tenant === 'biblearc') {
        const biblearcVersionInfoKeys = [
          "id",
          "abbr",
          "name",
          "wordDividerRegex",
          "copyright",
          "versificationModel",
          "skipsUnlikelyOriginals",
          "extraVerseMappings",
          // hebrewOrdering,
          "partialScope",
          "languageId",
        ]
        const biblearcVersionInfo = {}
        biblearcVersionInfoKeys.forEach(key => {
          biblearcVersionInfo[key] = versionInfo[key]
        })

        const { confirmBiblearcImport=true } = (await inquirer.prompt([{
          type: 'list',
          name: `confirmBiblearcImport`,
          message: `Import to Biblearc?`,
          when: () => !hasJsonInfoFile,
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
        if(confirmBiblearcImport) {
          console.log(``)
          const biblearcCommand = `cd ../../biblearc/biblearc-data && npm run import-usfm ${folders[0]} ${JSON.stringify(JSON.stringify(biblearcVersionInfo))} force && cd -`
          console.log(`Running the following:\n\n${biblearcCommand}\n`)
          await new Promise((resolve, reject) => {
            exec(
              biblearcCommand,
              (error, stdout, stderr) => {
                if(error !== null || stderr) {
                  reject()
                } else if(stdout) {
                  console.log(stdout)
                  if(stdout.includes(`(4) Open`)) resolve()
                }
              }
            )
          })
        }
      }

    }

  } catch(err) {

    console.log(``)
    console.log(`ERROR: ${err.message}`.bgRed.brightWhite)
    console.log(``)
    console.log(err)
    console.log(``)

  }

  process.exit()

})()
