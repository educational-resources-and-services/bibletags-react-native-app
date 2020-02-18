import React from "react"
import { StyleSheet, View, StatusBar } from "react-native"
import { useDimensions } from 'react-native-hooks'

import { isIPhoneX } from '../../utils/toolbox.js'

import IPhoneXBuffer from "./IPhoneXBuffer.js"

const styles = StyleSheet.create({
  statusBarBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, .9)',
  },
  container: {
    zIndex: 3,
  },
  header: {
    minHeight: 50,
    backgroundColor: 'white',
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: 'rgba(0, 0, 0, .1)',
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
}) => {

  // There is a bug by which the backgroundColor in the header does not get set on load.
  // Thus, this component is a hack to force it to render properly.

  useDimensions()  // This forces a rerender whenever the dimensions change

  return (
    <View style={styles.container}>
      {(!hideStatusBar && isIPhoneX) &&
        <IPhoneXBuffer />
      }
      <View style={styles.statusBarBackground} />
      <StatusBar
        animated={!hideStatusBar}
        hidden={hideStatusBar && !isIPhoneX}
      />
      <View
        style={[
          styles.header,
          (hideStatusBar ? styles.noStatusBarSpace : null),
          style,
        ]}
      >
        {children}
      </View>
    </View>
  )

}

export default AppHeader