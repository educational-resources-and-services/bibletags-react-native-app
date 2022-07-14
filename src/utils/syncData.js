import { getVersionInfo, sentry } from "./toolbox"
import updateLanguages from "./updateLanguages"
import updateLanguageSpecificDefinitions from "./updateLanguageSpecificDefinitions"
import updateTranslationBreakdowns from "./updateTranslationBreakdowns"
import updateTagSets from "./updateTagSets"
import submitQueuedWordHashesSets from "./submitQueuedWordHashesSets"
import submitQueuedTagSets from "./submitQueuedTagSets"

const languageIdsSyncedDuringThisOpen = []
const versionIdsSyncedDuringThisOpen = []

const syncData = async ({ versionIds, setDataSyncStatus }) => {

  setDataSyncStatus('definitions')

  // update languages
  const languageIds = [ ...new Set( versionIds.map(versionId => getVersionInfo(versionId).languageId) ) ]
  const languageIdsNeedingUpdate = (
    languageIds.filter(languageId => (
      !languageIdsSyncedDuringThisOpen.includes(languageId)
      && languageId !== 'heb+grc'
    ))
  )
  if(languageIdsNeedingUpdate.length > 0) {
    await updateLanguages({ languageIdsNeedingUpdate })
    for(let languageId of languageIdsNeedingUpdate) {
      try {
        await updateLanguageSpecificDefinitions({ languageId })
        languageIdsSyncedDuringThisOpen.push(languageId)
      } catch(error) {
        sentry({ error })
      }
    }
  }

  setDataSyncStatus('tags')

  // update versions
  for(let versionId of versionIds) {
    if(versionIdsSyncedDuringThisOpen.includes(versionId)) continue
    if(versionId === 'original') continue
    try {
      await updateTranslationBreakdowns({ versionId })
      await updateTagSets({ versionId })
      versionIdsSyncedDuringThisOpen.push(versionId)
    } catch(error) {
      sentry({ error })
    }
  }

  setDataSyncStatus('submissions')

  await submitQueuedWordHashesSets()
  await submitQueuedTagSets()

  setDataSyncStatus('done')

}

export const removeVersionIdSyncedDuringThisOpen = versionId => {
  versionIdsSyncedDuringThisOpen.splice(versionIdsSyncedDuringThisOpen.indexOf(versionId), 1)
}

export default syncData