import React from "react"
import { StyleSheet, View, Text } from "react-native"
// import Constants from "expo-constants"
// import { bindActionCreators } from "redux"
// import { connect } from "react-redux"

import SafeLayout from "../basic/SafeLayout"

// const {
//   SOMETHING
// } = Constants.manifest.extra

// const contentsStyles = {
// }

const VerseFocus = () => {

  return (
    <SafeLayout>
      <AppHeader />
      <View>
        <Text>Verse Focus</Text>
      </View>
    </SafeLayout>
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