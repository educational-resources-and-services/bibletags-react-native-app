import React from "react"
import { StyleSheet, View, Text, Dimensions, AppState } from "react-native"
import { Constants, KeepAwake } from "expo"
// import { bindActionCreators } from "redux"
// import { connect } from "react-redux"
import { Content } from "native-base"
import i18n from "../../utils/i18n.js"

import ReadHeader from "../major/ReadHeader"
import Options from "../major/Options"
import PassageChooser from "../major/PassageChooser"
import FullScreenSpin from '../basic/FullScreenSpin'
import RevealContainer from '../basic/RevealContainer'

import { unmountTimeouts } from "../../utils/toolbox.js"

const {
  APP_BACKGROUND_COLOR,
  PASSAGE_CHOOSER_HEIGHT,
} = Constants.manifest.extra

const styles = StyleSheet.create({
  passageChooserContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: PASSAGE_CHOOSER_HEIGHT,
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
  }
  
  hideOptions = () => this.setState({ showingOptions: false })

  render() {

    const { navigation } = this.props
    const { showingOptions, showingPassageChooser, currentAppState } = this.state

    const { width } = Dimensions.get('window')

    return (
      <React.Fragment>
        <View
          style={styles.passageChooserContainer}
        >
          <PassageChooser
            toggleShowPassageChooser={this.toggleShowPassageChooser}
          />
        </View>
        <RevealContainer
          revealAmount={(showingPassageChooser ? PASSAGE_CHOOSER_HEIGHT : 0)}
        >
          <ReadHeader
            navigation={navigation}
            toggleShowOptions={this.toggleShowOptions}
            toggleShowPassageChooser={this.toggleShowPassageChooser}
            hideOptions={this.hideOptions}
            showingPassageChooser={showingPassageChooser}
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
        </RevealContainer>
      </React.Fragment>
    )
  }
}

export default Read