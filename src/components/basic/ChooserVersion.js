import React, { useCallback } from "react"
import { View, Text, StyleSheet, TouchableHighlight } from "react-native"
import { styled } from "@ui-kitten/components"

import useThemedStyleSets from "../../hooks/useThemedStyleSets"
import { getVersionInfo } from "../../utils/toolbox"

import Icon from "./Icon"


const styles = StyleSheet.create({
  version: {
    borderRadius: 20,
    paddingLeft: 18,
    paddingRight: 18,
  },
  versionText: {
    lineHeight: 40,
  },
  versionTextContainer: {
    flexDirection: 'row',
  },
  closeIcon: {
    fontSize: 15,
    lineHeight: 40,
    marginLeft: 10,
  },
})

const ChooserVersion = React.memo(({
  versionId,
  onPress,
  selected,
  showCloseIcon,
  style,
  labelStyle,
  iconStyle,

  themedStyle,
}) => {
  const { baseThemedStyle, labelThemedStyle, iconThemedStyle } = useThemedStyleSets(themedStyle)

  const goPress = useCallback(
    () => onPress(versionId),
    [ onPress, versionId ],
  )

  return (
    <TouchableHighlight
      underlayColor="rgba(0, 0, 0, .2)"  // this just darkens the item when first touched
      onPress={goPress}
      style={[
        styles.version,
        baseThemedStyle,
        style,
      ]}
    >
      <View style={styles.versionTextContainer}>
        <Text
          style={[
            styles.versionText,
            labelThemedStyle,
            labelStyle,
          ]}
        >
          {getVersionInfo(versionId).abbr}
        </Text>
        {!!showCloseIcon &&
          <Icon
            name="md-close"
            style={[
              styles.closeIcon,
              iconThemedStyle,
              iconStyle,
            ]}
          />
        }
      </View>
    </TouchableHighlight>
  )

})

ChooserVersion.styledComponentName = 'ChooserVersion'

export default styled(ChooserVersion)