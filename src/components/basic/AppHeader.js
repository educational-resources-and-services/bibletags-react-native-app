import React from "react"
import Constants from "expo-constants"
import { Header } from "native-base"
import { Platform, StyleSheet, View, StatusBar } from "react-native"
import { connect } from "react-redux"
import { bindActionCreators } from "redux"

import { getToolbarHeight, isIPhoneX, iPhoneXInset } from '../../utils/toolbox.js'

import IPhoneXBuffer from "./IPhoneXBuffer.js"

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
              paddingTop: iPhoneXInset['portrait'].topInset * -1,
              height: iPhoneXInset['portrait'].bottomInset,
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
  headerLowLight: {
    backgroundColor: 'rgba(54, 50, 50, 1)',
    borderBottomColor: 'rgba(82, 78, 78, 1)',
  },
  headerContrast: {
    ...(
      Platform.OS === 'android'
        ? {
          backgroundColor: '#222222',
        }
        : {}
    ),
  },
  statusBarContrast: {
    ...(
      Platform.OS === 'android'
        ? {
          backgroundColor: 'black',
        }
        : {}
    ),
  },
})

class AppHeader extends React.Component {

  // There is a bug by which the backgroundColor in the header does not get set on load.
  // Thus, this component is a hack to force it to render properly.

  render() {
    const { hide, hideStatusBar, displaySettings, ...headerParams } = this.props

    const style = {}

    if(hide) {
      style.top = getToolbarHeight() * -1
    }

    return (
      <View
        style={[
          !hide ? styles.container : null,
          displaySettings.theme === 'high-contrast' ? styles.statusBarContrast : null,
        ]}
      >
        {(!hideStatusBar && isIPhoneX) &&
          <IPhoneXBuffer />
        }
        <StatusBar
          backgroundColor={ANDROID_STATUS_BAR_COLOR}
          barStyle={displaySettings.theme === 'low-light' ? 'default' : 'default'}
          //backgroundColor and barStyle still do not seem to be working
          translucent={true}
          animated={!hideStatusBar}
          hidden={hideStatusBar && !isIPhoneX}
        />
        <Header
          {...headerParams}
          style={[
            styles.header,
            displaySettings.theme === 'high-contrast'
              ? styles.headerContrast
              : (
                displaySettings.theme === 'low-light'
                  ? styles.headerLowLight
                  : null
              ),
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

const mapStateToProps = ({ displaySettings }) => ({
  displaySettings,
})

const matchDispatchToProps = dispatch => bindActionCreators({
  // setRef,
}, dispatch)

export default connect(mapStateToProps, matchDispatchToProps)(AppHeader)
