const Database = require('better-sqlite3')
const fs = require('fs')
const readline = require('readline')
const stream = require('stream')

const bookNames = [
  "",
  ["GEN", 1],
  ["EXO", 2],
  ["LEV", 3],
  ["NUM", 4],
  ["DEU", 5],
  ["JOS", 6],
  ["JDG", 7],
  ["RUT", 31],
  ["1SA", 8],
  ["2SA", 9],
  ["1KI", 10],
  ["2KI", 11],
  ["1CH", 38],
  ["2CH", 39],
  ["EZR", 36],
  ["NEH", 37],
  ["EST", 34],
  ["JOB", 29],
  ["PSA", 27],
  ["PRO", 28],
  ["ECC", 33],
  ["SNG", 30],
  ["ISA", 12],
  ["JER", 13],
  ["LAM", 32],
  ["EZK", 14],
  ["DAN", 35],
  ["HOS", 15],
  ["JOL", 16],
  ["AMO", 17],
  ["OBA", 18],
  ["JON", 19],
  ["MIC", 20],
  ["NAM", 21],
  ["HAB", 22],
  ["ZEP", 23],
  ["HAG", 24],
  ["ZEC", 25],
  ["MAL", 26],
  ["MAT"],
  ["MRK"],
  ["LUK"],
  ["JHN"],
  ["ACT"],
  ["ROM"],
  ["1CO"],
  ["2CO"],
  ["GAL"],
  ["EPH"],
  ["PHP"],
  ["COL"],
  ["1TH"],
  ["2TH"],
  ["1TI"],
  ["2TI"],
  ["TIT"],
  ["PHM"],
  ["HEB"],
  ["JAS"],
  ["1PE"],
  ["2PE"],
  ["1JN"],
  ["2JN"],
  ["3JN"],
  ["JUD"],
  ["REV"],
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

const bookIdRegex = /^\\id ([A-Z1-3]{3}) .*$/
const irrelevantLinesRegex = /^\\(?:usfm|ide|h)(?: .*)?$/
const majorTitleRegex = /^\\mt[0-9]? .*$/
const chapterRegex = /^\\c ([0-9]+)$/
const paragraphRegex = /^\\p(?: .*)?$/
const verseRegex = /^\\v ([0-9]+)(?: .*)?$/
const extraBiblicalRegex = /(?:^\\mt[0-9]? .*$|\\v [0-9]+ ?)/gm
const allTagsRegex = /\\[a-z0-9]+ ?/g
const newlinesRegex = /\n/g
const doubleSpacesRegex = / {2-}/g

;(async () => {

  const sourceDir = '/Users/huberts/Google Drive/ERAS/BibleTags/העדות/HTML Bible files'
  const destDir = '/Users/huberts/Google Drive/ERAS/BibleTags/העדות/USFM'

  const files = fs.readdirSync(sourceDir)

  for(let file of files) {
    if(!file.match(/\.html$/i)) continue

    const hebBookIdAndBookName = file.replace(/\.html$/i, '').split('_')

    const hebBookId = parseInt(hebBookIdAndBookName.pop(), 10)
    const bookName = hebBookIdAndBookName.join(' ')
    
    let bookId = 0

    bookNames.some(([ bookAbbr, hebOrdering ], bId) => {
      if(hebOrdering === hebBookId) {
        bookId = bId
        return true
      }
    })

    if(bookId === 0) {
      console.log(`Could not find bookId for ${file}`)
      process.exit()
    }

    let fileToWrite = ``
    const usfmBookAbbreviation = bookNames[bookId][0]

    fileToWrite += `\\id ${usfmBookAbbreviation} העדות\n`
    fileToWrite += `\\usfm 3.0\n`
    fileToWrite += `\\ide UTF-8\n`
    fileToWrite += `\\h ${bookName}\n`
    fileToWrite += `\\mt ${bookName}\n`

    const input = fs.createReadStream(`${sourceDir}/${file}`)

    for await (const line of readLines({ input })) {

      // convert to usfm

      const unexpected = issue => {
        console.log(`Unexpected line: ${issue}`, line)
        process.exit()
      }

      let modifiedLine = line.trim()
      let chapter = 0

      if(!/^<p/.test(modifiedLine)) continue

      if(/^<p class="Tat_koteret_hadasha">/.test(modifiedLine)) {
        modifiedLine = modifiedLine
          .replace(/^<p class="Tat_koteret_hadasha">/, '')
          .replace(/<\/p>$/, '')

          if(/<\/?p/.test(modifiedLine)) unexpected(`bad heading`)

          modifiedLine = modifiedLine
            .replace(/<[^>]+>/, '')
            .replace(/•/, '')
            .trim()
          
          fileToWrite += `\\s1 ${modifiedLine}\n`

          continue
      }

      if(/^<p class="Text-ragil(?: ParaOverride-1)?">/.test(modifiedLine)) {
        modifiedLine = modifiedLine
          .replace(/^<p class="Text-ragil(?: ParaOverride-1)?">/, '')
          .replace(/<\/p>$/, '')

          if(/<\/?p/.test(modifiedLine)) unexpected(`bad paragraph`)

          if(/<span class="Ot-gdola">[א-ת]+<\/span>/.test(modifiedLine)) {

            if(!/^<span class="Ot-gdola">[א-ת]+<\/span>/.test(modifiedLine)) unexpected(`new chap not at beginning of p`)

            // take care of when there are 2+ letters in separate spans
            modifiedLine = modifiedLine
              .replace(/<\/span><span class="Ot-gdola">/g, '')

            const chapLetters = modifiedLine.replace(/^<span class="Ot-gdola">[א-ת]+<\/span>.*$/, '$1')
            chapter++

            fileToWrite += `\\c ${chapter}\n`
            fileToWrite += `\\cp ${chapLetters}\n`

            modifiedLine = modifiedLine
              .replace(/^<span class="Ot-gdola">[א-ת]+<\/span>/, '')

          }

          // verse numbers
          modifiedLine = modifiedLine
            .replace(/ ?<span class="Mispar-pasuk [a-zA-Z_]*CharOverride-[0-9]">([0-9]+) ?<\/span>/g, '\n\\v $1 ')

          // get rid of unwanted spans
          modifiedLine = modifiedLine
          .replace(/<span class="Kohavit">\*<\/span>/g, '')
          .replace(/<span class="Brosh [a-zA-Z_]*CharOverride-[0-9]"><\/span>/g, '')

          // get rid of irrelevant spans
          modifiedLine = modifiedLine
            .replace(/<span class="(?:diana|Resh-KAmaz|Dalet-Shva|Dalet-Hirik|Lamed-hirik|Lamed-Shva|Dalet-Patah|Resh-sagol-|Resh-Patah|Lamed-Kamaz)">([^<]+)<\/span>/g, '$1')

          if(/<[^>]+>/.test(modifiedLine)) unexpected(`more tags: ${modifiedLine}`)

          modifiedLine = modifiedLine
          //   .replace(/<[^>]+>/, '')
            .trim()
          
          fileToWrite += `${modifiedLine}\n`

          continue
      }

    }

    // write
    fs.writeFileSync(`${destDir}/${usfmBookAbbreviation}.usfm`, fileToWrite)

  }

  console.log(`\nCompleted conversion to USFM. Files placed in ${destDir}.\n`)
    
  process.exit()

})()
