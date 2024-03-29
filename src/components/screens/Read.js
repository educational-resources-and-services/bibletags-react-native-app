import React, { useState, useEffect, useCallback } from "react"
import { StyleSheet, View, TouchableWithoutFeedback } from "react-native"
import { activateKeepAwake, deactivateKeepAwake } from "expo-keep-awake"
import Constants from "expo-constants"
import { Routes, Route } from "react-router-native"
import { useDimensions } from "@react-native-community/hooks"

import { isIPhoneX, iPhoneXInset } from "../../utils/toolbox"
import useRouterState from "../../hooks/useRouterState"

import Search from "./Search"
import VerseTagger from "./VerseTagger"
import VerseTaggerHelp from "./VerseTaggerHelp"
import VerseFocus from "./VerseFocus"
import Versions from "./Versions"
import ReadHeader from "../major/ReadHeader"
import ReadContent from "../major/ReadContent"
import DisplaySettings from "../major/DisplaySettings"
import PassageChooser from "../major/PassageChooser"
import RevealContainer from "../basic/RevealContainer"
import LowerPanel from "../basic/LowerPanel"
import RecentSection from "../major/RecentSection"
import IPhoneXBuffer from "../basic/IPhoneXBuffer"

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

const Read = () => {

  const { historyPush, routerState } = useRouterState()

  const [ showingDisplaySettings, setShowingDisplaySettings ] = useState(false)
  const [ showingPassageChooser, setShowingPassageChooser ] = useState(false)
  const [ selectedData, setSelectedData ] = useState({})

  const { height } = useDimensions().window

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
      historyPush("/Read/Versions")
    },
    [],
  )

  const clearSelectedInfo = useCallback(() => setSelectedData({}), [])

  const adjustedPassageChooserHeight = Math.min(PASSAGE_CHOOSER_HEIGHT, height - 100)
  let passageChooserPaddingAdjustment = Platform.OS === 'ios' ? -15 : 35
  if(isIPhoneX) passageChooserPaddingAdjustment += 20
  const hideStatusBar = showingPassageChooser

  return (
    <Routes>
      <Route path="/Search" element={<Search />} />
      <Route path="/VerseTagger" element={<VerseTagger key={JSON.stringify(routerState.passage)} />} />
      <Route path="/VerseTagger/Help" element={<VerseTaggerHelp />} />
      <Route path="/VerseFocus" element={<VerseFocus />} />
      <Route path="/Versions/*" element={<Versions />} />
      <Route
        path="*"
        element={
          <>

            <View
              style={styles.passageChooserContainer}
            >
              <IPhoneXBuffer extraSpace={true} />
              <PassageChooser
                hidePassageChooser={hidePassageChooser}
                paddingBottom={height - adjustedPassageChooserHeight + passageChooserPaddingAdjustment}
                showing={showingPassageChooser}
                goVersions={goVersions}
              />
            </View>
            <RevealContainer
              revealAmount={(showingPassageChooser ? adjustedPassageChooserHeight : 0)}
              immediateAdjustment={hideStatusBar ? (isIPhoneX ? iPhoneXInset['portrait'].bottomInset : 20) : 0}
            >
              <ReadHeader
                toggleShowOptions={toggleShowOptions}
                showPassageChooser={showPassageChooser}
                showingPassageChooser={showingPassageChooser}
                hideStatusBar={Platform.OS === 'ios' && hideStatusBar}
                selectedData={selectedData}
                clearSelectedInfo={clearSelectedInfo}
              />
              {showingDisplaySettings &&
                <DisplaySettings
                  hideDisplaySettings={hideDisplaySettings}
                />
              }
              <ReadContent
                selectedData={selectedData}
                setSelectedData={setSelectedData}
              />
              <RecentSection />
              <LowerPanel
                selectedData={selectedData}
                setSelectedData={setSelectedData}
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
        }
      />
    </Routes>
  )

}

export default Read