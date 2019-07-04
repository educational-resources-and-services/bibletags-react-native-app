import React from "react"
import { Constants } from "expo"
import { Platform } from "react-native"
import { Icon } from "native-base"

const {
  IOS_HEADER_ICON_COLOR,
} = Constants.manifest.extra

class HeaderIcon extends React.PureComponent {
  render() {
    const { style={}, ...otherProps } = this.props

    return (
      <Icon
        {...otherProps}
        style={{
          ...style,
          ...(
            Platform.OS === 'ios'
              ? {
                color: IOS_HEADER_ICON_COLOR,
              }
              : {}
          ),
        }}
      />
    )
  }
}

export default HeaderIcon
