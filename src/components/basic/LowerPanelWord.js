import React from "react"
import { StyleSheet } from "react-native"

import Parsing from "./Parsing"
import Definition from "./Definition"

const styles = StyleSheet.create({
})

const LowerPanelWord = ({
  selectedInfo,
}) => {

  return (
    <>
      <Parsing
        selectedInfo={selectedInfo}
      />
      <Definition
        selectedInfo={selectedInfo}
      />
    </>
  )

}

export default LowerPanelWord