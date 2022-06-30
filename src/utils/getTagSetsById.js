import { safelyExecuteSelects } from "./toolbox"

const getTagSetsByIds = async ids => {

  const idsByVersionId = {}
  ids.forEach(id => {
    const [ loc, versionId ] = id.split('-')
    idsByVersionId[versionId] = idsByVersionId[versionId] || []
    idsByVersionId[versionId].push(id)
  })
  const tagSetsResults = await safelyExecuteSelects(
    Object.keys(idsByVersionId).map(versionId => ({
      database: `versions/${versionId}/tagSets`,
      statement: () => `SELECT * FROM tagSets WHERE id IN ?`,
      args: [
        idsByVersionId[versionId],
      ],
      jsonKeys: [ 'tags' ],
    }))
  )

  return tagSetsResults.flat()

}

export default getTagSetsByIds