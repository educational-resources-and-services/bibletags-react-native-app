import React from "react"
import { StyleSheet, View } from "react-native"

import { isIPhoneX, iPhoneXInset } from "../../utils/toolbox"

const styles = StyleSheet.create({
  iphoneXBuffer: {
    height: iPhoneXInset['portrait'].bottomInset,
    // backgroundColor: nativeBasePlatformVariables.toolbarDefaultBg,
  },
  extraSpace: {
    height: iPhoneXInset['portrait'].bottomInset + 10,
  },
})

const IPhoneXBuffer = ({
  extraSpace,
  ...otherProps
}) => {

  if(!isIPhoneX) return null

  return (
    <View
      style={[
        styles.iphoneXBuffer,
        extraSpace ? styles.extraSpace : null,
      ]}
      {...otherProps}
    />
  )

}

export default IPhoneXBuffer