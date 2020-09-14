import React, { useMemo } from "react"
import { StyleSheet, View, Text, I18nManager } from "react-native"

import { isIPhoneX, memo } from "../../utils/toolbox"
import useThemedStyleSets from "../../hooks/useThemedStyleSets"

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    paddingVertical: 15,
    paddingHorizontal: 18,
    ...(!isIPhoneX ? {} : {
      paddingBottom: 30,
    }),
  },
  line: {
    paddingBottom: 5,
  },
  lemma: {
    fontSize: 24,
  },
  transliteration: {
    fontSize: 14,
  },
  strongs: {
    fontWeight: '600',
    fontSize: 17,
  },
  num: {
  },
  definition: {
    fontWeight: 'bold',
    fontSize: 17,
  },
  pos: {
    fontSize: 17,
  },
})

const Definition = ({
  selectedWordInfo,

  themedStyle,
}) => {

  const { lemma, strong, morph } = selectedWordInfo || {}

  const { baseThemedStyle, altThemedStyleSets } = useThemedStyleSets(themedStyle)
  const [
    lemmaThemedStyle={},
    transliterationThemedStyle={},
    strongsThemedStyle={},
    numThemedStyle={},
    definitionThemedStyle={},
    posThemedStyle={},
  ] = altThemedStyleSets

  const lemmaStyle = useMemo(
    () => ([
      styles.lemma,
      {
        fontFamily: `original-${/G/.test(strong) ? `grk` : `heb`}`,
      },
    ]),
    [ strong ],
  )

  const strongs = strong
    // .split('-')[0]  // get rid of -eng or the like
    .replace(/^.*:/, '')  // get rid of prefix
    .replace(/^G0+/, 'G')  // get rid of leading zeros

  return (
    <View
      style={[
        styles.container,
        baseThemedStyle,
      ]}
    >
      <Text style={styles.line}>
        <Text
          style={[
            lemmaStyle,
            lemmaThemedStyle,
          ]}
        >
          {I18nManager.isRTL ? `\u2067`: `\u2066`}
          {lemma}
        </Text>
        {`  `}
        <Text
          style={[
            styles.transliteration,
            transliterationThemedStyle,
          ]}
        >
          transliteration
        </Text>
        {`  `}
        <Text
          style={[
            styles.strongs,
            strongsThemedStyle,
          ]}
        >
          {strongs}
        </Text>
        {`  `}
        <Text
          style={[
            styles.num,
            numThemedStyle,
          ]}
        >
          314x
        </Text>
      </Text>
      <Text
          style={[
            styles.line,
          ]}
        >
        <Text
          style={[
            styles.definition,
            definitionThemedStyle,
          ]}
        >
          Boy
        </Text>
        {`  `}
        <Text
          style={[
            styles.pos,
            posThemedStyle,
          ]}
        >
          noun
        </Text>
      </Text>
    </View>
  )

}

export default memo(Definition, { name: 'Definition' })