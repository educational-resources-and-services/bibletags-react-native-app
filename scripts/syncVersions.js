const goSyncVersions = require('./goSyncVersions')

;(async () => {

  const params = process.argv.slice(2)
  const [ stage="production" ] = params

  await goSyncVersions({ stage })
  process.exit()

})()