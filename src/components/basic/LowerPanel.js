import React, { useState, useMemo, useCallback } from "react"
import { StyleSheet, ScrollView, Platform } from "react-native"
import { useDimensions } from '@react-native-community/hooks'
import usePrevious from "react-use/lib/usePrevious"
import { BoxShadow } from 'react-native-shadow'

import RevealContainer from "../basic/RevealContainer"
import LowerPanelWord from "./LowerPanelWord"
import LowerPanelVsComparison from "./LowerPanelVsComparison"

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    elevation: 0,
  },
  scrollView: {
    flex: 1,
    backgroundColor: 'white',
  },
})

const LowerPanel = ({
  selectedInfo,
}) => {

  const previousSelectedInfo = usePrevious(selectedInfo)

  const { selectedSection, selectedVerse, selectedWordInfo } = (selectedInfo.selectedSection ? selectedInfo : previousSelectedInfo) || {}
  const show = !!selectedInfo.selectedSection

  const [ contentHeight, setContentHeight ] = useState(300)

  const { width: windowWidth, height: windowHeight } = useDimensions().window

  const containerStyle = useMemo(
    () => StyleSheet.flatten([
      styles.container,
      {
        height: Math.min(contentHeight, windowHeight/2),
      },
    ]),
    [ windowHeight, contentHeight ],
  )

  const shadowSetting = useMemo(
    () => ({
      width: windowWidth,
      height: windowHeight,
      color:"#000",
      border: 40,
      radius: 0,
      opacity: 0.08,
      x: 0,
      y: 0,
    }),
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
        selectedSection={selectedSection}
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

  let wrappedContents = (
    <ScrollView
      style={styles.scrollView}
      onContentSizeChange={onContentSizeChange}
      alwaysBounceVertical={false}
    >
      {contents}
    </ScrollView>
  )

  if(Platform.OS === 'android') {
    wrappedContents = (
      <BoxShadow setting={shadowSetting}>
        {wrappedContents}
      </BoxShadow>
    )
  }

  return (
    <RevealContainer
      revealAmount={(show ? 0 : containerStyle.height)}
      immediateAdjustment={0}
      style={containerStyle}
      duration={100}
    >
      {wrappedContents}
    </RevealContainer>
  )
}

export default LowerPanel