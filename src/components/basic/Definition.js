import React, { useMemo } from "react"
import { StyleSheet, View, Text, I18nManager } from "react-native"
import { i18n } from "inline-i18n"
import { getGreekPOSTerm, getHebrewPOSTerm } from "@bibletags/bibletags-ui-helper"

import { memo } from "../../utils/toolbox"
import useThemedStyleSets from "../../hooks/useThemedStyleSets"

const styles = StyleSheet.create({
  container: {
    paddingVertical: 15,
    paddingHorizontal: 18,
  },
  line: {
    paddingVertical: 2,
  },
  lex: {
    fontSize: 16,
  },
  vocal: {
    fontSize: 14,
  },
  strongsHash: {
    fontWeight: '300',
    fontSize: 14,
  },
  strongs: {
    fontSize: 14,
  },
  num: {
  },
  definition: {
    fontWeight: '600',
    fontSize: 14,
  },
  pos: {
    fontSize: 14,
  },
})

const Definition = ({
  id,
  lex,
  vocal,
  hits,
  pos=[],
  gloss,
  morphPos,
  onLayout,

  eva: { style: themedStyle={} },
}) => {

  const { baseThemedStyle, altThemedStyleSets } = useThemedStyleSets(themedStyle)
  const [
    lexThemedStyle={},
    vocalThemedStyle={},
    strongsHashThemedStyle={},
    strongsThemedStyle={},
    numThemedStyle={},
    definitionThemedStyle={},
    posThemedStyle={},
    selectedPosThemedStyle={},
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
        <Text
          style={[
            styles.vocal,
            vocalThemedStyle,
          ]}
        >
          {vocal}
        </Text>
        {`  `}
        <Text
          style={[
            styles.strongsHash,
            strongsHashThemedStyle,
          ]}
        >
          #
        </Text>
        <Text
          style={[
            styles.strongs,
            strongsThemedStyle,
          ]}
        >
          {id}
        </Text>
        {`  `}
        <Text
          style={[
            styles.num,
            numThemedStyle,
          ]}
        >
          {i18n("{{hits}}x", { hits })}
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
          {gloss}
        </Text>
        {`  `}
        {pos.map((posAbbr, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && ` `}
            <Text
              style={[
                styles.pos,
                (posAbbr === morphPos ? selectedPosThemedStyle : posThemedStyle),
              ]}
            >
              {/^G/.test(id) ? getGreekPOSTerm(posAbbr) : getHebrewPOSTerm(posAbbr)}
            </Text>
          </React.Fragment>
        ))}
      </Text>
    </View>
  )

}

export default memo(Definition, { name: 'Definition' })