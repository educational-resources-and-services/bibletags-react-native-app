import { useCallback, useState } from "react"
import { getLocFromRef, getRefFromLoc } from "@bibletags/bibletags-versification"

import { safelyExecuteSelects } from "../utils/toolbox"
import useRouterState from "./useRouterState"
import useBibleVersions from "./useBibleVersions"
import useEffectAsync from "./useEffectAsync"

let currentVersionId
let currentStatusIdx = 0
let currentBookId = 0
let currentLocsToTag = []

const statusesToDo = [ 'none', 'automatch' ]

export const indicatedVersesTagged = ({ versionId, loc, locs, ref }) => {
  if(versionId === currentVersionId) {
    locs = locs || (loc ? [ loc ] : [ getLocFromRef(ref) ])
    if(locs.length > 0) {
      currentLocsToTag = currentLocsToTag.filter(locToTag => !locs.includes(locToTag))
    }
  }
}

const useTagAnotherVerse = ({ myBibleVersions, currentPassage, doPush }) => {

  const { historyPush, historyReplace } = useRouterState()
  const { downloadedVersionIds } = useBibleVersions({ myBibleVersions })
  const [ somethingToTag, setSomethingToTag ] = useState(false)

  const getPassageToTag = useCallback(
    async passageToFirstRemove => {

      if(passageToFirstRemove) {
        indicatedVersesTagged(passageToFirstRemove)
      }

      const getPassage = () => {
        setSomethingToTag(true)
        return {
          versionId: currentVersionId,
          ref: getRefFromLoc(currentLocsToTag[0]),
        }
      }

      if(currentLocsToTag.length > 0) return getPassage()

      for(currentStatusIdx; currentStatusIdx < statusesToDo.length; currentStatusIdx++) {

        const status = statusesToDo[currentStatusIdx]

        const getCurrentLocsToTag = async () => {

          // this first query set speeds things up

          const [ [{ tagSetsCount }], [{ versesCount }]=[{}] ] = await safelyExecuteSelects([
            {
              database: `versions/${currentVersionId}/tagSets`,
              statement: () => (
                status === 'none'
                  ? `SELECT COUNT(*) AS tagSetsCount FROM tagSets WHERE id LIKE ? AND status!=?`
                  : `SELECT COUNT(*) AS tagSetsCount FROM tagSets WHERE id LIKE ? AND status=?`
              ),
              args: [
                `${`0${currentBookId}`.slice(-2)}%`,
                status,
              ],
            },
            ...(status !== 'none' ? [] : [{
              versionId: currentVersionId,
              bookId: currentBookId,
              statement: () => `SELECT COUNT(*) AS versesCount FROM ${currentVersionId}VersesBook${currentBookId} ORDER BY loc`,
            }]),
          ])

          if(status === 'none' && tagSetsCount >= versesCount) return
          if(status !== 'none' && tagSetsCount === 0) return

          const [ verses, tagSets ] = await safelyExecuteSelects([
            {
              versionId: currentVersionId,
              bookId: currentBookId,
              statement: () => `SELECT loc FROM ${currentVersionId}VersesBook${currentBookId} ORDER BY loc`,
            },
            {
              database: `versions/${currentVersionId}/tagSets`,
              statement: () => (
                status === 'none'
                  ? `SELECT id FROM tagSets WHERE id LIKE ? AND status!=?`
                  : `SELECT id FROM tagSets WHERE id LIKE ? AND status=?`
              ),
              args: [
                `${`0${currentBookId}`.slice(-2)}%`,
                status,
              ],
            },
          ])

          const tagSetLocsObj = {}
          tagSets.forEach(({ id }) => {
            tagSetLocsObj[id.split('-')[0]] = true
          })

          currentLocsToTag = (
            verses
              .filter(({ loc }) => (
                (status === 'none') === !tagSetLocsObj[loc]
              ))
              .map(({ loc }) => loc)
          )

        }

        const currentVersionIdIdx = Math.max(downloadedVersionIds.indexOf(currentVersionId), 0)
        for(let versionIdsIdx=currentVersionIdIdx; versionIdsIdx<downloadedVersionIds.length; versionIdsIdx++) {
          currentVersionId = downloadedVersionIds[versionIdsIdx]
          if(currentVersionId === 'original') continue
          while(++currentBookId <= 66) {
            await getCurrentLocsToTag()
            if(currentLocsToTag.length > 0) {
              return getPassage()
            }
          }
          currentBookId = 0
        }
        currentVersionId = downloadedVersionIds[0]


      }

      setSomethingToTag(false)

    },
    [ downloadedVersionIds ],
  )

  useEffectAsync(getPassageToTag, [])

  const tagAnotherVerse = useCallback(
    async () => {
      ;(doPush ? historyPush : historyReplace)("/Read/VerseTagger", {
        passage: await getPassageToTag(currentPassage),
      })
    },
    [ historyPush, historyReplace, currentPassage ],
  )

  return {
    tagAnotherVerse: somethingToTag ? tagAnotherVerse : null,
  }

}

export default useTagAnotherVerse
