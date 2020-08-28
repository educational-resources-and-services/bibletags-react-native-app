import React from "react"
import { StyleSheet, View } from "react-native"
import { useDimensions } from "@react-native-community/hooks"

import { isIPhoneX, memoStyled } from "../../utils/toolbox"

import StatusBarWithBackground from "./StatusBarWithBackground"
import IPhoneXBuffer from "./IPhoneXBuffer"

const styles = StyleSheet.create({
  header: {
    zIndex: 3,
    minHeight: 50,
    flexDirection: 'row',
    borderBottomWidth: 1,
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

export default memoStyled(AppHeader, 'AppHeader')