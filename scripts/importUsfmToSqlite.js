const Database = require('better-sqlite3')

let version, versionsDir

try {

  const [ folder, tenant ] = JSON.parse(process.env.npm_config_argv).remain
  
  version = folder.split('/').pop()
  versionsDir = `./tenants/${tenant}/assets/versions`

  const db = new Database(`${versionsDir}/${version}.db`)
  
  const create = db.prepare(
    `CREATE TABLE ${version}Verses (
      loc INTEGER PRIMARY KEY,
      usfm TEXT COLLATE NOCASE,
      search TEXT COLLATE NOCASE
    );`
  )

  create.run()
  
  const insert = db.prepare(`INSERT INTO ${version}Verses (loc, usfm, search) VALUES (@loc, @usfm, @search)`)

  const insertMany = db.transaction((verses) => {
    for(const verse of verses) insert.run(verse)
  })

  insertMany([
    {
      loc: '01001001',
      usfm: '\\v In the b...',
      search: 'In...',
    },
    {
      loc: '01001002',
      usfm: '\\v And the...',
      search: 'And...',
    },
  ])


  console.log(`${version}.db successfully created and placed into ${versionsDir}`)
  
} catch(err) {

  const logSyntax = () => {
    console.log(`Syntax: \`npm run usfm-to-sqlite -- path/to/directory/of/usfm/files tenant\``)
    console.log(`Example: \`npm run usfm-to-sqlite -- ../../versions/esv bibletags\`\n`)
  }

  switch(err.message) {

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

    default: {
      console.log(`\nERROR: ${err.message}`)
    }

  }
}

process.exit()

// console.log(row.firstName, row.lastName, row.email);


// const insert = db.prepare('INSERT INTO cats (name, age) VALUES (@name, @age)');

// const insertMany = db.transaction((cats) => {
//   for (const cat of cats) insert.run(cat);
// });

// insertMany([
//   { name: 'Joey', age: 2 },
//   { name: 'Sally', age: 4 },
//   { name: 'Junior', age: 1 },
// ]);




// const bookNames = [
//   "",
//   ["Genesis", "GEN"],
//   ["Exodus", "EXO"],
//   ["Leviticus", "LEV"],
//   ["Numbers", "NUM"],
//   ["Deuteronomy", "DEU"],
//   ["Joshua", "JOS"],
//   ["Judges", "JDG"],
//   ["Ruth", "RUT"],
//   ["1 Samuel", "1SA"],
//   ["2 Samuel", "2SA"],
//   ["1 Kings", "1KI"],
//   ["2 Kings", "2KI"],
//   ["1 Chronicles", "1CH"],
//   ["2 Chronicles", "2CH"],
//   ["Ezra", "EZR"],
//   ["Nehemiah", "NEH"],
//   ["Esther", "EST"],
//   ["Job", "JOB"],
//   ["Psalms", "PSA"],
//   ["Proverbs", "PRO"],
//   ["Ecclesiastes", "ECC"],
//   ["Song of Songs", "SNG"],
//   ["Isaiah", "ISA"],
//   ["Jeremiah", "JER"],
//   ["Lamentations", "LAM"],
//   ["Ezekiel", "EZK"],
//   ["Daniel", "DAN"],
//   ["Hosea", "HOS"],
//   ["Joel", "JOL"],
//   ["Amos", "AMO"],
//   ["Obadiah", "OBA"],
//   ["Jonah", "JON"],
//   ["Micah", "MIC"],
//   ["Nahum", "NAM"],
//   ["Habakkuk", "HAB"],
//   ["Zephaniah", "ZEP"],
//   ["Haggai", "HAG"],
//   ["Zechariah", "ZEC"],
//   ["Malachi", "MAL"],
//   ["Matthew", "MAT"],
//   ["Mark", "MRK"],
//   ["Luke", "LUK"],
//   ["John", "JHN"],
//   ["Acts", "ACT"],
//   ["Romans", "ROM"],
//   ["1 Corinthians", "1CO"],
//   ["2 Corinthians", "2CO"],
//   ["Galatians", "GAL"],
//   ["Ephesians", "EPH"],
//   ["Philippians", "PHP"],
//   ["Colossians", "COL"],
//   ["1 Thessalonians", "1TH"],
//   ["2 Thessalonians", "2TH"],
//   ["1 Timothy", "1TI"],
//   ["2 Timothy", "2TI"],
//   ["Titus", "TIT"],
//   ["Philemon", "PHM"],
//   ["Hebrews", "HEB"],
//   ["James", "JAS"],
//   ["1 Peter", "1PE"],
//   ["2 Peter", "2PE"],
//   ["1 John", "1JN"],
//   ["2 John", "2JN"],
//   ["3 John", "3JN"],
//   ["Jude", "JUD"],
//   ["Revelation", "REV"],
// ]

// const connection = mysql.createConnection({
//   host: 'localhost',
//   user: 'root',
//   password: '',
//   database: 'biblearc_static_copy'
// })

// connection.connect()

// ;(async () => {

//   await (new Promise(resolve => {
//     fs.mkdir(`./versions/${table}`, { recursive: true }, err => {
//       if(err) throw err
//       resolve()
//     })
//   }))

//   for(let bookId = 1; bookId <= 66; bookId++) {

//     await (new Promise(resolve => {

//       let fileToWrite = ``
//       const bookName = bookNames[bookId][0]
//       const usfmBookAbbreviation = bookNames[bookId][1]

//       fileToWrite += `\\id ${usfmBookAbbreviation} ${table}\n`
//       fileToWrite += `\\usfm 3.0\n`
//       fileToWrite += `\\ide UTF-8\n`
//       fileToWrite += `\\h ${bookName}\n`
//       fileToWrite += `\\mt ${bookName}\n`

//       connection.query(`SELECT * FROM ${table} WHERE book=? ORDER BY loc`, [ bookId ], (error, results) => {
//         if(error) throw error

//         let chapter

//         results.forEach(row => {

//           if(row.chapter !== chapter) {
//             fileToWrite += `\n`
//             fileToWrite += `\\c ${row.chapter}\n`
//             chapter = row.chapter
//           }

//           fileToWrite += `\\p\n`
//           fileToWrite += `\\v ${row.verse} ${row.strippedcontent}\n`

//         })

//         const path = `./versions/${table}/${usfmBookAbbreviation}.usfm`

//         fs.writeFile(path, fileToWrite, error => {
//           if(error) throw error
        
//           console.log(`Wrote ${path}`)
//           resolve()
//         })

//       })

//     }))

//   }

//   connection.end()
//   process.exit()

// })()



