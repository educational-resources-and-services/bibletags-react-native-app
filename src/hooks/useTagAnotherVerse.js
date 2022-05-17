import { useCallback } from "react"
import { getLocFromRef, getRefFromLoc } from "@bibletags/bibletags-versification"

import { safelyExecuteSelects } from "../utils/toolbox"
import useRouterState from "./useRouterState"
import useBibleVersions from "./useBibleVersions"
import useEffectAsync from "./useEffectAsync"

let currentVersionId
let currentStatusIdx = 0
let currentBookId = 1
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
  const { versionIds } = useBibleVersions({ myBibleVersions })

  const getPassageToTag = useCallback(
    async passageToFirstRemove => {

      if(passageToFirstRemove) {
        indicatedVersesTagged(passageToFirstRemove)
      }

      const getPassage = () => ({
        versionId: currentVersionId,
        ref: getRefFromLoc(currentLocsToTag[0]),
      })

      if(currentLocsToTag.length > 0) return getPassage()

      for(currentStatusIdx; currentStatusIdx < statusesToDo.length; currentStatusIdx++) {

        const status = statusesToDo[currentStatusIdx]

        const getCurrentLocsToTag = async () => {

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

        const currentVersionIdIdx = Math.max(versionIds.indexOf(currentVersionId), 0)
        for(let versionIdsIdx=currentVersionIdIdx; versionIdsIdx<versionIds.length; versionIdsIdx++) {
          currentVersionId = versionIds[versionIdsIdx]
          for(currentBookId; currentBookId<=66; currentBookId++) {
            await getCurrentLocsToTag()
            if(currentLocsToTag.length > 0) {
              return getPassage()
            }
          }
          currentBookId = 1
        }

      }

    },
    [],
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
    tagAnotherVerse,
  }

}

export default useTagAnotherVerse
