import React, { useState, useMemo, useCallback, useEffect } from "react"
import { StyleSheet, ScrollView } from "react-native"
import { useDimensions } from '@react-native-community/hooks'
import usePrevious from "react-use/lib/usePrevious"

import RevealContainer from "../basic/RevealContainer"
import LowerPanelWord from "./LowerPanelWord"
import LowerPanelVsComparison from "./LowerPanelVsComparison"

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  scrollView: {
    flex: 1,
  },
})

const LowerPanel = ({
  selectedInfo,
}) => {

  const previousSelectedInfo = usePrevious(selectedInfo)

  const { selectedVerse, selectedWordInfo } = (selectedInfo.selectedSection ? selectedInfo : previousSelectedInfo) || {}
  const show = !!selectedInfo.selectedSection

  const [ contentHeight, setContentHeight ] = useState(300)

  const { height: windowHeight } = useDimensions().window

  const containerStyle = useMemo(
    () => StyleSheet.flatten([
      styles.container,
      {
        height: Math.min(contentHeight, windowHeight/2),
      },
    ]),
    [ windowHeight, contentHeight ],
  )

  let contents = null

  if(selectedWordInfo) {
    contents = (
      <LowerPanelWord
        selectedWordInfo={selectedWordInfo}
      />
    )

  } else if(selectedVerse) {
    contents = (
      <LowerPanelVsComparison
        selectedVerse={selectedVerse}
      />
    )
  }

  const onContentSizeChange = useCallback(
    (x, contentHeight) => {
      if(contentHeight) {
        setContentHeight(contentHeight)
      }
    },
    [],
  )

  return (
    <RevealContainer
      revealAmount={(show ? 0 : containerStyle.height)}
      immediateAdjustment={0}
      style={containerStyle}
      duration={100}
    >
      <ScrollView
        style={styles.scrollView}
        onContentSizeChange={onContentSizeChange}
        alwaysBounceVertical={false}
      >
        {contents}
      </ScrollView>
    </RevealContainer>
  )

}

export default LowerPanel