import React, { useCallback } from "react"
import { StyleSheet, View, Text, TouchableOpacity } from "react-native"
import { i18n } from "inline-i18n"
import useRouterState from "../../hooks/useRouterState"

import { memo } from "../../utils/toolbox"
import useThemedStyleSets from "../../hooks/useThemedStyleSets"

const styles = StyleSheet.create({
  container: {
    paddingTop: 0,
    paddingBottom: 35,
    paddingHorizontal: 50,
  },
  firstLine: {
    paddingBottom: 2,
    textAlign: 'center'
  },
  secondLine: {
    flexDirection: "row",
    justifyContent: "center",
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
  tagSet={},
  iHaveSubmittedATagSet,
  wordNotYetTagged,
  onLayout,

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

  const notTagged = [ undefined, 'none' ].includes(tagSet.status)
  const partiallyTagged = tagSet.status === 'automatch'
  const unconfirmedTags = tagSet.status === 'unconfirmed'
  const confirmedTags = tagSet.status === 'confirmed'
  wordNotYetTagged = !!wordNotYetTagged

  return (
    <View
      style={[
        styles.container,
        baseThemedStyle,
      ]}
      onLayout={onLayout}
    >

      <Text
        style={[
          styles.firstLine,
          labelThemedStyle,
        ]}
      >

        {notTagged && i18n("Not yet tagged.")}
        {partiallyTagged && i18n("Partially tagged.")}
        {unconfirmedTags && i18n("Contains unconfirmed tags.")}
        {confirmedTags && i18n("Tap a word in the translation or original to see its parsing and definition.")}
        {wordNotYetTagged && i18n("This word is not yet tagged.")}

      </Text>

      {!confirmedTags &&
        <View style={styles.secondLine}>
          {!iHaveSubmittedATagSet &&
            <Text
              style={[
                styles.label,
                labelThemedStyle,
              ]}
            >
              {passage.ref.bookId <= 39 ? i18n("Know Hebrew?") : i18n("Know Greek?")}
              {` `}
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
              {!iHaveSubmittedATagSet && (notTagged || partiallyTagged) && i18n("Help us tag it")}
              {!iHaveSubmittedATagSet && (unconfirmedTags || wordNotYetTagged) && i18n("Tag this verse")}
            </Text>
          </TouchableOpacity>
        </View>
      }

    </View>
  )

}

export default memo((NotYetTagged), { name: 'NotYetTagged' })
