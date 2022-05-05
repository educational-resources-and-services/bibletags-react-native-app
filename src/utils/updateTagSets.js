import { executeSql, doGraphql, setAsyncStorage, getAsyncStorage } from "./toolbox"

const updateTagSets = async ({ versionId }) => {

  console.log(`Update tag sets (${versionId})...`)

  const tableName = `tagSets`
  const database = `versions/${versionId}/${tableName}`
  let numUpdates = 0

  const attrs = {
    id: "TEXT PRIMARY KEY",
    tags: "TEXT",
    status: "TEXT",
  }
  const keys = Object.keys(attrs)

  await executeSql({
    database,
    statement: () => `
      CREATE TABLE IF NOT EXISTS ${tableName} (
        ${keys.map(key => `${key} ${attrs[key]}`).join(', ')}
      );
      CREATE INDEX IF NOT EXISTS status_idx ON ${tableName} (status)
    `,
  })

  const fetchGroup = async () => {

    const updatedFromKey = `${database}-updatedFrom`
    const updatedFrom = await getAsyncStorage(updatedFromKey, 0)
    console.log(`Get tag sets for ${versionId} from ms timestamp of ${updatedFrom}...`)

    const { updatedTagSets: { tagSets, hasMore, newUpdatedFrom } } = await doGraphql({
      query: `
        updatedTagSets() {
          tagSets {
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
        && tagSets.length === 0
      )
    ) throw new Error(`Bad response to updatedTagSets`)

    await executeSql({
      database,
      statements: tagSets.map(tagSet => ({
        statement: () => `REPLACE INTO ${tableName} (${keys.join(', ')}) VALUES ?`,
        args: [
          keys.map(key => (
            [ 'tags' ].includes(key)
              ? JSON.stringify(tagSet[key])
              : tagSet[key]
          ))
        ],
      })),
    })

    await setAsyncStorage(updatedFromKey, newUpdatedFrom)
    numUpdates += tagSets.length

    if(hasMore) {
      await fetchGroup()
    }

  }

  await fetchGroup()

  console.log(`${numUpdates} tag sets updated for ${versionId}.`)

}

export default updateTagSets