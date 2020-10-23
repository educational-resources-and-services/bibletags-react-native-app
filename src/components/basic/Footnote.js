import React from "react"
import { StyleSheet, View } from "react-native"

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
  pieces,
  selectedAttr,
  onFootnoteTap,
}) => {

  const { content } = selectedInfo || {}

  if(!content) return null

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