require('dotenv').config()

const { S3Client } = require('@aws-sdk/client-s3')
const S3SyncClient = require('s3-sync-client')
const Database = require('better-sqlite3')
const { getWordsHash, getWordHashes } = require("@bibletags/bibletags-ui-helper")
const { request, gql } = require('graphql-request')

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

  for(let upload of uploads) {
    const { id, path } = upload
    const [ x1, embeddingAppId, stage, x2, versionId, x3, fileName ] = id.split('/')
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
      console.log(`  - submit word hash sets for bookId:${bookId}, versionId:${versionId}`)

      const db = new Database(path)
      const tableName = `${versionId}VersesBook${bookId}`

      const verses = db.prepare(`SELECT * FROM ${tableName}`).all()

      let idx = 0

      const goSubmitWordHashesSet = async () => {

        if(idx >= verses.length - 1) return

        const { loc, usfm } = verses[++idx]
        const params = {
          usfm,
        }

        const wordsHash = getWordsHash(params)
        const wordHashes = JSON.stringify(getWordHashes(params)).replace(/([{,])"([^"]+)"/g, '$1$2')

        const composedQuery = gql`
          mutation {
            submitWordHashesSet(input: { loc: "${loc}", versionId: "${versionId}", wordsHash: "${wordsHash}", embeddingAppId: "${embeddingAppId}", wordHashes: ${wordHashes}}) {
              id
            }
          }
        `

        await request(uri, composedQuery)
        await goSubmitWordHashesSet()

      }

      await Promise.all(Array(10).fill().map(goSubmitWordHashesSet))
    }
  }

  uploads.forEach(({ path }) => {
    console.log(`  > updated ${path.slice(syncDir.length)}`)
  })

  console.log(`  ...done.`)
  console.log(``)

}

module.exports = goSyncVersions