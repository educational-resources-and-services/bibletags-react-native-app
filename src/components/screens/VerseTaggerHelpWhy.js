import React, { useCallback } from "react"
import { StyleSheet, ScrollView, View, Text, Image, Linking } from "react-native"
import { i18n } from "inline-i18n"
import { Button } from "@ui-kitten/components"

import { memo, sentry } from "../../utils/toolbox"
import useThemedStyleSets from "../../hooks/useThemedStyleSets"
import useRouterState from "../../hooks/useRouterState"

import InlineLink from "../basic/InlineLink"

const fontSize = 15

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
  imageContainer: {
    marginTop: 20,
  },
  imageShade: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,.3)',
  },
  image: {
    width: '100%',
    height: 0,
    paddingBottom: '55%',
    resizeMode: 'cover',
  },
  visionContainer: {
    position: 'absolute',
  },
  visionHeading: {
    paddingTop: 15,
    paddingBottom: 10,
    paddingHorizontal: 20,
    color: 'white',
    fontSize: 20,
    fontWeight: '200',
    maxHeight: 65,
  },
  vision: {
    paddingHorizontal: 20,
    color: 'white',
    fontSize: 16,
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
  button: {
    marginTop: 25,
    marginBottom: 10,
  },
})

const VerseTaggerHelpWhy = ({
  setHelpIndex,
  style,

  eva: { style: themedStyle={} },
}) => {

  const { labelThemedStyle } = useThemedStyleSets(themedStyle)
  const { historyPush } = useRouterState()

  const goToNextHelpIndex = useCallback(() => setHelpIndex(1), [ setHelpIndex ])

  const joinMailingList = useCallback(
    () => {
      Linking.openURL(`https://bibletags.org/newsletters`).catch(err => {
        sentry({ error })
        historyPush("/ErrorMessage", {
          message: i18n("Your device is not allowing us to open this link."),
        })
      })
    },
    [],
  )

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.body}
    >

      <View style={styles.imageContainer}>
        <Image
          source={require('../../../assets/images/globe.jpeg')}
          style={styles.image}
        />
        <View style={styles.imageShade} />
        <View style={styles.visionContainer}>
          <Text
            style={styles.visionHeading}
            adjustsFontSizeToFit
            numberOfLines={1}
          >
            {i18n("Our Vision")}
          </Text>
          <Text
            style={styles.vision}
            adjustsFontSizeToFit
            numberOfLines={5}
          >
            {i18n("It is our goal to see every Christian worldwide with free access to the Bible, tagged to the original Hebrew, Aramaic, and Greek, with parsing and lexical information—all in their own language.")}
          </Text>
        </View>
      </View>
      <Text style={styles.p}>
        {i18n("By connecting words between the original languages and a translation (what we call “tagging”), you help us achieve this aim.")}
        {i18n(" ", "word separator")}
        {i18n("And the more people who tag, the better tagging data becomes.")}
        {i18n(" ", "word separator")}
        {i18n("So we invite you to tag often!")}
      </Text>
      <Text style={styles.p}>
        {i18n("Our server will take this data and automatically produce the following in the language of the tagged translation:")}
      </Text>
      <Text style={styles.li}>
        {i18n("1.")}
        {i18n(" ", "word separator")}
        {i18n("A gloss for each original language word")}
      </Text>
      <Text style={styles.li}>
        {i18n("2.")}
        {i18n(" ", "word separator")}
        {i18n("An in-depth lexical entry outlining usage")}
      </Text>
      <Text style={styles.li}>
        {i18n("3.")}
        {i18n(" ", "word separator")}
        {i18n("The ability for users to easily check the original language word behind every word in every verse")}
      </Text>
      <Text style={styles.li}>
        {i18n("4.")}
        {i18n(" ", "word separator")}
        {i18n("A powerful, integrated search")}
        {i18n(" ", "word separator")}
        <InlineLink
          label={i18n("learn more")}
          url="https://bibletags.org/blog-post/a-powerful-integrated-bible-search-in-every-language"
          fontSize={fontSize}
        />
      </Text>

      <Text
        style={[
          styles.heading,
          labelThemedStyle,
        ]}
      >
        {i18n("Two Ways to Contribute Tags")}
      </Text>
      <Text style={styles.p}>
        {i18n("First, as you study a passage, you may notice a message indicating that a verse is yet untagged or unconfirmed.")}
        {i18n(" ", "word separator")}
        {i18n("Take a minute to tag that verse.")}
      </Text>
      <Text style={styles.p}>
        {i18n("Second, you may want to volunteer a chunk of time to tag whichever verses need tagging.")}
        {i18n(" ", "word separator")}
        {i18n("Do so by opening the main menu and tapping “Tag Hebrew verses” or “Tag Greek verses.”")}
      </Text>

      <Button
        style={styles.button}
        onPress={goToNextHelpIndex}
      >
        {i18n("Next: Learn how to tag")}
      </Button>

      <Button
        onPress={joinMailingList}
        appearance='ghost'
      >
        {i18n("Sign up for the Bible Tags mailing list")}
      </Button>

    </ScrollView>
  )

}

export default memo(VerseTaggerHelpWhy, { name: 'VerseTaggerHelpWhy' })
