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

      setPiecesInfo({ pieces: [] })

      if(!refs || (refs[0] || {}).verse === undefined) return

      const { rows: { _array: verses } } = await executeSql({
        versionId,
        bookId: refs[0].bookId,
        statement: ({ bookId }) => `SELECT * FROM ${versionId}VersesBook${bookId} WHERE loc IN ? ORDER BY loc`,
        args: [
          refs.map(ref => getLocFromRef(ref).split(':')[0]),
        ],
        removeCantillation: HEBREW_CANTILLATION_MODE === 'remove',
      })

      if(!verses[0]) return

      const { wordDividerRegex } = getVersionInfo(versionId)

      setPiecesInfo({
        pieces: getPiecesFromUSFM({
          usfm: `\\c ${refs[0].chapter}\n${verses.map(({ usfm }) => usfm).join("\n")}`,
          inlineMarkersOnly: true,
          wordDividerRegex,
        }),
        piecesVersionId: versionId,
      })

      // TODO: I might only want some of the words in the returned verses

    },
    [ versionId, refs ],
  )

  return piecesInfo
}

export default useVersePieces