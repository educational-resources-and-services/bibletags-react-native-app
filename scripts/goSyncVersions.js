const { S3Client } = require('@aws-sdk/client-s3')
const S3SyncClient = require('s3-sync-client')
const Database = require('better-sqlite3')
const { i18n, i18nNumber } = require("inline-i18n")
const { getWordsHash, getWordHashes, passOverI18n, passOverI18nNumber } = require("@bibletags/bibletags-ui-helper")
const { request, gql } = require('graphql-request')
const { exec } = require('child_process')
const fs = require('fs-extra')
const Spinnies = require('spinnies')
const spinnies = new Spinnies()
require('colors')

const serverVersionInfoKeys = require('./utils/serverVersionInfoKeys')
const { getVersionInfo } = require('./utils/fileTools')

passOverI18n(i18n)
passOverI18nNumber(i18nNumber)

const goSyncVersions = async ({ stage, tenantDir, skipSubmitWordHashes, versionIdsToForceSubmitWordHashes=[], silent }) => {

  require('dotenv').config()

  const s3Dir = `s3://cdn.bibletags.org/tenants/${process.env.EMBEDDING_APP_ID}/${stage}/versions`
  let syncDir = `${tenantDir}/versions`.replace(/^\.\//, '')

  console.log(``)
  spinnies.add('syncing', { text: `Syncing ${syncDir} to ${s3Dir}`+` This takes several minutes`.gray })

  const consoleError = console.error
  console.error = ()=>{}  // attempts to silence AWS errors
  let uploads
  for(let idx=0; idx<20; idx++) {
    try {
      const s3Client = new S3Client({
        region: process.env.AWS_REGION || `us-east-1`,
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      })
      const { sync } = new S3SyncClient({ client: s3Client })
      uploads = (await sync(syncDir, s3Dir)).uploads
    } catch(e) {}
    if(uploads) break
    await new Promise(r => setTimeout(r, 2000))
  }
  console.error = consoleError

  if(!uploads) {
    spinnies.fail('syncing', { text: `Sync failed` })
    throw new Error(`Could not sync versions to the cloud.`)
  }
  spinnies.succeed('syncing')

  if(!silent) {
    uploads.forEach(({ path }) => {
      console.log(`  > updated ${path.slice(syncDir.length)}`)
    })
    console.log(``)
  }

  const graphqlUrl = (
    process.env.BIBLETAGS_DATA_GRAPHQL_URI
    || (
      stage === 'dev'
        ? "http://localhost:8082/graphql"
        : "https://data.bibletags.org/graphql"
    )
  )

  const forbidSubmitWordHashes = stage !== 'production' && /^https:\/\/data\.bibletags\.org\/graphql"/.test(graphqlUrl)

  if(!skipSubmitWordHashes && !forbidSubmitWordHashes) {

    const wordHashesToSubmitByVersionId = {}
    for(let upload of uploads) {
      const idPieces = upload.id.split('/')
      const versionId = idPieces[4]
      const bookId = parseInt((idPieces[6] || ``).split('.')[0], 10)

      if(!bookId) continue

      wordHashesToSubmitByVersionId[versionId] = wordHashesToSubmitByVersionId[versionId] || []
      if(!wordHashesToSubmitByVersionId[versionId].includes(bookId)) {
        wordHashesToSubmitByVersionId[versionId].push(bookId)
      }
    }

    if(stage === `production`) {
      const allNonOriginalVersionIdsForThisApp = Object.keys(getVersionInfo({ tenantDir })).filter(id => id !== `original`)
      if(allNonOriginalVersionIdsForThisApp.length > 0) {
        const { versionIdsWithIncompleteTagSets } = await request(
          graphqlUrl,
          gql`
            query {
              versionIdsWithIncompleteTagSets(
                versionIds: ${JSON.stringify(allNonOriginalVersionIdsForThisApp)}
              )
            }
          `,
        )
        versionIdsToForceSubmitWordHashes.push(...versionIdsWithIncompleteTagSets)
      }
    }

    for(let versionId of versionIdsToForceSubmitWordHashes) {
      const { partialScope } = getVersionInfo({ tenantDir, versionId }) || {}
      wordHashesToSubmitByVersionId[versionId] = [...new Set([
        ...(wordHashesToSubmitByVersionId[versionId] || []),
        ...Array({ ot: 39, nt: 27 }[partialScope] || 66).fill().map((x, idx) => idx + (partialScope === `nt` ? 40 : 1)),
      ])]
    }

    delete wordHashesToSubmitByVersionId.original

    if(stage === 'dev') {
      console.log(``)
      console.log(`  ** Starting \`bibletags-data\` to be able to submit word hashes locally...`)
      await new Promise(resolve => exec(`kill -9 $(lsof -i:8082 -t) 2> /dev/null`, resolve))  // make sure it isn't already running
      exec(`cd ../bibletags-data && npm start`)
      await new Promise(resolve => setTimeout(resolve, 5000))  // wait a few more seconds for the graphql server to start
    }

    const submitWordHashSetsFailingVersionIds = []

    for(let versionId in wordHashesToSubmitByVersionId) {

      if(stage === 'dev') {
        console.log(`  > run addVersion(${versionId}) to ${graphqlUrl}`)
        const versionInfo = getVersionInfo({ tenantDir, versionId })
        if(versionInfo) {
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
        }
      }

      process.stdout.write(`  - submit word hash sets for ${versionId}. Book ids: `)

      wordHashesToSubmitByVersionId[versionId].sort((a,b) => a-b)

      for(let bookId of wordHashesToSubmitByVersionId[versionId]) {

        if(bookId) {
          process.stdout.write(`${bookId} `)

          const db = new Database(`${syncDir}/${versionId}/verses/${bookId}.db`)
          const tableName = `${versionId}VersesBook${bookId}`

          const verses = db.prepare(`SELECT * FROM ${tableName}`).all()

          const input = verses.map(verse => {

            const { loc, usfm } = verse
            const params = {
              usfm,
            }

            const wordsHash = getWordsHash(params)
            const wordHashes = JSON.stringify(getWordHashes(params)).replace(/([{,])"([^"]+)"/g, '$1$2')

            return `{ loc: "${loc}", versionId: "${versionId}", wordsHash: "${wordsHash}", embeddingAppId: "${process.env.EMBEDDING_APP_ID}", wordHashes: ${wordHashes}}`

          })

          const inputInBlocks = [ input.slice(0, 100) ]
          for(let i=100; i<input.length; i+=100) {
            inputInBlocks.push(input.slice(i, i+100))
          }

          await Promise.all(inputInBlocks.map(async inputBlock => {

            const composedQuery = gql`
              mutation {
                submitWordHashesSets(input: [${inputBlock.join(',')}])
              }
            `

            try {
              await request(graphqlUrl, composedQuery)
            } catch(err) {
              await new Promise(resolve => setTimeout(resolve, 1000))  // give it a second
              try {
                await request(graphqlUrl, composedQuery)  // and try again
              } catch(err) {
                if(!submitWordHashSetsFailingVersionIds.includes(versionId)) {
                  submitWordHashSetsFailingVersionIds.push(versionId)
                  console.log(``)
                  console.log(`    *** FAILED ***`)
                }
              }
            }

          }))

        }

        if(submitWordHashSetsFailingVersionIds.includes(versionId)) break

      }

      console.log(``)

    }

    if(submitWordHashSetsFailingVersionIds.length > 0) {
      console.log(``)
      console.log(`!! THE FOLLOWING VERSION IDS FAILED TO SUBMIT WORD HASH SETS !!`)
      console.log(``)
      console.log(submitWordHashSetsFailingVersionIds.map(versionId => `  - ${versionId}`).join('\n'))
      console.log(``)
      console.log(`** Check Cloud Watch logs for why **`)
      console.log(``)
    }

    if(stage === 'dev') {
      await new Promise(resolve => exec(`kill -9 $(lsof -i:8082 -t) 2> /dev/null`, resolve))  // kills the npm start on /bibletags-data
    }

  }

  if(!silent) {
    console.log(``)
    console.log(`  ...done with sync.`)
    console.log(``)
  }

}

module.exports = goSyncVersions