import React, { useCallback } from "react"
import { View, Text, StyleSheet, TouchableHighlight, Platform, Alert } from "react-native"
import { i18n } from "inline-i18n"

import useThemedStyleSets from "../../hooks/useThemedStyleSets"
import useNetwork from "../../hooks/useNetwork"
import { getVersionInfo, memo } from "../../utils/toolbox"

import Icon from "./Icon"
import CoverAndSpin from "./CoverAndSpin"


const styles = StyleSheet.create({
  version: {
    borderRadius: 20,
    paddingLeft: 18,
    paddingRight: 18,
  },
  versionText: {
  },
  versionTextContainer: {
    flexDirection: 'row',
    height: 40,
    alignItems: 'center',
  },
  closeIcon: {
    fontSize: 15,
    lineHeight: 40,
    marginLeft: 10,
  },
  spinBG: {
    backgroundColor: 'transparent',
    alignItems: 'flex-end',
  },
  spin: {
    left: 20,
    transform: [{
      scale: .5,
    }],
  },
})

const ChooserVersion = ({
  versionId,
  uiStatus,
  onPress,
  showCloseIcon,
  style,
  labelStyle,
  iconStyle,

  eva: { style: themedStyle={} },
}) => {

  const { baseThemedStyle, labelThemedStyle, iconThemedStyle } = useThemedStyleSets(themedStyle)

  const { online } = useNetwork()

  const goPress = useCallback(
    () => {
      if(uiStatus === 'disabled') {
        Alert.alert(
          online
            ? i18n("This version is still in the process of downloading.")
            : i18n("You are offline. This version will download next time you connect.")
        )
      } else {
        onPress(versionId)
      }
    },
    [ onPress, versionId, uiStatus, online ],
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
        {uiStatus === 'disabled' && online &&
          <CoverAndSpin
            style={styles.spinBG}
            spinStyle={styles.spin}
            size="small"
          />
        }
        <Text
          key={Platform.OS === 'android' && labelThemedStyle.color}  // TODO: remove this line when RN bug fixed
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

}

export default memo(ChooserVersion, { name: 'ChooserVersion' })