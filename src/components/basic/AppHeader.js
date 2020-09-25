import React from "react"
import { StyleSheet, View, Platform } from "react-native"
import { useDimensions } from "@react-native-community/hooks"

import { isIPhoneX, memo } from "../../utils/toolbox"

import StatusBarWithBackground from "./StatusBarWithBackground"
import IPhoneXBuffer from "./IPhoneXBuffer"

const styles = StyleSheet.create({
  header: {
    zIndex: 3,
    minHeight: Platform.select({ ios: 50, android: 61.5 }),
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingTop: Platform.select({ ios: 0, android: 10 }),
  },
  noStatusBarSpace: {
    ...(
      isIPhoneX
        ? {}
        : {
          paddingTop: 0,
          height: 46,
        }
    ),
  },
})

const AppHeader = ({
  hideStatusBar,
  style,
  children,

  themedStyle,
}) => {

  // There is a bug by which the backgroundColor in the header does not get set on load.
  // Thus, this component is a hack to force it to render properly.

  useDimensions()  // This forces a rerender whenever the dimensions change

  return (
    <>
      {(!hideStatusBar && isIPhoneX) &&
        <IPhoneXBuffer />
      }
      <StatusBarWithBackground
        animated={!hideStatusBar}
        hidden={hideStatusBar && !isIPhoneX}
      />
      <View
        style={[
          styles.header,
          (hideStatusBar ? styles.noStatusBarSpace : null),
          themedStyle,
          style,
        ]}
      >
        {children}
      </View>
    </>
  )

}

export default memo(AppHeader, { name: 'AppHeader' })