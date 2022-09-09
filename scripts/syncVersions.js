require('dotenv').config()

const fs = require('fs-extra')

const goSyncVersions = require('./goSyncVersions')

;(async () => {

  const params = process.argv.slice(2)
  let [
    stage,
    ...versionIdsToForceSubmitWordHashes
  ] = params

  if(![ "dev", "beta", "production" ].includes(stage)) throw `Invalid stage: ${stage}. Must be dev, beta, or production.`

  let tenantDir = `tenants/${process.env.APP_SLUG}`

  if(!(await fs.pathExists(tenantDir))) {
    tenantDir = `.`
  }

  await goSyncVersions({ stage, tenantDir, versionIdsToForceSubmitWordHashes })
  process.exit()

})()