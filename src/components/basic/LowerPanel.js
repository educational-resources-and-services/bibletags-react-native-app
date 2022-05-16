import React, { useMemo, useCallback } from "react"
import { StyleSheet, View, Platform } from "react-native"
import { useDimensions } from '@react-native-community/hooks'
import usePrevious from "react-use/lib/usePrevious"
import { BoxShadow } from 'react-native-shadow'

import useContentHeightManager from "../../hooks/useContentHeightManager"

import RevealContainer from "../basic/RevealContainer"
import LowerPanelOriginalWord from "./LowerPanelOriginalWord"
import LowerPanelFootnote from "./LowerPanelFootnote"
import LowerPanelVsComparison from "./LowerPanelVsComparison"
import useInstanceValue from "../../hooks/useInstanceValue"

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    elevation: 0,
    backgroundColor: 'white',
  },
  boxShadowContent: {
    backgroundColor: 'white',
    flex: 1,
  },
})

const LowerPanel = ({
  selectedData,
  setSelectedData,
}) => {

  const previousSelectedData = usePrevious(selectedData)

  const { selectedSection, selectedVerse, selectedInfo, selectedTagInfo, selectedVerseUsfm } = (selectedData.selectedSection ? selectedData : previousSelectedData) || {}
  const show = !!selectedData.selectedSection
  const getSelectedData = useInstanceValue(selectedData)  

  const { contentHeight, onSizeChangeFunctions, clearRecordedHeights } = useContentHeightManager(300)

  const { width: windowWidth, height: windowHeight } = useDimensions().window

  const maxHeight = parseInt((windowHeight - 46) * .7, 10)  // i.e. 70% of non-header height

  const containerStyle = useMemo(
    () => StyleSheet.flatten([
      styles.container,
      {
        height: Math.max(Math.min(contentHeight, maxHeight), 1),
      },
    ]),
    [ maxHeight, contentHeight ],
  )

  const shadowSetting = useMemo(
    () => ({
      width: windowWidth,
      height: containerStyle.height,
      color:"#000",
      border: 40,
      radius: 0,
      opacity: 0.08,
      x: 0,
      y: 0,
    }),
    [ windowHeight, containerStyle ],
  )

  const updateSelectedData = useCallback(
    updates => {
      setSelectedData({
        ...getSelectedData(),
        ...updates,
      })
    },
    [],
  )

  let contents = null
  const { tag: selectedInfoTag } = selectedInfo || {}
  let contentsType

  if(selectedInfoTag === 'w') {
    contents = (
      <LowerPanelOriginalWord
        selectedInfo={selectedInfo}
        onSizeChangeFunctions={onSizeChangeFunctions}
        maxHeight={maxHeight}
      />
    )
    contentsType = 'word'

  } else if([ 'f', 'fe', 'x' ].includes(selectedInfoTag)) {
    contents = (
      <LowerPanelFootnote
        selectedSection={selectedSection}
        selectedInfo={selectedInfo}
        isCf={[ 'x' ].includes(selectedInfoTag)}
        onSizeChangeFunctions={onSizeChangeFunctions}
      />
    )
    contentsType = 'footnote'

  } else if(selectedVerse !== null) {
    contents = (
      <LowerPanelVsComparison
        selectedSection={selectedSection}
        selectedVerse={selectedVerse}
        selectedVerseUsfm={selectedVerseUsfm}
        selectedInfo={selectedInfo}
        selectedTagInfo={selectedTagInfo}
        updateSelectedData={updateSelectedData}
        onSizeChangeFunctions={onSizeChangeFunctions}
        maxHeight={maxHeight}
      />
    )
    contentsType = 'vscomparison'
  }

  // Need to use useMemo (instead of useLayoutEffect) so that it fires
  // before any of the new heights are set.
  useMemo(() => clearRecordedHeights(), [ contentsType ])

  if(Platform.OS === 'android') {
    contents = (
      <BoxShadow setting={shadowSetting}>
        <View style={styles.boxShadowContent}>
          {contents}
        </View>
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
      {contents}
    </RevealContainer>
  )
}

export default LowerPanel