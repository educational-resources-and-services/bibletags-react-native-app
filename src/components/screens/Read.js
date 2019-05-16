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
import Options from "../major/Options"
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
    showingOptions: false,
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
    const { showingOptions } = this.state

    this.setState({ showingOptions: !showingOptions })
  }

  toggleShowPassageChooser = () => {
    const { showingPassageChooser } = this.state

    this.setState({ showingPassageChooser: !showingPassageChooser })

    if(Platform.OS === 'ios') {
      StatusBar.setHidden(!showingPassageChooser, 'fade')
    }
  }
  
  hideShowPassageChooser = () => {
    const { showingPassageChooser } = this.state

    if(showingPassageChooser) this.toggleShowPassageChooser()
  }
  
  showPassageChooser = () => {
    const { showingPassageChooser } = this.state

    if(!showingPassageChooser) this.toggleShowPassageChooser()
  }
  
  hideOptions = () => this.setState({ showingOptions: false })

  render() {

    const { navigation } = this.props
    const { showingOptions, showingPassageChooser, currentAppState } = this.state

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
            hideShowPassageChooser={this.hideShowPassageChooser}
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
            hideOptions={this.hideOptions}
            hideStatusBar={hideStatusBar}
            width={width}  // By sending this as a prop, I force a rerender
          />
          <KeepAwake />
          {showingOptions &&
            <Options
              requestHide={this.hideOptions}
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
              onPressIn={this.hideShowPassageChooser}
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