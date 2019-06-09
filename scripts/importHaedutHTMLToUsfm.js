const Database = require('better-sqlite3')
const fs = require('fs')
const readline = require('readline')
const stream = require('stream')

const bookNames = [
  "",
  ["GEN", 1, 50],
  ["EXO", 2, 40],
  ["LEV", 3, 27],
  ["NUM", 4, 36],
  ["DEU", 5, 34],
  ["JOS", 6, 24],
  ["JDG", 7, 21],
  ["RUT", 31, 4],
  ["1SA", 8, 31],
  ["2SA", 9, 24],
  ["1KI", 10, 22],
  ["2KI", 11, 25],
  ["1CH", 38, 29],
  ["2CH", 39, 36],
  ["EZR", 36, 10],
  ["NEH", 37, 13],
  ["EST", 34, 10],
  ["JOB", 29, 42],
  ["PSA", 27, 150],
  ["PRO", 28, 31],
  ["ECC", 33, 12],
  ["SNG", 30, 8],
  ["ISA", 12, 66],
  ["JER", 13, 52],
  ["LAM", 32, 5],
  ["EZK", 14, 48],
  ["DAN", 35, 12],
  ["HOS", 15, 14],
  ["JOL", 16, 4],
  ["AMO", 17, 9],
  ["OBA", 18, 1],
  ["JON", 19, 4],
  ["MIC", 20, 7],
  ["NAM", 21, 3],
  ["HAB", 22, 3],
  ["ZEP", 23, 3],
  ["HAG", 24, 2],
  ["ZEC", 25, 14],
  ["MAL", 26, 3],
  ["MAT", 0, 28],
  ["MRK", 0, 16],
  ["LUK", 0, 24],
  ["JHN", 0, 21],
  ["ACT", 0, 28],
  ["ROM", 0, 16],
  ["1CO", 0, 16],
  ["2CO", 0, 13],
  ["GAL", 0, 6],
  ["EPH", 0, 6],
  ["PHP", 0, 4],
  ["COL", 0, 4],
  ["1TH", 0, 5],
  ["2TH", 0, 3],
  ["1TI", 0, 6],
  ["2TI", 0, 4],
  ["TIT", 0, 3],
  ["PHM", 0, 1],
  ["HEB", 0, 13],
  ["JAS", 0, 5],
  ["1PE", 0, 5],
  ["2PE", 0, 3],
  ["1JN", 0, 5],
  ["2JN", 0, 1],
  ["3JN", 0, 1],
  ["JUD", 0, 1],
  ["REV", 0, 22],
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
    let chapter = 0
    let inTitleSection = false

    console.log(`Converting ${usfmBookAbbreviation}...`)

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

      // when I get to the footnotes, go to the next book
      if(/^<div id="_idContainer002"/.test(modifiedLine)) break
      
      // skip the book title section
      if(/^<div id="_idContainer000"/.test(modifiedLine)) inTitleSection = true
      if(inTitleSection && /^<\/div>$/.test(modifiedLine)) {
        inTitleSection = false
        continue
      }
      if(inTitleSection) continue

      if(!/^<p/.test(modifiedLine)) continue

      // normalization
      modifiedLine = modifiedLine
        .replace(/ ?(?:CharOverride-3|[a-zA-Z_]*CharOverride-[0-9]|ParaOverride-[0-9])/g, '')

      // get rid of anchors and empty spans
      modifiedLine = modifiedLine
        .replace(/<a id="_idTextAnchor[0-9]+"><\/a>/g, '')
        .replace(/<span ?[^>]*><\/span>/g, '')

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

      if(/^<p class="Tat-tatkoteret">/.test(modifiedLine)) {
        modifiedLine = modifiedLine
          .replace(/^<p class="Tat-tatkoteret">/, '')
          .replace(/<\/p>$/, '')

          if(/<\/?p/.test(modifiedLine)) unexpected(`bad subheading`)

          modifiedLine = modifiedLine
            .replace(/<[^>]+>/, '')
            .replace(/•/, '')
            .trim()
          
          fileToWrite += `\\s2 ${modifiedLine}\n`

          continue
      }

      if(/^<p class="(?:Text-ragil|TEXT_RAZ|Text-ragil-copy)">/.test(modifiedLine)) {

        modifiedLine = modifiedLine
          .replace(/^<p class="(?:Text-ragil|TEXT_RAZ|Text-ragil-copy)">(.*)<\/p>$/, '\n\\p\n$1')

        if(/<\/?p/.test(modifiedLine)) unexpected(`bad paragraph`)

        // chapters
        modifiedLine = modifiedLine
          .replace(/(<span class="Ot-gdola">[א-ת]+ ?)<\/span><span class="Ot-gdola">/g, '$1')
          .replace(/<span class="Ot-gdola">([א-ת]+) ?<\/span>(.*)$/, (x, m) => `\n\\c ${chapter++}\n\\cp $1\n$1`)

        // verse numbers
        modifiedLine = modifiedLine
          .replace(/ ?<span class="Mispar-pasuk">([0-9]+)(?:<\/span><span class="Mispar-pasuk">)?-(?:<\/span><span class="Mispar-pasuk">)?([0-9]+)<\/span>/g, '\n\\v $2 \\vp $2-$1\\vp* ')
          .replace(/ ?<span class="Mispar-pasuk">([0-9]+) ?<\/span>/g, '\n\\v $1 ')

        // get rid of unwanted tags
        modifiedLine = modifiedLine
          .replace(/<br \/>/g, '')
          .replace(/<span class="Kohavit">\*? ?<\/span>/g, '')
          .replace(/<span class="Brosh">(?:| )<\/span>/g, '')
          .replace(/<span class="CharOverride-5"> <\/span>/g, '')

        // get rid of irrelevant classes and then spans
        modifiedLine = modifiedLine
          .replace(/<span (?:class="" )?lang="(?:ar-SA|en-US)">([^<]+)<\/span>/g, '$1')
          .replace(/<span class="(?:diana|Resh-KAmaz|Dalet-Shva|Dalet-Hirik|Lamed-hirik)">([^<]+)<\/span>/g, '$1')
          .replace(/<span class="(?:Lamed-Shva|Dalet-Patah|Resh-sagol-|Resh-Patah)">([^<]+)<\/span>/g, '$1')
          .replace(/<span class="(?:Lamed-Kamaz|Lamed-Patach|Kaf-sofit-shva|Resh-Shva)">([^<]+)<\/span>/g, '$1')
          .replace(/<span class="(?:Dalet-Kamaz|Zain-Sagol|Resh-Zira|Resh-Hirik|Nun-sagol|)">([^<]+)<\/span>/g, '$1')
          .replace(/<span class="(?:Kaf-1|Bab|0|shin-2|Zain-KAmaz|Bet-dagesh|Zain-Patach)">([^<]+)<\/span>/g, '$1')
          .replace(/<span class="(?:Bab-1|Shin|Vav-Patah|Sin|Zain|Kaf-Dagesh|Pei-Dagesh)">([^<]+)<\/span>/g, '$1')
          .replace(/<span class="(?:KAf-patah|Het-Hataf-Patah|Alef-Patah|Alef-hataf-patah)">([^<]+)<\/span>/g, '$1')
          .replace(/<span class="(?:Tav-kamaz|Tav-Shva|Kav-sofit-kamaz)">([^<]+)<\/span>/g, '$1')

        // convert html entities
        modifiedLine = modifiedLine
          .replace(/&quot;/g, '"')
          .replace(/&apos;/g, "'")
          .replace(/&#160;/g, '')

        if(/<[^>]+>/.test(modifiedLine)) unexpected(`more tags: ${modifiedLine}`)
        if(/&/.test(modifiedLine)) unexpected(`unhandled &: ${modifiedLine}`)

        modifiedLine = modifiedLine
        //   .replace(/<[^>]+>/, '')
          .trim()
        
        fileToWrite += `${modifiedLine}\n`

        continue
      }

      if(/<\/?p/.test(modifiedLine)) unexpected(`unexpected paragraph`)

    }

    if(bookNames[bookId][2] !== chapter) {
      console.log(`chapters bug: ${bookNames[bookId][2]} vs ${chapter}`)
      process.exit()
    }

    // write
    fs.writeFileSync(`${destDir}/${usfmBookAbbreviation}.usfm`, fileToWrite)

    console.log(` ...wrote ${chapter} chapters`)

  }

  console.log(`\nCompleted conversion to USFM. Files placed in ${destDir}.\n`)
    
  process.exit()

})()
