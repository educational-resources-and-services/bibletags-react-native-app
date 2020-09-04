import React from "react"
import { StyleSheet } from "react-native"

import Parsing from "./Parsing"
import Definition from "./Definition"

const styles = StyleSheet.create({
})

const LowerPanelWord = ({
  selectedWordInfo,
}) => {

  return (
    <>
      <Parsing
        selectedWordInfo={selectedWordInfo}
      />
      <Definition
        selectedWordInfo={selectedWordInfo}
      />
    </>
  )

}

export default LowerPanelWord