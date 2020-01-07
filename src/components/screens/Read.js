import React from "react"
import { StyleSheet, View, Dimensions, AppState, StatusBar,
         TouchableWithoutFeedback } from "react-native"
import { activateKeepAwake, deactivateKeepAwake } from "expo-keep-awake"
import Constants from "expo-constants"

import { unmountTimeouts, debounce, isIPhoneX, iPhoneXInset } from "../../utils/toolbox.js"

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

class Read extends React.Component {

  state = {
    showingDisplaySettings: false,
    showingPassageChooser: false,
    translateYAnimation: 0,
    currentAppState: 'active',
  }

  componentDidMount() {
    AppState.addEventListener('change', this.handleAppStateChange)
    activateKeepAwake()
  }

  componentWillUnmount = () => {
    AppState.removeEventListener('change', this.handleAppStateChange)
    unmountTimeouts.bind(this)()
    deactivateKeepAwake()
  }

  handleAppStateChange = currentAppState => {
    this.setState({
      currentAppState,
    })
  }

  toggleShowOptions = () => {
    const { showingDisplaySettings } = this.state

    this.setState({ showingDisplaySettings: !showingDisplaySettings })
  }

  toggleShowPassageChooser = () => {
    const { showingPassageChooser } = this.state

    this.setState({ showingPassageChooser: !showingPassageChooser })
  }
  
  hidePassageChooser = () => {
    const { showingPassageChooser } = this.state

    if(showingPassageChooser) this.toggleShowPassageChooser()
  }
  
  showPassageChooser = () => {
    const { showingPassageChooser } = this.state

    if(!showingPassageChooser) this.toggleShowPassageChooser()
  }
  
  hideDisplaySettings = () => this.setState({ showingDisplaySettings: false })

  goVersions = () => {
    const { navigation } = this.props

    this.hidePassageChooser()

    debounce(
      navigation.navigate,
      "Versions",
    )
  }

  render() {

    const { navigation } = this.props
    const { showingDisplaySettings, showingPassageChooser, currentAppState } = this.state

    const { width, height } = Dimensions.get('window')

    const statusBarHeight = StatusBar.currentHeight || 0
    const adjustedPassageChooserHeight = Math.min(PASSAGE_CHOOSER_HEIGHT, height - 100)
    const hideStatusBar = showingPassageChooser

    return (
      <React.Fragment>
        <View
          style={styles.passageChooserContainer}
        >
          <IPhoneXBuffer extraSpace={true} />
          <PassageChooser
            hidePassageChooser={this.hidePassageChooser}
            paddingBottom={height - statusBarHeight - adjustedPassageChooserHeight}
            showing={showingPassageChooser}
            goVersions={this.goVersions}
          />
        </View>
        <RevealContainer
          revealAmount={(showingPassageChooser ? adjustedPassageChooserHeight : 0)}
          immediateAdjustment={hideStatusBar ? (isIPhoneX ? iPhoneXInset['portrait'].bottomInset : 20) : 0}
        >
          <ReadHeader
            navigation={navigation}
            toggleShowOptions={this.toggleShowOptions}
            showPassageChooser={this.showPassageChooser}
            showingPassageChooser={showingPassageChooser}
            hideStatusBar={hideStatusBar}
            width={width}  // By sending this as a prop, I force a rerender
          />
          {showingDisplaySettings &&
            <DisplaySettings
              hideDisplaySettings={this.hideDisplaySettings}
            />
          }
          <ReadContent />
          <RecentSection
            navigation={navigation}
          />
          {!!showingPassageChooser &&
            <TouchableWithoutFeedback
              style={styles.invisibleCover}
              onPressIn={this.hidePassageChooser}
            >
              <View
                style={styles.invisibleCover}
              />
            </TouchableWithoutFeedback>
          }
        </RevealContainer>
      </React.Fragment>
    )
  }
}

export default Read