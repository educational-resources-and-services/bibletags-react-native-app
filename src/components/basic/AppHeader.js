import React from "react"
import { Constants } from "expo"
import { Header } from "native-base"
import { Platform, StyleSheet, View, StatusBar } from "react-native"

import { getToolbarHeight } from '../../utils/toolbox.js'

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
        : {}
    ),
  },
  noStatusBarSpace: {
    ...(
      Platform.OS === 'android'
        ? {
          marginTop: 0,
          paddingTop: 0,
        }
        : {
          paddingTop: 0,
          height: 46,
          //borderTopWidth: 1,
          //borderTopColor: '#cccccc',
        }
    ),
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
        <StatusBar
          backgroundColor={ANDROID_STATUS_BAR_COLOR}  // This does not seem to work
          translucent={true}
          animated={!hideStatusBar}
          hidden={hideStatusBar}
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