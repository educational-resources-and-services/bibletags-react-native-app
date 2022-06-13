import React, { useCallback } from "react"
import { StyleSheet, Text, Linking, TouchableOpacity, Platform } from "react-native"
import { i18n } from "inline-i18n"

import { memo, sentry } from "../../utils/toolbox"
import useRouterState from "../../hooks/useRouterState"
import Icon from "../basic/Icon"

const styles = StyleSheet.create({
  linkContainer: {
  },
  linkLike: {
    textDecorationLine: 'underline',
  },
  linkIcon: {
  },
})

const InlineLink = ({
  label,
  url,
  fontSize,
  style,

  eva: { style: themedStyle={} },
}) => {

  const { historyPush } = useRouterState()

  const goLink = useCallback(
    () => {
      Linking.openURL(url).catch(err => {
        sentry({ error })
        historyPush("/ErrorMessage", {
          message: i18n("Your device is not allowing us to open this link."),
        })
      })
    },
    [],
  )

  return (
    <TouchableOpacity onPress={goLink}>
      <Text
        style={[
          styles.linkContainer,
          themedStyle,
          {
            fontSize,
            top: fontSize / (Platform.OS === 'android' ? 3.5 : 5.5),
          },
          style,
        ]}
      >
        <Text
          style={[
            styles.linkLike,
          ]}
        >
          {label}
        </Text>
        {` `}
        <Icon
          name="md-open"
          style={[
            styles.linkIcon,
            { height: fontSize - 2 },
          ]}
        />
      </Text>
    </TouchableOpacity>
  )

}

export default memo(InlineLink, { name: 'InlineLink' })