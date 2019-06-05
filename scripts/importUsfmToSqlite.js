const Database = require('better-sqlite3')

let version, versionsDir

try {

  const [ folder, tenant ] = JSON.parse(process.env.npm_config_argv).remain
  
  version = folder.split('/').pop()
  versionsDir = `./tenants/${tenant}/assets/versions`

  const db = new Database(`${versionsDir}/${version}.db`)
  
  db
    .prepare(
      `CREATE TABLE ${version}Verses (
        loc INTEGER PRIMARY KEY,
        usfm TEXT COLLATE NOCASE,
        search TEXT COLLATE NOCASE
      );`
    )
    .run()
  
  db
    .prepare(`INSERT INTO ${version}Verses (loc, usfm, search) VALUES (@loc, @usfm, @search)`)
    .run({
      loc: '01001001',
      usfm: '\\v In the b...',
      search: 'In...',
    })
  
  
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