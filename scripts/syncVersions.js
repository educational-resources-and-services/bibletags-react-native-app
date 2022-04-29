require('dotenv').config()

const { S3Client } = require('@aws-sdk/client-s3')
const S3SyncClient = require('s3-sync-client')

const s3Client = new S3Client({
  region: process.env.AWS_REGION || `us-east-1`,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
})
const { sync } = new S3SyncClient({ client: s3Client })

;(async () => {

  const params = process.argv.slice(2)
  const [ stage="production" ] = params

  const s3Dir = `s3://cdn.bibletags.org/assets/${process.env.EMBEDDING_APP_ID}/${stage}`

  console.log(`Sync assets to ${s3Dir}...`)

  await sync(`assets`, s3Dir)

  console.log(`  ...done.`)

  process.exit()

})()