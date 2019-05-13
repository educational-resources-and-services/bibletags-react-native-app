import React from "react"
import { StyleSheet, View, Text, Dimensions, AppState } from "react-native"
import { Constants, KeepAwake } from "expo"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"
import { Container, Content } from "native-base"
import i18n from "../../utils/i18n.js"

import ReadHeader from "../major/ReadHeader"
import Options from "../major/Options"
import FullScreenSpin from '../basic/FullScreenSpin'

import { unmountTimeouts } from "../../utils/toolbox.js"

const {
  APP_BACKGROUND_COLOR,
} = Constants.manifest.extra

const contentsStyles = {
}

class Read extends React.Component {

  constructor(props) {
    super(props)

    this.state = {
      showOptions: false,
      currentAppState: 'active',
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

  toggleShowOptions = () => {
    const { showOptions } = this.state

    this.setState({ showOptions: !showOptions })
  }
  
  hideOptions = () => this.setState({ showOptions: false })

  render() {

    const { showOptions, currentAppState } = this.state

    const { width } = Dimensions.get('window')

    return (
      <Container>
        <ReadHeader
          toggleShowOptions={this.toggleShowOptions}
          width={width}  // By sending this as a prop, I force a rerender
        />
        <KeepAwake />
        {showOptions &&
          <Options
            requestHide={this.hideOptions}
          />
        }
        <Content>
          <View>
            <Text>read</Text>
          </View>
        </Content>
      </Container>
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