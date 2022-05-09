import React, { useMemo } from "react"
import { StyleSheet, View, Text, I18nManager } from "react-native"

import { memo } from "../../utils/toolbox"
import useThemedStyleSets from "../../hooks/useThemedStyleSets"

const styles = StyleSheet.create({
  container: {
    paddingVertical: 15,
    paddingHorizontal: 18,
  },
  line: {
    paddingBottom: 5,
  },
  lex: {
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
  id,
  lex,
  vocal,
  hits,
  pos,
  gloss,
  morphPos,
  onLayout,

  eva: { style: themedStyle={} },
}) => {

  const { baseThemedStyle, altThemedStyleSets } = useThemedStyleSets(themedStyle)
  const [
    lexThemedStyle={},
    transliterationThemedStyle={},
    strongsThemedStyle={},
    numThemedStyle={},
    definitionThemedStyle={},
    posThemedStyle={},
  ] = altThemedStyleSets

  const lexStyle = useMemo(
    () => ([
      styles.lex,
      {
        fontFamily: `original-${/G/.test(id) ? `grk` : `heb`}`,
      },
    ]),
    [ id ],
  )

  return (
    <View
      style={[
        styles.container,
        baseThemedStyle,
      ]}
      onLayout={onLayout}
    >
      <Text style={styles.line}>
        <Text
          style={[
            lexStyle,
            lexThemedStyle,
          ]}
        >
          {I18nManager.isRTL ? `\u2067`: `\u2066`}
          {lex}
        </Text>
        {`  `}
        {/* <Text
          style={[
            styles.transliteration,
            transliterationThemedStyle,
          ]}
        >
          transliteration
        </Text> */}
        {`  `}
        <Text
          style={[
            styles.strongs,
            strongsThemedStyle,
          ]}
        >
          {id}
        </Text>
        {/* {`  `}
        <Text
          style={[
            styles.num,
            numThemedStyle,
          ]}
        >
          314x
        </Text> */}
      </Text>
      {/* <Text
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
      </Text> */}
    </View>
  )

}

export default memo(Definition, { name: 'Definition' })