import React from "react"
import { StyleSheet, TouchableOpacity } from "react-native"

import { memo } from '../../utils/toolbox'

import Icon from "../basic/Icon"

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  icon: {
    height: 18,
    paddingHorizontal: 15,
  },
})

const HeaderIconButton = ({
  onPress,
  uiStatus,
  style,

  themedStyle,

  ...otherProps
}) => {

  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.container}
      disabled={uiStatus === `disabled`}
    >
      <Icon
        style={[
          styles.icon,
          themedStyle,
          style,
        ]}
        uiStatus={uiStatus}
        {...otherProps}
      />
    </TouchableOpacity>
  )

}

export default memo(HeaderIconButton, { name: 'HeaderIconButton' })
