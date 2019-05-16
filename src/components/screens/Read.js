import React from "react"
import { StyleSheet, View, Text, Dimensions, AppState } from "react-native"
import { Constants, KeepAwake } from "expo"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"
import { Content } from "native-base"
import i18n from "../../utils/i18n.js"

import ReadHeader from "../major/ReadHeader"
import Options from "../major/Options"
import FullScreenSpin from '../basic/FullScreenSpin'
import RevealContainer from '../basic/RevealContainer'

import { unmountTimeouts } from "../../utils/toolbox.js"

const {
  APP_BACKGROUND_COLOR,
} = Constants.manifest.extra

// const styles = StyleSheet.create({
// })

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
      <RevealContainer
        revealAmount={(showingPassageChooser ? 400 : 0)}
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
    )
  }
}

export default Read
// const mapStateToProps = (state) => ({
//   // readerStatus: state.readerStatus,
// })

// const matchDispatchToProps = (dispatch, x) => bindActionCreators({
//   // setXapiConsentShown,
// }, dispatch)

// export default connect(mapStateToProps, matchDispatchToProps)(Read)