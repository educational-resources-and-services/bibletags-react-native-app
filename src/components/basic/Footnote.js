import React, { useMemo } from "react"
import { StyleSheet, View } from "react-native"
import { getPiecesFromUSFM } from "bibletags-ui-helper/src/splitting"

import { getVersionInfo } from '../../utils/toolbox'

import Verse from './Verse'

const styles = StyleSheet.create({
  container: {
    paddingVertical: 15,
    paddingHorizontal: 18,
  },
})

const Footnote = ({
  selectedVersionId,
  selectedInfo,
  fkInsert,
  selectedAttr,
  onFootnoteTap,
}) => {

  const { content } = selectedInfo || {}

  const { wordDividerRegex } = getVersionInfo(selectedVersionId)

  const pieces = useMemo(
    () => getPiecesFromUSFM({
      usfm: `\\c 1\n${content.replace(/^. /, fkInsert ? `\\fk ${fkInsert} \\ft ` : '')}`,
      inlineMarkersOnly: true,  // this should become false to allow for \fp
      wordDividerRegex,
    }),
    [ content, selectedVersionId ],
  )

  if(!content) return null

  // TEMP - I need a solution for original language notes to be translatable
  pieces.forEach(piece => {
    if(piece.content === 'Q ') {
      piece.content = 'Qere '
    }
    if(piece.content === 'K ') {
      piece.content = 'Ketiv '
    }
  })

  return (
    <View style={styles.container}>
      <Verse
        pieces={pieces}
        selectedAttr={selectedAttr}
        passageRef={{  // TODO: This will need to be correct to make the lower panel tappable.
          bookId: 1,
        }}
        versionId='kjv'  // TODO: This should be the selectedVersionId unless isOriginal. In that case, it should be a version in the language of the app.
        // style={}
        onVerseTap={onFootnoteTap}
      />
    </View>
  )

}

export default Footnote