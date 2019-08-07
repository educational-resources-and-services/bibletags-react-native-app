import React from "react"
import { StyleSheet, View } from "react-native"
import Constants from "expo-constants"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"

import nativeBasePlatformVariables from 'native-base/src/theme/variables/platform'
import { isIPhoneX, iPhoneXInset } from "../../utils/toolbox.js"

const {
//   PASSAGE_CHOOSER_HEIGHT,
} = Constants.manifest.extra

const styles = StyleSheet.create({
  iphoneXBuffer: {
    height: iPhoneXInset['portrait'].bottomInset,
    backgroundColor: nativeBasePlatformVariables.toolbarDefaultBg,
  },
  extraSpace: {
    height: iPhoneXInset['portrait'].bottomInset + 10,
  },
})

class IPhoneXBuffer extends React.Component {

  render() {
    const { extraSpace } = this.props

    if(!isIPhoneX) return null

    return (
      <View
        style={[
          styles.iphoneXBuffer,
          extraSpace ? styles.extraSpace : null,
        ]}
      />
    )
  }
}

const mapStateToProps = ({ displaySettings }) => ({
  displaySettings,
})

const matchDispatchToProps = dispatch => bindActionCreators({
}, dispatch)

export default connect(mapStateToProps, matchDispatchToProps)(IPhoneXBuffer)