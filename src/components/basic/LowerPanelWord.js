import React from "react"
import { StyleSheet, ScrollView } from "react-native"

import Parsing from "./Parsing"
import Definition from "./Definition"

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
})

const LowerPanelWord = ({
  selectedInfo,
  onSizeChangeFunctions,
}) => {

  return (
    <>
      <Parsing
        selectedInfo={selectedInfo}
        onLayout={onSizeChangeFunctions[0]}
      />
      <ScrollView
        style={styles.scrollView}
        onContentSizeChange={onSizeChangeFunctions[1]}
        alwaysBounceVertical={false}
      >
        <Definition
          selectedInfo={selectedInfo}
        />
      </ScrollView>
    </>
  )

}

export default LowerPanelWord