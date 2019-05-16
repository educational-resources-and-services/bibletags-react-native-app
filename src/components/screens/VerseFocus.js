import React from "react"
import { StyleSheet, View, Text, Dimensions } from "react-native"
import { Constants } from "expo"
// import { bindActionCreators } from "redux"
// import { connect } from "react-redux"
import { Container, Content } from "native-base"

import i18n from "../../utils/i18n.js"
import { unmountTimeouts } from "../../utils/toolbox.js"

import Options from "../major/Options"
import BackFunction from '../basic/BackFunction'
import FullScreenSpin from '../basic/FullScreenSpin'

const {
  APP_BACKGROUND_COLOR,
} = Constants.manifest.extra

const contentsStyles = {
}

class VerseFocus extends React.Component {

  constructor(props) {
    super(props)

    this.state = {
    }
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

  render() {

    const { currentAppState } = this.state

    const { width } = Dimensions.get('window')

    return (
      <Container>
        <AppHeader
          width={width}  // By sending this as a prop, I force a rerender
        />
        <Content>
          <View>
            <Text>Verse Focus</Text>
          </View>
        </Content>
      </Container>
    )
  }
}

export default VerseFocus
// const mapStateToProps = (state) => ({
//   // readerStatus: state.readerStatus,
// })

// const matchDispatchToProps = (dispatch, x) => bindActionCreators({
//   // setXapiConsentShown,
// }, dispatch)

// export default connect(mapStateToProps, matchDispatchToProps)(VerseFocus)