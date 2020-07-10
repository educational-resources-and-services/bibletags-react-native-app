import React from "react"
import { StyleSheet, TouchableOpacity } from "react-native"
import { styled } from "@ui-kitten/components"

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

})

HeaderIconButton.styledComponentName = 'HeaderIconButton'

export default styled(HeaderIconButton)
