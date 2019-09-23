import React from "react"
import Constants from "expo-constants"
import { Platform, StyleSheet } from "react-native"
import { Icon } from "native-base"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"

const {
  IOS_HEADER_ICON_COLOR,
} = Constants.manifest.extra

const styles = StyleSheet.create({
  lowLight: {
    color: 'rgba(176, 176, 181, 1)',
  },
})

class HeaderIcon extends React.PureComponent {
  render() {
    const { style={}, displaySettings, ...otherProps } = this.props

    return (
      <Icon
        {...otherProps}
        style={[
          {
            ...style,
            ...(
              Platform.OS === 'ios'
                ? {
                  color: IOS_HEADER_ICON_COLOR,
                }
                : {}
            ),
          },
          displaySettings.theme === 'low-light' ? styles.lowLight : null,
        ]}
      />
    )
  }
}

const mapStateToProps = ({ displaySettings }) => ({
  displaySettings,
})

const matchDispatchToProps = dispatch => bindActionCreators({
  // setRef,
}, dispatch)

export default connect(mapStateToProps, matchDispatchToProps)(HeaderIcon)