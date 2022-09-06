const goSyncVersions = require('./goSyncVersions')

;(async () => {

  const params = process.argv.slice(2)
  const [
    stage="production",
    tenantDir=".",
  ] = params

  await goSyncVersions({ stage, tenantDir })
  process.exit()

})()