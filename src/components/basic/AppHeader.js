import React from "react"
import Constants from "expo-constants"
import { Header } from "native-base"
import { Platform, StyleSheet, View, StatusBar } from "react-native"
import nativeBasePlatformVariables from 'native-base/src/theme/variables/platform'

import { getToolbarHeight, isIPhoneX } from '../../utils/toolbox.js'

const {
  ANDROID_TOOLBAR_COLOR,
  ANDROID_STATUS_BAR_COLOR,
} = Constants.manifest.extra

const styles = StyleSheet.create({
  container: {
    zIndex: 3,
    ...(
      Platform.OS === 'android'
        ? {
          backgroundColor: ANDROID_STATUS_BAR_COLOR,
        }
        : {}
    ),
  },
  header: {
    ...(
      Platform.OS === 'android'
        ? {
          backgroundColor: ANDROID_TOOLBAR_COLOR,
          marginTop: StatusBar.currentHeight,
        }
        : (
          isIPhoneX
            ? {
              paddingTop: -20,
              height: 34,
            }
            : {}
        )
    ),
  },
  noStatusBarSpace: {
    ...(
      Platform.OS === 'android'
        ? {
          marginTop: 0,
          paddingTop: 0,
        }
        : (
          isIPhoneX
            ? {}
            : {
              paddingTop: 0,
              height: 46,
            }
        )
    ),
  },
  iphoneXBuffer: {
    backgroundColor: nativeBasePlatformVariables.toolbarDefaultBg,
    height: 34,
  },
})

class AppHeader extends React.Component {

  // There is a bug by which the backgroundColor in the header does not get set on load.
  // Thus, this component is a hack to force it to render properly.

  render() {
    const { hide, hideStatusBar, ...headerParams } = this.props

    const style = {}

    if(hide) {
      style.top = getToolbarHeight() * -1
    }

    return (
      <View style={!hide && styles.container}>
        {(!hideStatusBar && isIPhoneX) &&
          <View style={styles.iphoneXBuffer} />
        }
        <StatusBar
          backgroundColor={ANDROID_STATUS_BAR_COLOR}  // This does not seem to work
          translucent={true}
          animated={!hideStatusBar}
          hidden={hideStatusBar && !isIPhoneX}
        />
        <Header
          {...headerParams}
          style={[
            styles.header,
            (hideStatusBar ? styles.noStatusBarSpace : null),
            style,
          ]}
        >
          {this.props.children}
        </Header>
      </View>
    )
  }
}

export default AppHeader