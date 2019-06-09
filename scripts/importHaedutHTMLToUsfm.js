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

            const chapLetters = modifiedLine.replace(/^<span class="Ot-gdola">[א-ת]+<\/span>.*$/, '$1')
            chapter++

            fileToWrite += `\\c ${chapter}\n`
            fileToWrite += `\\cp ${chapLetters}\n`

            modifiedLine = modifiedLine
              .replace(/^<span class="Ot-gdola">[א-ת]+<\/span>/, '')

          }

          // verse numbers
          modifiedLine = modifiedLine
            .replace(/ ?<span class="Mispar-pasuk [a-zA-Z_]*CharOverride-[0-9]">([0-9]+)<\/span>/g, '\n\\v $1 ')

          // get rid of unwanted spans
          modifiedLine = modifiedLine
          .replace(/<span class="Kohavit">\*<\/span>/g, '')

          // get rid of irrelevant spans
          modifiedLine = modifiedLine
            .replace(/<span class="(?:diana|Resh-KAmaz|Dalet-Shva|Dalet-Hirik)">([^<]+)<\/span>/g, '$1')

          if(/<[^>]+>/.test(modifiedLine)) unexpected(`more tags: ${modifiedLine}`)

          // modifiedLine = modifiedLine
          //   .replace(/<[^>]+>/, '')
          //   .trim()
          
          fileToWrite += `${modifiedLine}\n`

          continue
      }

      // if(row.chapter !== chapter) {
      //   fileToWrite += `\n`
      //   fileToWrite += `\\c ${row.chapter}\n`
      //   chapter = row.chapter
      // }

      // fileToWrite += `\\p\n`
      // fileToWrite += `\\v ${row.verse} ${row.strippedcontent}\n`



