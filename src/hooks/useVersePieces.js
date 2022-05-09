import { useState } from "react"
import Constants from "expo-constants"
import { getLocFromRef } from "@bibletags/bibletags-versification"
import { getPiecesFromUSFM } from "@bibletags/bibletags-ui-helper"

import useEffectAsync from "./useEffectAsync"
import { executeSql, getVersionInfo } from "../utils/toolbox"

const {
  HEBREW_CANTILLATION_MODE,
} = Constants.manifest.extra

const useVersePieces = ({
  versionId,
  refs,
}) => {

  const [ piecesInfo, setPiecesInfo ] = useState({ pieces: [] })

  useEffectAsync(
    async () => {
      const { rows: { _array: [ verse ] } } = await executeSql({
        versionId,
        bookId: refs[0].bookId,
        statement: ({ bookId, limit }) => `SELECT * FROM ${versionId}VersesBook${bookId} WHERE loc IN ? ORDER BY loc LIMIT ${limit}`,
        args: [
          refs.map(ref => getLocFromRef(ref)),
        ],
        limit: 1,
        removeCantillation: HEBREW_CANTILLATION_MODE === 'remove',
      })

      if(!verse) {
        setPiecesInfo({ pieces: [] })
        return
      }

      const { wordDividerRegex } = getVersionInfo(versionId)

      const preppedUsfm = verse.usfm
        .replace(/\\m(?:t[0-9]?|te[0-9]?|s[0-9]?|r) .*\n?/g, '')  // get rid of book headings
        .replace(/\\c ([0-9]+)\n?/g, '')  // get rid of chapter marker, since it is put in below

      setPiecesInfo({
        pieces: getPiecesFromUSFM({
          usfm: `\\c ${refs[0].chapter}\n${preppedUsfm}`,
          inlineMarkersOnly: true,
          wordDividerRegex,
        }),
        piecesVersionId: versionId,
      })
    
    },
    [ versionId, refs ],
  )

  return piecesInfo
}

export default useVersePieces