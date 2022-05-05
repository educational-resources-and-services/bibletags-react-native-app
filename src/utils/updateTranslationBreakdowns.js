import { executeSql, doGraphql, setAsyncStorage, getAsyncStorage } from "./toolbox"

const updateTranslationBreakdowns = async ({ versionId }) => {

  console.log(`Update translation breakdowns (${versionId})...`)

  const tableName = `translationBreakdowns`
  const database = `versions/${versionId}/${tableName}`
  let numUpdates = 0

  const attrs = {
    id: "TEXT PRIMARY KEY",
    breakdown: "TEXT",
  }
  const keys = Object.keys(attrs)

  await executeSql({
    database,
    statement: () => `
      CREATE TABLE IF NOT EXISTS ${tableName} (
        ${keys.map(key => `${key} ${attrs[key]}`).join(', ')}
      )
    `,
  })

  const fetchGroup = async () => {

    const updatedFromKey = `${database}-updatedFrom`
    const updatedFrom = await getAsyncStorage(updatedFromKey, 0)
    console.log(`Get translation breakdowns for ${versionId} from ms timestamp of ${updatedFrom}...`)

    const { updatedTranslationBreakdowns: { translationBreakdowns, hasMore, newUpdatedFrom } } = await doGraphql({
      query: `
        updatedTranslationBreakdowns() {
          translationBreakdowns {
            ${keys.join('\n')}
          }
          hasMore
          newUpdatedFrom
        }
      `,
      params: {
        versionId,
        updatedFrom,
      },
    })

    if(
      newUpdatedFrom <= updatedFrom
      || (
        hasMore
        && translationBreakdowns.length === 0
      )
    ) throw new Error(`Bad response to updatedTranslationBreakdowns`)

    await executeSql({
      database,
      statements: translationBreakdowns.map(translationBreakdown => ({
        statement: () => `REPLACE INTO ${tableName} (${keys.join(', ')}) VALUES ?`,
        args: [
          keys.map(key => (
            [ 'breakdown' ].includes(key)
              ? JSON.stringify(translationBreakdown[key])
              : translationBreakdown[key]
          ))
        ],
      })),
    })

    await setAsyncStorage(updatedFromKey, newUpdatedFrom)
    numUpdates += translationBreakdowns.length

    if(hasMore) {
      await fetchGroup()
    }

  }

  await fetchGroup()

  console.log(`${numUpdates} translation breakdowns updated for ${versionId}.`)

}

export default updateTranslationBreakdowns