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

      if(/^<p class="(?:Text-ragil|TEXT_RAZ)">/.test(modifiedLine)) {

        modifiedLine = modifiedLine
          .replace(/^<p class="(?:Text-ragil|TEXT_RAZ)">(.*)<\/p>$/, '\n\\p\n$1')

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
          .replace(/<span class="Kohavit">\*? ?<\/span>/g, '')
          .replace(/<span class="Brosh"><\/span>/g, '')
          .replace(/<span class="CharOverride-5"> <\/span>/g, '')
          .replace(/<br \/>/g, '')

        // get rid of irrelevant classes and then spans
        modifiedLine = modifiedLine
          .replace(/<span class="(?:diana|Resh-KAmaz|Dalet-Shva|Dalet-Hirik|Lamed-hirik)">([^<]+)<\/span>/g, '$1')
          .replace(/<span class="(?:Lamed-Shva|Dalet-Patah|Resh-sagol-|Resh-Patah)">([^<]+)<\/span>/g, '$1')
          .replace(/<span class="(?:Lamed-Kamaz|Lamed-Patach|Kaf-sofit-shva|Resh-Shva)">([^<]+)<\/span>/g, '$1')
          .replace(/<span class="(?:Dalet-Kamaz|Zain-Sagol|Resh-Zira|Resh-Hirik|Nun-sagol|)">([^<]+)<\/span>/g, '$1')
          .replace(/<span class="(?:Kaf-1|Bab|0|shin-2|Zain-KAmaz|Bet-dagesh|Zain-Patach)">([^<]+)<\/span>/g, '$1')
          .replace(/<span class="(?:Bab-1)">([^<]+)<\/span>/g, '$1')

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


    // write
    fs.writeFileSync(`${destDir}/${usfmBookAbbreviation}.usfm`, fileToWrite)

    console.log(` ...wrote ${chapter} chapters`)

  }

  console.log(`\nCompleted conversion to USFM. Files placed in ${destDir}.\n`)
    
  process.exit()

})()
