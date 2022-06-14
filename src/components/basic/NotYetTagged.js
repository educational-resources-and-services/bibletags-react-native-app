import React, { useCallback } from "react"
import { StyleSheet, View, Text } from "react-native"
import { i18n } from "inline-i18n"
import { Button } from "@ui-kitten/components"

import { memo } from "../../utils/toolbox"
import useThemedStyleSets from "../../hooks/useThemedStyleSets"
import useRouterState from "../../hooks/useRouterState"

import Icon from "./Icon"

const styles = StyleSheet.create({
  container: {
    paddingTop: 0,
    paddingBottom: 15,
    paddingHorizontal: 20,
  },
  tapLine: {
    paddingBottom: 20,
    textAlign: 'center'
  },
  b: {
    fontWeight: '700',
  },
  status: {
    paddingBottom: 2,
    textAlign: 'center',
    fontSize: 12,
  },
  button: {
    alignSelf: 'center',
    marginBottom: 15,
    paddingTop: 8,
    paddingBottom: 10,
    minHeight: 0,
  },
  buttonQuestion: {
    fontStyle: 'italic',
    fontSize: 11,
    fontWeight: '200',
  },
  buttonAction: {
    fontSize: 11,
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
    noneIconThemedStyle={},
    partialIconThemedStyle={},
    unconfirmedIconThemedStyle={},
    confirmedIconThemedStyle={},
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
          {confirmedTags &&
            <>
              {` `}
              <Icon
                style={[
                  styles.icon,
                  confirmedIconThemedStyle,
                ]}
                pack="materialCommunity"
                name="check-all"
              />
            </>
          }
        </Text>
      }

      {!confirmedTags &&
        <>

          <Text style={styles.status}>

            <Text style={styles.b}>
              {i18n("Status:")}
            </Text>
            {i18n(" ", "word separator")}

            {notTagged && i18n("Not yet tagged.")}
            {partiallyTagged && !wordNotYetTagged && i18n("Unconfirmed, partial tagging.")}
            {unconfirmedTags && i18n("Contains unconfirmed tags.")}
            {wordNotYetTagged && i18n("Word not yet tagged.")}

            {` `}
            <Icon
              style={[
                styles.icon,
                notTagged ? noneIconThemedStyle : null,
                partiallyTagged ? partialIconThemedStyle : null,
                unconfirmedTags ? unconfirmedIconThemedStyle : null,
                wordNotYetTagged ? noneIconThemedStyle : null,
              ]}
              pack={(notTagged || wordNotYetTagged) ? "materialCommunity" : "ion"}
              name={
                (notTagged && "close-box-outline")
                || (partiallyTagged && !wordNotYetTagged && "md-warning")
                || (unconfirmedTags && "md-warning")
                || (wordNotYetTagged && "close-box-outline")
              }
            />

          </Text>

          <Button
            style={styles.button}
            status='basic'
            onPress={goTag}
          >
            {!iHaveSubmittedATagSet &&
              <Text style={styles.buttonQuestion}>
                {i18n("Know {{language}}?", { language })}
                {i18n(" ", "word separator")}
              </Text>
            }
            <Text style={styles.buttonAction}>
              {iHaveSubmittedATagSet && i18n("Retag this verse")}
              {!iHaveSubmittedATagSet && !wordNotYetTagged && (notTagged || partiallyTagged) && i18n("Help us tag it")}
              {!iHaveSubmittedATagSet && (unconfirmedTags || wordNotYetTagged) && i18n("Tag this verse")}
            </Text>
          </Button>

        </>
      }

    </View>
  )

}

export default memo((NotYetTagged), { name: 'NotYetTagged' })
