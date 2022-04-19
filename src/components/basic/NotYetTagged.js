import React, { useCallback } from "react"
import { StyleSheet, View, Text, TouchableOpacity } from "react-native"
import { i18n } from "inline-i18n"
import useRouterState from "../../hooks/useRouterState"

import { memo } from "../../utils/toolbox"
import useThemedStyleSets from "../../hooks/useThemedStyleSets"

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingTop: 14,
    paddingBottom: 8,
  },
  firstLine: {
    paddingBottom: 2,
  },
  secondLine: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  label: {
    fontStyle: 'italic',
  },
  linkLike: {
    textDecorationLine: 'underline',
    alignSelf: "flex-end",
  },
})

const NotYetTagged = ({
  passage,

  eva: { style: themedStyle={} },
}) => {

  const { baseThemedStyle, labelThemedStyle, altThemedStyleSets } = useThemedStyleSets(themedStyle)
  const [
    linkThemedStyle={},
  ] = altThemedStyleSets

  const { historyPush } = useRouterState()

  const goTag = useCallback(
    () => {
      historyPush("/Read/VerseTagger", {
        passage,
      })
    },
    [ historyPush, passage ],
  )

  return (
    <View
      style={[
        styles.container,
        baseThemedStyle,
      ]}
    >

      <Text
        style={[
          styles.firstLine,
          labelThemedStyle,
        ]}
      >
        {i18n("Not yet tagged.")}
      </Text>

      <View style={styles.secondLine}>
        <Text
          style={[
            styles.label,
            labelThemedStyle,
          ]}
        >
          {passage.ref.bookId <= 39 ? i18n("Know Hebrew?") : i18n("Know Greek?")}
          {` `}
        </Text>
        <TouchableOpacity
          onPress={goTag}
        >
          <Text
            style={[
              styles.linkLike,
              linkThemedStyle,
            ]}
          >
            {i18n("Help us tag it")}
          </Text>
        </TouchableOpacity>
      </View>

    </View>
  )

}

export default memo((NotYetTagged), { name: 'NotYetTagged' })
