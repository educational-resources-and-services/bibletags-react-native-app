import React from "react"
import { StyleSheet, View, Text, Dimensions, AppState, StatusBar,
         TouchableWithoutFeedback, Platform } from "react-native"
import { Constants, KeepAwake } from "expo"
// import { bindActionCreators } from "redux"
// import { connect } from "react-redux"
import { Content } from "native-base"

import i18n from "../../utils/i18n.js"
import { unmountTimeouts } from "../../utils/toolbox.js"

import ReadHeader from "../major/ReadHeader"
import DisplaySettings from "../major/DisplaySettings"
import PassageChooser from "../major/PassageChooser"
import FullScreenSpin from '../basic/FullScreenSpin'
import RevealContainer from '../basic/RevealContainer'

const {
  APP_BACKGROUND_COLOR,
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
  }

  componentWillUnmount = () => {
    AppState.removeEventListener('change', this.handleAppStateChange)
    unmountTimeouts.bind(this)()
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

    if(Platform.OS === 'ios') {
      StatusBar.setHidden(!showingPassageChooser, 'fade')
    }
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

  render() {

    const { navigation } = this.props
    const { showingDisplaySettings, showingPassageChooser, currentAppState } = this.state

    const { width, height } = Dimensions.get('window')

    const statusBarHeight = StatusBar.currentHeight || 0
    const adjustedPassageChooserHeight = Math.min(PASSAGE_CHOOSER_HEIGHT, height - 100)
    const hideStatusBar = showingPassageChooser && Platform.OS === 'ios'

    return (
      <React.Fragment>
        <View
          style={styles.passageChooserContainer}
        >
          <PassageChooser
            hidePassageChooser={this.hidePassageChooser}
            paddingBottom={height - statusBarHeight - adjustedPassageChooserHeight}
          />
        </View>
        <RevealContainer
          revealAmount={(showingPassageChooser ? adjustedPassageChooserHeight : 0)}
          immediateAdjustment={hideStatusBar ? 20 : 0}
        >
          <ReadHeader
            navigation={navigation}
            toggleShowOptions={this.toggleShowOptions}
            showPassageChooser={this.showPassageChooser}
            hideStatusBar={hideStatusBar}
            width={width}  // By sending this as a prop, I force a rerender
          />
          <KeepAwake />
          {showingDisplaySettings &&
            <DisplaySettings
              hideDisplaySettings={this.hideDisplaySettings}
            />
          }
          <Content>
            <View>
              <Text>verses</Text>
            </View>
          </Content>
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