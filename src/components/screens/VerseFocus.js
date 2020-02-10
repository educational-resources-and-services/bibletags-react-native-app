import React from "react"
import { StyleSheet, View, Text } from "react-native"
// import Constants from "expo-constants"
// import { bindActionCreators } from "redux"
// import { connect } from "react-redux"
import { Container, Content } from "native-base"

// import BackFunction from '../basic/BackFunction'
// import FullScreenSpin from '../basic/FullScreenSpin'

// const {
//   SOMETHING
// } = Constants.manifest.extra

// const contentsStyles = {
// }

const VerseFocus = () => {

  return (
    <Container>
      <AppHeader />
      <Content>
        <View>
          <Text>Verse Focus</Text>
        </View>
      </Content>
    </Container>
  )

}

export default VerseFocus
// const mapStateToProps = (state) => ({
//   // readerStatus: state.readerStatus,
// })

// const matchDispatchToProps = (dispatch, x) => bindActionCreators({
//   // setXapiConsentShown,
// }, dispatch)

// export default connect(mapStateToProps, matchDispatchToProps)(VerseFocus)