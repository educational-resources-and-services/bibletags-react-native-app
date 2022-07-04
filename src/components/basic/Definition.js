import React, { useCallback, useMemo } from "react"
import { StyleSheet, View, Text, I18nManager, TouchableOpacity } from "react-native"
import { i18n } from "inline-i18n"
import { getGreekPOSTerm, getHebrewPOSTerm } from "@bibletags/bibletags-ui-helper"

import { memo } from "../../utils/toolbox"
import useThemedStyleSets from "../../hooks/useThemedStyleSets"
import useRouterState from "../../hooks/useRouterState"

import Icon from "./Icon"
import IPhoneXBuffer from "./IPhoneXBuffer"

const styles = StyleSheet.create({
  container: {
  },
  innerContainer: {
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
    fontSize: 13,
  },
  strongs: {
    fontSize: 13,
  },
  num: {
    fontSize: 10,
  },
  definition: {
    fontWeight: '700',
    fontSize: 14,
  },
  pos: {
    fontSize: 14,
  },
  searchContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  search: {
    height: 20,
  },
  extendedInfoContainer: {
    position: 'absolute',
    bottom: 12,
    right: 12,
  },
  extendedInfo: {
    height: 20,
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
  showExtended,
  toggleShowExtended,
  iconStyle,
  doIPhoneBuffer,
  showExtendedOption=false,

  eva: { style: themedStyle={} },
}) => {

  const { historyGo, historyPush, pathname } = useRouterState()

  const { baseThemedStyle, altThemedStyleSets, iconThemedStyle } = useThemedStyleSets(themedStyle)
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

  const goSearch = useCallback(
    () => {
      const numStepsToGoBack = pathname.replace('/Read', '').split('/').slice(1).length
      if(numStepsToGoBack > 0) {
        historyGo(-numStepsToGoBack)
      }
      historyPush("/Read/Search", {
        searchText: `#${id}`,
      })
    },
    [ id, pathname ],
  )

  return (
    <View
      style={[
        styles.container,
        baseThemedStyle,
      ]}
      onLayout={onLayout}
    >

      <View style={styles.innerContainer}>

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

        <TouchableOpacity
          style={styles.searchContainer}
          onPress={goSearch}
        >
          <Icon
            name="md-search"
            style={[
              styles.search,
              iconThemedStyle,
              iconStyle,
            ]}
          />
        </TouchableOpacity>

        {showExtendedOption &&
          <TouchableOpacity
            style={styles.extendedInfoContainer}
            onPress={toggleShowExtended}
          >
            <Icon
              name={showExtended ? `md-information-circle` : `md-information-circle-outline`}
              style={[
                styles.extendedInfo,
                iconThemedStyle,
                iconStyle,
              ]}
            />
          </TouchableOpacity>
        }

      </View>

      {doIPhoneBuffer &&
        <IPhoneXBuffer
          extraSpace={true}
        />
      }

    </View>
  )

}

export default memo(Definition, { name: 'Definition' })