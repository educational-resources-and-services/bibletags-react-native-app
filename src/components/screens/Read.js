import React from "react"
import { StyleSheet, View, Text, Dimensions, AppState, StatusBar,
         TouchableWithoutFeedback, Platform } from "react-native"
import { Constants, KeepAwake } from "expo"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"
import { Content } from "native-base"

import i18n from "../../utils/i18n.js"
import { unmountTimeouts } from "../../utils/toolbox.js"
import { getValidFontName } from "../../utils/bibleFonts.js"

import ReadHeader from "../major/ReadHeader"
import DisplaySettings from "../major/DisplaySettings"
import PassageChooser from "../major/PassageChooser"
import FullScreenSpin from '../basic/FullScreenSpin'
import RevealContainer from '../basic/RevealContainer'
import RecentSection from '../major/RecentSection'

const {
  APP_BACKGROUND_COLOR,
  PASSAGE_CHOOSER_HEIGHT,
  DEFAULT_FONT_SIZE,
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

    const { navigation, displaySettings } = this.props
    const { showingDisplaySettings, showingPassageChooser, currentAppState } = this.state

    const { width, height } = Dimensions.get('window')
    const { font, textSize } = displaySettings
    const fontSize = DEFAULT_FONT_SIZE * textSize

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
            <View
              style={{ padding: 20, paddingBottom: 110 }}
            >
              <Text style={{ fontSize, fontFamily: getValidFontName({ font }) }}>
                normal text normal text normal text normal text normal text normal text normal text normal text normal text 
                normal text normal text normal text normal text normal text normal text normal text normal text normal text 
                normal text normal text normal text normal text normal text normal text normal text normal text normal text 
                normal text normal text normal text normal text normal text normal text normal text normal text normal text 
                normal text normal text normal text normal text normal text normal text normal text normal text normal text 
                normal text normal text normal text normal text normal text normal text normal text normal text normal text 
                normal text normal text normal text normal text normal text normal text normal text normal text normal text 
                normal text normal text normal text normal text normal text normal text normal text normal text normal text 
              </Text>
              <Text style={{ fontSize, fontFamily: getValidFontName({ font, variant: 'italic' }) }}>italics text2</Text>
              <Text style={{ fontSize, fontFamily: getValidFontName({ font, variant: 'bold' }) }}>bold text2</Text>
            </View>
          </Content>
          <RecentSection />
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

const mapStateToProps = ({ displaySettings }) => ({
  displaySettings,
})

const matchDispatchToProps = dispatch => bindActionCreators({
  // setTheme,
}, dispatch)

export default connect(mapStateToProps, matchDispatchToProps)(Read)