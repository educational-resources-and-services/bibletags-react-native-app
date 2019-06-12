const Database = require('better-sqlite3')
const fs = require('fs')
const readline = require('readline')
const stream = require('stream')

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

const getLocFromRef = ({ bookId, chapter, verse }) => (
  `${('0'+bookId).substr(-2)}${('00'+chapter).substr(-3)}${('00'+verse).substr(-3)}`
)

const bookIdRegex = /^\\id ([A-Z1-3]{3}) .*$/
const irrelevantLinesRegex = /^\\(?:usfm|ide|h)(?: .*)?$/
const majorTitleRegex = /^\\mt[0-9]? .*$/
const majorSectionRegex = /^\\ms[0-9]? .*$/
const sectionRegex = /^\\s[0-9]? .*$/
const chapterCharacterRegex = /^\\cp .*$/
const chapterRegex = /^\\c ([0-9]+)$/
const paragraphRegex = /^\\p(?: .*)?$/
const verseRegex = /^\\v ([0-9]+)(?: .*)?$/
const extraBiblicalRegex = /(?:^\\(?:mt|ms|s)[0-9]? .*$|^\\(?:cp) .*$|\\v [0-9]+(?: \\vp [0-9]+-[0-9]+\\vp\*)? ?)/gm
const allTagsRegex = /\\[a-z0-9]+ ?/g
const newlinesRegex = /\n/g
const doubleSpacesRegex = / {2-}/g

;(async () => {

  let version, versionsDir

  try {

    const [ folder, version, tenant ] = JSON.parse(process.env.npm_config_argv).remain
    
    versionsDir = `./tenants/${tenant}/assets/versions`

    const db = new Database(`${versionsDir}/${version}.db`)

    const create = db.prepare(
      `CREATE TABLE ${version}Verses (
        loc TEXT PRIMARY KEY,
        usfm TEXT COLLATE NOCASE,
        search TEXT COLLATE NOCASE
      );`
    )

    create.run()
    
    const insert = db.prepare(`INSERT INTO ${version}Verses (loc, usfm, search) VALUES (@loc, @usfm, @search)`)

    const insertMany = db.transaction((verses) => {
      for(const verse of verses) insert.run(verse)
    })

    // loop through all files, parse them and do the inserts
    const files = fs.readdirSync(folder)

    for(let file of files) {
      if(!file.match(/\.u?sfm$/i)) continue

      const input = fs.createReadStream(`${folder}/${file}`)
      let bookId, chapter
      const verses = []
      let lastVerse = 0
      let goesWithNextVsText = []

      for await (const line of readLines({ input })) {

        if(!bookId) {

          while(!line.match(bookIdRegex)) continue
          
          const bookAbbr = line.replace(bookIdRegex, '$1')
          bookId = bookAbbrs.indexOf(bookAbbr)
    
          if(bookId < 1) break
    
          console.log(`Importing ${bookAbbr}...`)
          continue

        }

        if(line === '') continue
        if(irrelevantLinesRegex.test(line)) continue

        // get chapter
        if(chapterRegex.test(line)) {
          chapter = line.replace(chapterRegex, '$1')
          continue
        }

        // get tags which connect to verse text to follow
        if(
          majorTitleRegex.test(line)
          || majorSectionRegex.test(line)
          || sectionRegex.test(line)
          || chapterCharacterRegex.test(line)
          || paragraphRegex.test(line)
        ) {
          goesWithNextVsText.push(line)
          continue
        }

        // get verse
        if(verseRegex.test(line)) {

          const verse = line.replace(verseRegex, '$1')
          if(verse !== '1' && parseInt(verse, 10) !== lastVerse + 1) {
            console.log(`Non-consecutive verses: ${lastVerse} > ${verse}`)
          }
          lastVerse = parseInt(verse, 10)

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
        verse.search = verse.usfm
          .replace(extraBiblicalRegex, '')
          .replace(allTagsRegex, '')
          .replace(newlinesRegex, ' ')
          .replace(doubleSpacesRegex, ' ')
          .trim()
      })

      // console.log(verses.slice(0,5))
      insertMany(verses)

      console.log(`  ...inserted ${verses.length} verses.`)

    }

    console.log(`\n${version}.db successfully created and placed into ${versionsDir}\n`)
    
  } catch(err) {

    const logSyntax = () => {
      console.log(`Syntax: \`npm run usfm-to-sqlite -- path/to/directory/of/usfm/files tenant\``)
      console.log(`Example: \`npm run usfm-to-sqlite -- ../../versions/esv bibletags\`\n`)
    }

    switch(err.message.split(',')[0]) {

      case `table ${version}Verses already exists`: {
        console.log(`\nERROR: The table ${version}Verses already exists in ${versionsDir}/${version}.db\n`)
        break
      }

      case `Cannot open database because the directory does not exist`: {
        console.log(`\nERROR: Invalid tenant\n`)
        logSyntax()
        break
      }

      case `Cannot read property 'split' of undefined`: {
        console.log(`\nERROR: missing parameters\n`)
        logSyntax()
        break
      }

      case `ENOENT: no such file or directory`: {
        try { fs.unlinkSync(`${versionsDir}/${version}.db`) } catch(e) {}
        console.log(`\nERROR: invalid path\n`)
        logSyntax()
        break
      }

      default: {
        try { fs.unlinkSync(`${versionsDir}/${version}.db`) } catch(e) {}
        console.log(`\nERROR: ${err.message}\n`)
      }

    }
  }

  process.exit()

})()
