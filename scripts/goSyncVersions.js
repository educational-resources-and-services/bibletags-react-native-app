require('dotenv').config()

const { S3Client } = require('@aws-sdk/client-s3')
const S3SyncClient = require('s3-sync-client')

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

  uploads.forEach(({ path }) => {
    console.log(`  > updated ${path.slice(syncDir.length)}`)
  })

  console.log(`  ...done.`)
  console.log(``)

}

module.exports = goSyncVersions