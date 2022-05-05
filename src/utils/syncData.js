import { getVersionInfo, sentry } from "./toolbox"
import updateLanguages from "./updateLanguages"
import updateLanguageSpecificDefinitions from "./updateLanguageSpecificDefinitions"
import updateTranslationBreakdowns from "./updateTranslationBreakdowns"
import updateTagSets from "./updateTagSets"
import submitQueuedTagSets from "./submitQueuedTagSets"

const languageIdsSyncedDuringThisOpen = []
const versionIdsSyncedDuringThisOpen = []

const syncData = async ({ versionIds, setDataSyncStatus }) => {

  // update languages
  const languageIds = [ ...new Set( versionIds.map(versionId => getVersionInfo(versionId).languageId) ) ]
  const languageIdsNeedingUpdate = (
    languageIds.filter(languageId => (
      !languageIdsSyncedDuringThisOpen.includes(languageId)
      && languageId !== 'heb+grk'
    ))
  )
  if(languageIdsNeedingUpdate.length > 0) {
    await updateLanguages({ languageIdsNeedingUpdate })
    for(let languageId of languageIdsNeedingUpdate) {
      try {
        await updateLanguageSpecificDefinitions({ languageId })
        languageIdsSyncedDuringThisOpen.push(languageId)
      } catch(error) {
        sentry(({ error }))
      }
    }
  }

  // update versions
  for(let versionId of versionIds) {
    if(versionIdsSyncedDuringThisOpen.includes(versionId)) continue
    if(versionId === 'original') continue
    try {
      await updateTranslationBreakdowns({ versionId })
      await updateTagSets({ versionId })
      versionIdsSyncedDuringThisOpen.push(versionId)
    } catch(error) {
      sentry(({ error }))
    }
  }

  // do queue
  submitQueuedTagSets()

}

export default syncData