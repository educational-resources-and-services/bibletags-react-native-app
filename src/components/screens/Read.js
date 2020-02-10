import React, { useState, useEffect, useCallback } from "react"
import { StyleSheet, View, StatusBar, TouchableWithoutFeedback } from "react-native"
import { activateKeepAwake, deactivateKeepAwake } from "expo-keep-awake"
import Constants from "expo-constants"

import { debounce, isIPhoneX, iPhoneXInset } from "../../utils/toolbox.js"
import { useDimensions } from 'react-native-hooks'

import ReadHeader from "../major/ReadHeader"
import ReadContent from "../major/ReadContent"
import DisplaySettings from "../major/DisplaySettings"
import PassageChooser from "../major/PassageChooser"
// import FullScreenSpin from '../basic/FullScreenSpin'
import RevealContainer from '../basic/RevealContainer'
import RecentSection from '../major/RecentSection'
import IPhoneXBuffer from "../basic/IPhoneXBuffer.js"

const {
  PASSAGE_CHOOSER_HEIGHT,
} = Constants.manifest.extra

const styles = StyleSheet.create({
  passageChooserContainer: {
    ...StyleSheet.absoluteFill,
  },
  invisibleCover: {
    ...StyleSheet.absoluteFill,
    zIndex: 20,
  },
})

const Read = ({ navigation }) => {

  const [ showingDisplaySettings, setShowingDisplaySettings ] = useState(false)
  const [ showingPassageChooser, setShowingPassageChooser ] = useState(false)

  const { width, height } = useDimensions().window

  useEffect(
    () => {
      activateKeepAwake()
      return deactivateKeepAwake
    },
    [],
  )

  const toggleShowOptions = useCallback(
    () => setShowingDisplaySettings(!showingDisplaySettings),
    [ showingDisplaySettings ],
  )

  const hidePassageChooser = useCallback(() => setShowingPassageChooser(false), [])
  const showPassageChooser = useCallback(() => setShowingPassageChooser(true), [])
  
  const hideDisplaySettings = useCallback(() => setShowingDisplaySettings(false), [])

  const goVersions = useCallback(
    () => {
      hidePassageChooser()

      debounce(
        navigation.navigate,
        "Versions",
      )
    },
    [ navigation ],
  )

  const statusBarHeight = StatusBar.currentHeight || 0
  const adjustedPassageChooserHeight = Math.min(PASSAGE_CHOOSER_HEIGHT, height - 100)
  const hideStatusBar = showingPassageChooser

  return (
    <>
      <View
        style={styles.passageChooserContainer}
      >
        <IPhoneXBuffer extraSpace={true} />
        <PassageChooser
          hidePassageChooser={hidePassageChooser}
          paddingBottom={height - statusBarHeight - adjustedPassageChooserHeight}
          showing={showingPassageChooser}
          goVersions={goVersions}
        />
      </View>
      <RevealContainer
        revealAmount={(showingPassageChooser ? adjustedPassageChooserHeight : 0)}
        immediateAdjustment={hideStatusBar ? (isIPhoneX ? iPhoneXInset['portrait'].bottomInset : 20) : 0}
      >
        <ReadHeader
          navigation={navigation}
          toggleShowOptions={toggleShowOptions}
          showPassageChooser={showPassageChooser}
          showingPassageChooser={showingPassageChooser}
          hideStatusBar={hideStatusBar}
          width={width}  // By sending this as a prop, I force a rerender
        />
        {showingDisplaySettings &&
          <DisplaySettings
            hideDisplaySettings={hideDisplaySettings}
          />
        }
        <ReadContent />
        <RecentSection
          navigation={navigation}
        />
        {!!showingPassageChooser &&
          <TouchableWithoutFeedback
            style={styles.invisibleCover}
            onPressIn={hidePassageChooser}
          >
            <View
              style={styles.invisibleCover}
            />
          </TouchableWithoutFeedback>
        }
      </RevealContainer>
    </>
  )

}

export default Read