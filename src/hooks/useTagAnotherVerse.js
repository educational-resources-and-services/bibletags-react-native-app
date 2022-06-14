import { useCallback, useState } from "react"
import { getLocFromRef, getRefFromLoc } from "@bibletags/bibletags-versification"

import { cloneObj, safelyExecuteSelects } from "../utils/toolbox"
import useRouterState from "./useRouterState"
import useBibleVersions from "./useBibleVersions"
import useEffectAsync from "./useEffectAsync"

const currentVersionIdByTestament = {}
const startBookIdByTestament = { ot: 1, nt: 40 }
const endBookIdByTestament = { ot: 39, nt: 66 }
const currentBookIdByTestament = cloneObj(startBookIdByTestament)
const currentLocsToTagByTestament = { ot: [], nt: [] }

// TODO: Improve this by:
  // get all tags for a version (do their versions in order)
  // test by wordsHash in addition to loc and versionId
  // remove unconfirmed/confirmed tags when updated from sync
  // tag another verse should bring them to the first tag after currentPassage
  // tag Hebrew/Greek from drawer should have its own bookmark
  // (make sure skipping still works)
  // think about queuing up unconfirmed tags after no automatch/none left
  // (make sure words with adding/removing versions)

export const indicatedVersesTagged = ({ versionId, loc, locs, ref }) => {
  if(Object.values(currentVersionIdByTestament).includes(versionId)) {
    locs = locs || (loc ? [ loc ] : [ getLocFromRef(ref) ])
    if(locs.length > 0) {
      currentLocsToTagByTestament.ot = currentLocsToTagByTestament.ot.filter(locToTag => !locs.includes(locToTag))
      currentLocsToTagByTestament.nt = currentLocsToTagByTestament.nt.filter(locToTag => !locs.includes(locToTag))
    }
  }
}

const useTagAnotherVerse = ({ myBibleVersions, currentPassage, testament, doPush }) => {

  const { historyPush, historyReplace } = useRouterState()
  const { downloadedVersionIds, versionIds } = useBibleVersions({ myBibleVersions })
  const [ somethingToTag, setSomethingToTag ] = useState()

  testament = testament || (currentPassage.ref.bookId <= 39 ? `ot` : `nt`)

  const getPassageToTag = useCallback(
    async passageToFirstRemove => {

      if(passageToFirstRemove) {
        indicatedVersesTagged(passageToFirstRemove)
      }

      const getPassage = () => {
        setSomethingToTag(true)
        return {
          versionId: currentVersionIdByTestament[testament],
          ref: getRefFromLoc(currentLocsToTagByTestament[testament][0]),
        }
      }

      if(currentLocsToTagByTestament[testament].length > 0) return getPassage()

      const getCurrentLocsToTag = async () => {

        // this first query set speeds things up

        const [ [{ tagSetsCount }], [{ versesCount }]=[{}] ] = await safelyExecuteSelects([
          {
            database: `versions/${currentVersionIdByTestament[testament]}/tagSets`,
            statement: () => `SELECT COUNT(*) AS tagSetsCount FROM tagSets WHERE id LIKE ? AND status NOT IN ('none', 'automatch')`,
            args: [
              `${`0${currentBookIdByTestament[testament]}`.slice(-2)}%`,
            ],
          },
          {
            versionId: currentVersionIdByTestament[testament],
            bookId: currentBookIdByTestament[testament],
            statement: () => `SELECT COUNT(*) AS versesCount FROM ${currentVersionIdByTestament[testament]}VersesBook${currentBookIdByTestament[testament]} ORDER BY loc`,
          },
        ])

        if(tagSetsCount >= versesCount) return

        const [ tagSets, verses ] = await safelyExecuteSelects([
          {
            database: `versions/${currentVersionIdByTestament[testament]}/tagSets`,
            statement: () => `SELECT id FROM tagSets WHERE id LIKE ? AND status NOT IN ('none', 'automatch')`,
            args: [
              `${`0${currentBookIdByTestament[testament]}`.slice(-2)}%`,
            ],
          },
          {
            versionId: currentVersionIdByTestament[testament],
            bookId: currentBookIdByTestament[testament],
            statement: () => `SELECT loc FROM ${currentVersionIdByTestament[testament]}VersesBook${currentBookIdByTestament[testament]} ORDER BY loc`,
          },
        ])

        const tagSetLocsObj = {}
        tagSets.forEach(({ id }) => {
          tagSetLocsObj[id.split('-')[0]] = true
        })

        currentLocsToTagByTestament[testament] = (
          verses
            .filter(({ loc }) => !tagSetLocsObj[loc])
            .map(({ loc }) => loc)
        )

      }

      const currentVersionIdIdx = Math.max(downloadedVersionIds.indexOf(currentVersionIdByTestament[testament]), 0)
      for(let versionIdsIdx=currentVersionIdIdx; versionIdsIdx<downloadedVersionIds.length; versionIdsIdx++) {
        currentVersionIdByTestament[testament] = downloadedVersionIds[versionIdsIdx]
        if(currentVersionIdByTestament[testament] === 'original') continue
        while(currentBookIdByTestament[testament] <= endBookIdByTestament[testament]) {
          await getCurrentLocsToTag()
          currentBookIdByTestament[testament]++
          if(currentLocsToTagByTestament[testament].length > 0) {
            return getPassage()
          }
        }
        currentBookIdByTestament[testament] = startBookIdByTestament[testament]
      }
      currentVersionIdByTestament[testament] = downloadedVersionIds[0]

      setSomethingToTag(versionIds.length > downloadedVersionIds.length ? undefined : false)

    },
    [ downloadedVersionIds, versionIds, testament ],
  )

  useEffectAsync(getPassageToTag, [ downloadedVersionIds, testament ])

  const tagAnotherVerse = useCallback(
    async () => {
      ;(doPush ? historyPush : historyReplace)("/Read/VerseTagger", {
        passage: await getPassageToTag(currentPassage),
      })
    },
    [ historyPush, historyReplace, currentPassage, getPassageToTag ],
  )

  return {
    tagAnotherVerse: somethingToTag ? tagAnotherVerse : somethingToTag,
  }

}

export default useTagAnotherVerse