{/*
			<p class="Tat_koteret_hadasha"><span class="CharOverride-1" lang="en-US">•</span><span class="CharOverride-2" lang="en-US">  </span>בריאת העולם<span class="CharOverride-2" lang="en-US">  </span><span class="CharOverride-1" lang="en-US">•</span></p>
			<p class="Text-ragil ParaOverride-1"><span class="Ot-gdola">א</span>בראשית ברא אלוהים את השמים ואת הארץ. <span class="Mispar-pasuk _idGenCharOverride-1">2</span>הארץ הייתה חסרת צורה וסדר, חושך שרר על פני תהום, ורוח אלוהים ריחפה על פני המים. </p>
			<p class="Tat-tatkoteret">היום הראשון</p>
			<p class="Text-ragil ParaOverride-1"><span class="Mispar-pasuk CharOverride-3">3</span>אלוהים אמר: <span class="diana">&quot;</span>יהי אור!<span class="diana">&quot;</span>, והאור נוצר. <span class="Mispar-pasuk CharOverride-3">4</span>האור מצא חן בעיני אלוהים, והוא הבדיל בין האור לבין החושך. <span class="Mispar-pasuk _idGenCharOverride-1">5</span>לאור קרא אלוהים יום ולחושך קרא לילה. בא הערב ובא הבוקר - יום אחד. </p>
			<p class="Tat-tatkoteret">היום השני</p>
			<p class="Text-ragil ParaOverride-1"><span class="Mispar-pasuk CharOverride-3">6</span>אלוהים אמר: <span class="diana">&quot;</span>יהי <span class="Resh-KAmaz">רָ</span>קיע בתוך המים כדי להבדיל בין מים למים!<span class="diana">&quot;</span>. <span class="Mispar-pasuk CharOverride-3">7</span>אלוהים עשה את הרקיע והבדיל בין המים שמתחת לרקיע לבין המים שמעליו, וכך היה. <span class="Mispar-pasuk _idGenCharOverride-1">8</span>אלוהים קרא לרקיע שמים. בא הערב ובא הבוקר - היום השני. </p>
			<p class="Tat-tatkoteret">היום השלישי</p>
			<p class="Text-ragil ParaOverride-1"><span class="Mispar-pasuk CharOverride-3">9</span>אלוהים אמר: <span class="diana">&quot;</span>ייאספו המים שמתחת לשמים למקום אחד כדי שהיבשה תיראה!<span class="diana">&quot;</span>, וכך היה. <span class="Mispar-pasuk _idGenCharOverride-1">10</span>ליבשה קרא אלוהים ארץ ולמים שנאספו קרא ימים. מה שאלוהים עשה מצא חן בעיניו. </p>
			<p class="Text-ragil ParaOverride-1"><span class="Mispar-pasuk _idGenCharOverride-1">11</span>אלוהים אמר: <span class="diana">&quot;</span>תצמיח הארץ צמחייה, צמחים שונים בעלי זרעים ועצי פרי שונים שבפרותיהם זרעים!<span class="diana">&quot;</span>, וכך היה. <span class="Mispar-pasuk _idGenCharOverride-1">12</span>הארץ הצמיחה צמחייה, צמחים שונים בעלי זרעים ועצי פרי שונים שבפרותיהם זרעים. מה שעשה אלוהים מצא חן בעיניו. <span class="Mispar-pasuk _idGenCharOverride-1">13</span>בא הערב ובא הבוקר - היום השלישי.</p>
			<p class="Tat-tatkoteret">היום הרביעי</p>
			<p class="Text-ragil ParaOverride-1"><span class="Mispar-pasuk _idGenCharOverride-1">14</span>אלוהים אמר: <span class="diana">&quot;</span>יהיו מְאוֹרוֹת בשמים כדי להבדיל בין היום לבין הלילה וכדי לציין את הזמנים, את עונות השנה, את החגים, את הימים ואת השנים. <span class="Mispar-pasuk _idGenCharOverride-1">15</span>המאורות יהיו בשמים כדי להאיר את הארץ!<span class="diana">&quot;</span>, וכך היה. <span class="Mispar-pasuk _idGenCharOverride-1">16</span>אלוהים עשה את שני המאורות הגדולים: את המָאור הגדול למשול ביום, ואת המאור הקטן למשול בלילה. גם את הכוכבים עשה. <span class="Mispar-pasuk _idGenCharOverride-1">17</span>אלוהים שם את המאורות בשמים כדי להאיר על הארץ, <span class="Mispar-pasuk _idGenCharOverride-1">18</span>למשול ביום ובלילה ולהבדיל בין האור לבין החושך. מה שעשה אלוהים מצא חן בעיניו. <span class="Mispar-pasuk _idGenCharOverride-1">19</span>בא הערב ובא הבוקר - היום הרביעי. </p>
			<p class="Tat-tatkoteret">היום החמישי</p>
			<p class="Text-ragil ParaOverride-1"><span class="Mispar-pasuk _idGenCharOverride-1">20</span>אלוהים אמר: <span class="diana">&quot;</span>יתמלאו המים בבעלי חיים, ועופות יעופפו בשמים, מעל פני האדמה!<span class="diana">&quot;</span>. <span class="Mispar-pasuk _idGenCharOverride-1">21</span>אלוהים ברא את חיות המים הגדולות, את כל חיות המים השונות ואת כל העופות השונים בעלי הכנף. מה שעשה אלוהים מצא חן בעיניו. <span class="Mispar-pasuk _idGenCharOverride-1">22</span>אלוהים בירך אותם ואמר: <span class="diana">&quot;</span>התרבו ומלאו את מי הים, והעופות יִרבו בארץ<span class="diana">&quot;</span>. <span class="Mispar-pasuk _idGenCharOverride-1">23</span>בא הערב ובא הבוקר - היום החמישי. </p>
			<p class="Tat-tatkoteret">היום השישי</p>
			<p class="Text-ragil ParaOverride-1"><span class="Mispar-pasuk _idGenCharOverride-1">24</span>אלוהים אמר: <span class="diana">&quot;</span>תוציא הארץ בעלי חיים שונים, בהמות, חרקים, זוחלים וחיות בר שונות!<span class="diana">&quot;</span>, וכך היה. <span class="Mispar-pasuk _idGenCharOverride-1">25</span>אלוהים עשה את חיות הבר השונות, את הבהמות השונות ואת החרקים והזוחלים השונים. מה שעשה אלוהים מצא חן בעיניו.</p>
			<p class="Text-ragil"><span class="Mispar-pasuk _idGenCharOverride-1">26</span>אלוהים אמר: <span class="diana">&quot;</span>נעשה אדם שיהיה דומה לנו וישלוט בדגי הים, בעופות, בבהמות, בכל הארץ ובכל החרקים והזוחלים שעל פני האדמה<span class="diana">&quot;</span>. <span class="Mispar-pasuk _idGenCharOverride-1">27</span>אלוהים ברא את האדם בדמותו, בדמות אלוהים ברא אותו. הוא ברא אותם זכר ונקבה. <span class="Mispar-pasuk _idGenCharOverride-1">28</span>אלוהים בירך אותם ואמר: <span class="diana">&quot;</span>התרבו ומלאו את הארץ, כִּבשו אותה ושִלטו בדגי הים, בעופות ובכל החרקים והזוחלים שעל פני האדמה. <span class="Mispar-pasuk _idGenCharOverride-1">29</span>אני נותן לכם למאכל את כל הצמחים בעלי הזרעים שעל פני האדמה ואת כל העצים המניבים פרי שבתוכו זרעים. <span class="Mispar-pasuk _idGenCharOverride-1">30</span>גם כל החיות, העופות, החרקים והזוחלים, כל היצורים החיים על פני האדמה, יאכלו מהצמחים ומהירק<span class="diana">&quot;</span>, וכך היה. <span class="Mispar-pasuk _idGenCharOverride-1">31</span>כל מה שעשה אלוהים מצא חן בעיניו מאוד. בא הערב ובא הבוקר - היום השישי. </p>
			<p class="Tat-tatkoteret">היום השביעי </p>
			<p class="Text-ragil ParaOverride-1"><span class="Ot-gdola">ב</span>השמים והארץ וכל אשר בהם הושלמו. <span class="Mispar-pasuk CharOverride-3">2</span>ביום השביעי סיים אלוהים את מה שעשה ושבת מכל מלאכת הבריאה. <span class="Mispar-pasuk _idGenCharOverride-1">3</span>אלוהים בירך את היום השביעי והקדיש אותו כי בו שבת מכל מלאכת הבריאה.</p>
			<p class="Text-ragil"><span class="Mispar-pasuk _idGenCharOverride-1">4</span>אלה קורות השמים והארץ בזמן שנבראו. </p>
			<p class="Text-ragil">כאשר עשה ה<span class="diana">&apos;</span> אלוהים את השמים ואת הארץ, <span class="Mispar-pasuk CharOverride-3">5</span>לא היו בארץ צמחי בר כי ה<span class="diana">&apos;</span> אלוהים עדיין לא הוריד גשם על הארץ ולא היה אדם שיעבוד את האדמה. <span class="Mispar-pasuk CharOverride-3">6</span>אדים שעלו מן הארץ הִשקו את האדמה.</p>
			<p class="Text-ragil"><span class="Mispar-pasuk CharOverride-3">7</span>ה<span class="diana">&apos;</span> אלוהים יצר את האדם מעפר האדמה. אחרי שנפח בו רוח חיים, היה האדם ליצור חי. </p>
			<p class="Tat_koteret_hadasha"><span class="CharOverride-1" lang="en-US">•</span><span class="CharOverride-2" lang="en-US">  </span>גן עדן<span class="CharOverride-2" lang="en-US">  </span><span class="CharOverride-1" lang="en-US">•</span></p>
			<p class="Text-ragil ParaOverride-1"><span class="Mispar-pasuk _idGenCharOverride-1">8</span>ה<span class="diana">&apos;</span> אלוהים נטע גן בעדן שבמזרח ושם בגן את האדם שיצר. <span class="Mispar-pasuk _idGenCharOverride-1">9</span>ה<span class="diana">&apos;</span> אלוהים הצמיח מן האדמה כל מיני עצים יפים שפרותיהם טובים למאכל. בתוך הגן צמחו גם עץ החיים ועץ הדעת טוב ורע.</p>
			<p class="Text-ragil"><span class="Mispar-pasuk _idGenCharOverride-1">10</span>מעדן יצא נהר שהִשקה את הגן ומשם התפצל לארבעה נהרות: <span class="Mispar-pasuk _idGenCharOverride-1">11</span>שֵם האחד פִּישׁוֹן, הוא הנהר שהקיף את כל ארץ החֲוִוי<span class="Lamed-Kamaz">לָ</span>ה, <span class="Mispar-pasuk _idGenCharOverride-1">12</span>שהיו בה זהב משובח, בְּדוֹ<span class="Lamed-Patach">לַ</span>ח ואבני שׁוֹהַם<span class="Brosh _idGenCharOverride-2"></span>. <span class="Mispar-pasuk _idGenCharOverride-1">13</span>שֵם הנהר השני גִיחוֹן, הוא הנהר שהקיף את כל ארץ כּוּשׁ. <span class="Mispar-pasuk _idGenCharOverride-1">14</span>שֵם הנהר השלישי חִי<span class="Dalet-Shva">דֶ</span>קֶל, והוא הנהר שזרם ממזרח לאַשׁוּר. הנהר הרביעי היה פְּ<span class="Resh-KAmaz">רָ</span>ת.</p>
			<p class="Text-ragil"><span class="Mispar-pasuk _idGenCharOverride-1">15</span>ה<span class="diana">&apos;</span> אלוהים שם את אדם בגן עדן כדי שיטפח את הגן וישמור עליו. <span class="Mispar-pasuk _idGenCharOverride-1">16</span><span class="diana">&quot;</span>מכל עצי הגן מותר לך לאכול<span class="diana">&quot;</span>, ציווה ה<span class="diana">&apos;</span> על אדם, <span class="Mispar-pasuk _idGenCharOverride-1">17</span><span class="diana">&quot;</span>רק מעץ הדעת טוב ורע אל תאכל, כי כאשר תאכל ממנו תמות<span class="diana">&quot;</span>. </p>
			<p class="Tat_koteret_hadasha"><span class="CharOverride-1" lang="en-US">•</span><span class="CharOverride-2" lang="en-US">  </span>האישה<span class="CharOverride-2" lang="en-US">  </span><span class="CharOverride-1" lang="en-US">•</span></p> */}



    }

    // write
    fs.writeFileSync(`${destDir}/${usfmBookAbbreviation}.usfm`, fileToWrite)

  }

  console.log(`\nCompleted conversion to USFM. Files placed in ${destDir}.\n`)
    
  process.exit()

})()
