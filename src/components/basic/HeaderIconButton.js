import React from "react"
import { StyleSheet, TouchableOpacity } from "react-native"

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

const HeaderIconButton = React.memo(({
  onPress,
  style,
  ...otherProps
}) => {

  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.container}
    >
      <Icon
        style={[
          styles.icon,
          style,
        ]}
        {...otherProps}
      />
    </TouchableOpacity>
  )

})

export default HeaderIconButton
