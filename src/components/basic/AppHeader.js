import React from "react"
import { StyleSheet, View } from "react-native"
import { useDimensions } from 'react-native-hooks'
import { styled } from '@ui-kitten/components'

import { isIPhoneX } from '../../utils/toolbox.js'

import StatusBarWithBackground from './StatusBarWithBackground.js'
import IPhoneXBuffer from "./IPhoneXBuffer.js"

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

AppHeader.styledComponentName = 'AppHeader'

export default styled(AppHeader)