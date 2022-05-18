import React, { useCallback } from "react"
import { StyleSheet, View, Text, TouchableOpacity } from "react-native"
import { i18n } from "inline-i18n"
import useRouterState from "../../hooks/useRouterState"

import { memo } from "../../utils/toolbox"
import useThemedStyleSets from "../../hooks/useThemedStyleSets"

const styles = StyleSheet.create({
  container: {
    paddingTop: 0,
    paddingBottom: 15,
    paddingHorizontal: 50,
  },
  tapLine: {
    paddingBottom: 20,
    textAlign: 'center'
  },
  statusBox: {
    borderWidth: 1,
    borderRadius: 100,
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
    marginBottom: 10,
  },
  firstLine: {
    paddingBottom: 2,
    textAlign: 'center',
    fontSize: 12,
  },
  secondLine: {
    flexDirection: "row",
    justifyContent: "center",
  },
  label: {
    fontStyle: 'italic',
    fontSize: 12,
  },
  linkLike: {
    fontSize: 12,
    textDecorationLine: 'underline',
    alignSelf: "flex-end",
    paddingVertical: 10,
    marginVertical: -10,
  },
})

const NotYetTagged = ({
  passage,
  tagSet={},
  iHaveSubmittedATagSet,
  wordNotYetTagged,
  onLayout,

  eva: { style: themedStyle={} },
}) => {

  const { baseThemedStyle, labelThemedStyle, altThemedStyleSets } = useThemedStyleSets(themedStyle)
  const [
    linkThemedStyle={},
    statusThemedStyle={},
    statusBoxThemedStyle={},
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

  const notTagged = [ undefined, 'none' ].includes(tagSet.status)
  const partiallyTagged = tagSet.status === 'automatch'
  const unconfirmedTags = tagSet.status === 'unconfirmed'
  const confirmedTags = tagSet.status === 'confirmed'
  wordNotYetTagged = !!wordNotYetTagged

  const language = passage.ref.bookId <= 39 ? i18n("Hebrew") : i18n("Greek")

  return (
    <View
      style={[
        styles.container,
        baseThemedStyle,
      ]}
      onLayout={onLayout}
    >

      {!wordNotYetTagged &&
        <Text
          style={[
            styles.tapLine,
            labelThemedStyle,
          ]}
        >
          {!confirmedTags && !unconfirmedTags && i18n("Tap a {{language}} word to see its parsing and definition.", { language })}
          {(confirmedTags || unconfirmedTags) && i18n("Tap a word in the translation or original to see its parsing and definition.")}
        </Text>
      }

      {!confirmedTags &&
        <View
          style={[
            styles.statusBox,
            statusBoxThemedStyle,
          ]}
        >

          <Text
            style={[
              styles.firstLine,
              statusThemedStyle,
            ]}
          >

            {notTagged && i18n("Not yet tagged.")}
            {partiallyTagged && !wordNotYetTagged && i18n("Unconfirmed, partial tagging.")}
            {unconfirmedTags && i18n("Contains unconfirmed tags.")}
            {wordNotYetTagged && i18n("Word not yet tagged.")}

          </Text>

          <View style={styles.secondLine}>
            {!iHaveSubmittedATagSet &&
              <Text
                style={[
                  styles.label,
                  statusThemedStyle,
                ]}
              >
                {i18n("Know {{language}}?", { language })}
                {i18n(" ", "word separator")}
              </Text>
            }
            <TouchableOpacity
              onPress={goTag}
            >
              <Text
                style={[
                  styles.linkLike,
                  linkThemedStyle,
                ]}
              >
                {iHaveSubmittedATagSet && i18n("Retag this verse")}
                {!iHaveSubmittedATagSet && !wordNotYetTagged && (notTagged || partiallyTagged) && i18n("Help us tag it")}
                {!iHaveSubmittedATagSet && (unconfirmedTags || wordNotYetTagged) && i18n("Tag this verse")}
              </Text>
            </TouchableOpacity>
          </View>

        </View>
      }

    </View>
  )

}

export default memo((NotYetTagged), { name: 'NotYetTagged' })
