import React, { useMemo } from "react"
import { StyleSheet, View, Text, I18nManager } from "react-native"

import { isIPhoneX } from "../../utils/toolbox"

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#888888',
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
    color: '#444444',
    fontSize: 14,
  },
  strongs: {
    fontWeight: '600',
    fontSize: 17,
  },
  num: {
    color: '#444444',
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
}) => {

  const { lemma, strong, morph } = selectedWordInfo || {}

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
    <View style={styles.container}>
      <Text style={styles.line}>
        <Text style={lemmaStyle}>
          {I18nManager.isRTL ? `\u2067`: `\u2066`}
          {lemma}
        </Text>
        {`  `}
        {/* <Text style={styles.transliteration}>
          transliteration
        </Text> */}
        {`  `}
        <Text style={styles.strongs}>
          {strongs}
        </Text>
        {/* {`  `}
        <Text style={styles.num}>
          314x
        </Text> */}
      </Text>
      {/* <Text style={styles.line}>
        <Text style={styles.definition}>
          Boy
        </Text>
        {`  `}
        <Text style={styles.pos}>
          noun
        </Text>
      </Text> */}
    </View>
  )

}

export default Definition