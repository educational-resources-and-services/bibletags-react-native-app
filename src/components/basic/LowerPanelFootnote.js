import React from "react"
import { StyleSheet } from "react-native"

import Footnote from "./Footnote"
import IPhoneXBuffer from "./IPhoneXBuffer"

const styles = StyleSheet.create({
})

const LowerPanelFootnote = ({
  selectedVersionId,
  selectedInfo,
}) => {

  return (
    <>
      <Footnote
        selectedVersionId={selectedVersionId}
        selectedInfo={selectedInfo}
      />
      {/* <Verse
      /> */}
      <IPhoneXBuffer extraSpace={true} />
    </>
  )

}

export default LowerPanelFootnote