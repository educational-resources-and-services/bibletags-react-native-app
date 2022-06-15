import React, { useCallback } from "react"
import { StyleSheet, ScrollView, Text } from "react-native"
import { i18n } from "inline-i18n"
import { Button } from "@ui-kitten/components"

import { memo, removeIndentAndBlankStartEndLines } from "../../utils/toolbox"
import useThemedStyleSets from "../../hooks/useThemedStyleSets"

import InlineLink from "../basic/InlineLink"
import Icon from "../basic/Icon"

const fontSize = 15

const defaultReportMessage = removeIndentAndBlankStartEndLines(`
  I would like to report incorrect parsing or versification.

  The problem: [ describe here ]

  This relates to the following Bible versions: [ required ]

  This relates to the following verse(s): [ required ]
`)

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  body: {
    paddingBottom: 400,
    paddingHorizontal: 20,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  heading: {
    fontWeight: '700',
    fontSize,
    textAlign: 'left',
    marginTop: 20,
  },
  p: {
    marginTop: 15,
    fontSize,
  },
  li: {
    marginTop: 10,
    marginLeft: 10,
    fontSize,
  },
  liBold: {
    marginTop: 10,
    marginLeft: 10,
    fontSize,
    fontWeight: '700',
  },
  liFollowUp: {
    marginLeft: 10,
    fontStyle: 'italic',
    fontSize,
  },
  button: {
    marginVertical: 25,
  },
})

const VerseTaggerHelpHow = ({
  setHelpIndex,
  style,

  eva: { style: themedStyle={} },
}) => {

  const { labelThemedStyle, altThemedStyleSets } = useThemedStyleSets(themedStyle)
  const [
    noneIconThemedStyle={},
    partialIconThemedStyle={},
    unconfirmedIconThemedStyle={},
    confirmedIconThemedStyle={},
  ] = altThemedStyleSets

  const goToNextHelpIndex = useCallback(() => setHelpIndex(2), [ setHelpIndex ])

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.body}
    >

      {/* <Text>gif</Text> */}

      <Text
        style={[
          styles.heading,
          labelThemedStyle,
        ]}
      >
        {i18n("Basic Instructions")}
      </Text>
      <Text style={styles.li}>
        {i18n("1.")}
        {i18n(" ", "word separator")}
        {i18n("Short-tap an original language word, then all of its associated translation words. Repeat for the entire verse.")}
      </Text>
      <Text style={styles.li}>
        {i18n("2.")}
        {i18n(" ", "word separator")}
        {i18n("Long-press on original language words to select more than one at a time. Do this when multiple words correspond to the translation word(s).")}
      </Text>
      <Text style={styles.li}>
        {i18n("3.")}
        {i18n(" ", "word separator")}
        {i18n("Leave words untagged when an original word is not translated, or a translation word is supplied without an original word counterpart.")}
      </Text>
      <Text style={styles.li}>
        {i18n("4.")}
        {i18n(" ", "word separator")}
        {i18n("You will often find a number of words pre-tagged by our auto-tagger. You should check (and correct, when needed) these tags before submitting.")}
      </Text>

      <Text
        style={[
          styles.heading,
          labelThemedStyle,
        ]}
      >
        {i18n("Getting Help")}
      </Text>
      <Text style={styles.p}>
        {i18n("Tap an original language word a second time to see its parsing and/or gloss.")}
      </Text>

      <Text
        style={[
          styles.heading,
          labelThemedStyle,
        ]}
      >
        {i18n("Tagging Status")}
      </Text>
      <Text style={styles.p}>
        {i18n("Verses go through the following statuses as users contribute tags:")}
      </Text>
      <Text style={styles.liBold}>
        {i18n("1.")}
        {i18n(" ", "word separator")}
        {i18n("Not yet tagged.")}
        {` `}
        <Icon
          style={[
            styles.icon,
            noneIconThemedStyle,
          ]}
          pack="materialCommunity"
          name="close-box-outline"
        />
      </Text>
      <Text style={styles.liBold}>
        {i18n("2.")}
        {i18n(" ", "word separator")}
        {i18n("Unconfirmed, partial tagging.")}
        {` `}
        <Icon
          style={[
            styles.icon,
            partialIconThemedStyle,
          ]}
          name="md-warning"
        />
      </Text>
      <Text style={styles.liFollowUp}>
        {i18n("Part of this verse has been tagged using an auto-tagger algorithm.")}
      </Text>
      <Text style={styles.liBold}>
        {i18n("3.")}
        {i18n(" ", "word separator")}
        {i18n("Contains unconfirmed tags.")}
        {` `}
        <Icon
          style={[
            styles.icon,
            unconfirmedIconThemedStyle,
          ]}
          name="md-warning"
        />
      </Text>
      <Text style={styles.liFollowUp}>
        {i18n("At least one user has tagged this verse.")}
      </Text>
      <Text style={styles.liBold}>
        {i18n("4.")}
        {i18n(" ", "word separator")}
        {i18n("Confirmed.")}
        {` `}
        <Icon
          style={[
            styles.icon,
            confirmedIconThemedStyle,
          ]}
          pack="materialCommunity"
          name="check-all"
        />
      </Text>
      <Text style={styles.liFollowUp}>
        {i18n("Multiple users with a good tagging history have tagged this verse consistently.")}
      </Text>

      <Text
        style={[
          styles.heading,
          labelThemedStyle,
        ]}
      >
        {i18n("Advanced")}
      </Text>
      <Text style={styles.p}>
        {i18n("On rare occasions, a translation will be based on a textual variant not present in the base Hebrew or Greek text.")}
        {i18n(" ", "word separator")}
        We are working on a solution for this.
        {i18n(" ", "word separator")}
        For now, please leave such verses untagged.
      </Text>
      <Text style={styles.p}>
        <InlineLink
          label={i18n("Report")}
          url={`https://bibletags.org/contact?defaultMessage=${encodeURIComponent(defaultReportMessage)}`}
          fontSize={fontSize}
        />
        {i18n(" ", "word separator")}
        {i18n("incorrect parsing or versification. (Incorrect versification refers to when the original and translation are misaligned.)")}
      </Text>

      <Button
        style={styles.button}
        onPress={goToNextHelpIndex}
      >
        {i18n("Next: Learn the tagging rules")}
      </Button>

    </ScrollView>
  )

}

export default memo(VerseTaggerHelpHow, { name: 'VerseTaggerHelpHow' })
