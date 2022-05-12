require('dotenv').config()

const { S3Client } = require('@aws-sdk/client-s3')
const S3SyncClient = require('s3-sync-client')
const Database = require('better-sqlite3')
const { i18n, i18nNumber } = require("inline-i18n")
const { getWordsHash, getWordHashes, passOverI18n, passOverI18nNumber } = require("@bibletags/bibletags-ui-helper")
const { request, gql } = require('graphql-request')
const { exec } = require('child_process')

passOverI18n(i18n)
passOverI18nNumber(i18nNumber)

const s3Client = new S3Client({
  region: process.env.AWS_REGION || `us-east-1`,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
})
const { sync } = new S3SyncClient({ client: s3Client })

const goSyncVersions = async ({ stage }) => {

  const s3Dir = `s3://cdn.bibletags.org/tenants/${process.env.EMBEDDING_APP_ID}/${stage}/versions`
  const syncDir = `tenants/${process.env.TENANT_NAME}/versions`

  console.log(``)
  console.log(`Sync ${syncDir} to ${s3Dir}...`)

  const { uploads } = await sync(syncDir, s3Dir)

  console.log(``)
  console.log(`Starting \`bibletags-data\` to be able to submit word hashes locally...`)
  await new Promise(resolve => exec(`kill -9 $(lsof -i:8082 -t) 2> /dev/null`, resolve))  // make sure it isn't already running
  exec(`cd ../bibletags-data && npm start`)
  await new Promise(resolve => setTimeout(resolve, 1000))  // give it 1 second to start

  for(let upload of uploads) {
    const { id, path } = upload
    const [ x1, embeddingAppId, stage, x2, versionId, x3, fileName ] = id.split('/')

    if(versionId === 'original') continue

    const bookId = parseInt(fileName.split('.')[0], 10)
    const uri = (
      process.env.BIBLETAGS_DATA_GRAPHQL_URI
      || (
        stage === 'dev'
          ? "http://localhost:8082/graphql"
          : "https://data.bibletags.org/graphql"
      )
    )

    if(bookId) {
      console.log(`  - submit word hash sets for bookId:${bookId} (${versionId})`)

      const db = new Database(path)
      const tableName = `${versionId}VersesBook${bookId}`

      const verses = db.prepare(`SELECT * FROM ${tableName}`).all()

      const input = verses.map(verse => {

        const { loc, usfm } = verse
        const params = {
          usfm,
        }

        const wordsHash = getWordsHash(params)
        const wordHashes = JSON.stringify(getWordHashes(params)).replace(/([{,])"([^"]+)"/g, '$1$2')

        return `{ loc: "${loc}", versionId: "${versionId}", wordsHash: "${wordsHash}", embeddingAppId: "${embeddingAppId}", wordHashes: ${wordHashes}}`

      })

      const composedQuery = gql`
        mutation {
          submitWordHashesSets(input: [${input.join(',')}])
        }
      `

      await request(uri, composedQuery)

    }

  }

  await new Promise(resolve => exec(`kill -9 $(lsof -i:8082 -t) 2> /dev/null`, resolve))  // kills the npm start on /bibletags-data

  uploads.forEach(({ path }) => {
    console.log(`  > updated ${path.slice(syncDir.length)}`)
  })

  console.log(`  ...done.`)
  console.log(``)

}

module.exports = goSyncVersions