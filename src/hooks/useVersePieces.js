import { useState } from "react"
import { getLocFromRef } from "@bibletags/bibletags-versification"
import { getPiecesFromUSFM } from "@bibletags/bibletags-ui-helper"

import useEffectAsync from "./useEffectAsync"
import { executeSql, getVersionInfo } from "../utils/toolbox"
import useInstanceValue from "./useInstanceValue"

const noPieces = { pieces: [] }

const useVersePieces = ({
  versionId,
  refs,
  skip,
}) => {

  const [ piecesInfo, setPiecesInfo ] = useState(noPieces)
  const getVersionId = useInstanceValue(versionId)
  const getRefs = useInstanceValue(refs)
  const getSkip = useInstanceValue(skip)

  useEffectAsync(
    async () => {

      setPiecesInfo(noPieces)

      if(skip || !refs || (refs[0] || {}).verse === undefined) return

      const { rows: { _array: verses } } = await executeSql({
        versionId,
        bookId: refs[0].bookId,
        statement: ({ bookId }) => `SELECT * FROM ${versionId}VersesBook${bookId} WHERE loc IN ? ORDER BY loc`,
        args: [
          refs.map(ref => getLocFromRef(ref).split(':')[0]),
        ],
      })

      if(!verses[0]) return
      if(getVersionId() !== versionId) return
      if(getRefs() !== refs) return
      if(getSkip() !== skip) return

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
    [ versionId, refs, skip ],
  )

  return piecesInfo
}

export default useVersePieces