import React, { useState, useCallback, useLayoutEffect } from "react"
import { StyleSheet, View, Text } from "react-native"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"
import { i18n } from "inline-i18n"

import useDefinition from "../../hooks/useDefinition"
import useBibleVersions from "../../hooks/useBibleVersions"
import { getMorphInfo, memo } from "../../utils/toolbox"
import { getIPhoneXBufferHeight } from "./IPhoneXBuffer"

import Parsing from "./Parsing"
import Definition from "./Definition"
import TranslationsOfWordInMyVersions from "./TranslationsOfWordInMyVersions"
import ExtendedDefinition from "./ExtendedDefinition"
import TranslationBreakdown from "./TranslationBreakdown"

const minWordAndParsingHeight = 60

const styles = StyleSheet.create({
  container: {
  },
  wordAndParsing: {
    marginTop: -15,
    paddingBottom: 15,
    paddingHorizontal: 18,
    minHeight: minWordAndParsingHeight,
    justifyContent: 'flex-end',
  },
  translationAndParsingScrollView: {
  },
  horizontalContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  leftSide: {
    flex: 1,
  },
  definitionScrollView: {
  },
  noCorrespondingContainer: {
    justifyContent: 'center',
    paddingHorizontal: 50,
    paddingBottom: 20,
  },
  noCorresponding: {
    textAlign: 'center',
    fontStyle: 'italic',
  },
})

const OriginalWordInfo = ({
  morph=``,
  strong=``,
  lemma=``,
  onSizeChange,
  doIPhoneBuffer=false,
  translationsOfWordInMyVersions,

  eva: { style: themedStyle={} },

  myBibleVersions,
}) => {

  const [ showExtended, setShowExtended ] = useState(false)
  const toggleShowExtended = useCallback(() => setShowExtended(!showExtended), [ showExtended ])
  const height = (showExtended ? 250 : minWordAndParsingHeight + 63) + getIPhoneXBufferHeight({ extraSpace: true })

  const { versionIds } = useBibleVersions({ myBibleVersions })
  const versionId = versionIds.find(versionId => versionId !== 'original')

  const definitionId = (strong.match(/[GH][0-9]{5}/) || [])[0] || strong

  const { definition } = useDefinition({
    definitionId,
    versionId,
    myBibleVersions,
  })
  const { id, lex, vocal, hits, lemmas, forms, pos, gloss, lexEntry, syn, rel, breakdown, lxx } = definition

  const { morphPos } = getMorphInfo(morph)

  useLayoutEffect(
    () => {
      onSizeChange(0, height)
    },
    [ height ],
  )

  // const translationsOfWordInMyVersions = useTranslationsOfWordInMyVersions({
  //   wordId,
  //   wordPartNumber,
  //   originalLoc: getLocFromRef(ref),
  //   myBibleVersions,
  // })

  if(!morph) {
    return (
      <View
        style={[
          styles.noCorrespondingContainer,
          { height },
        ]}
      >
        <Text style={styles.noCorresponding}>
          {i18n("This word has no corresponding original language word.")}
        </Text>
      </View>
    )
  }

  return (
    <View
      style={[
        styles.container,
        { height },
      ]}
    >

      <View
        style={styles.wordAndParsing}
      >

        {translationsOfWordInMyVersions &&
          <TranslationsOfWordInMyVersions
            translationsOfWordInMyVersions={translationsOfWordInMyVersions}
          />
        }

        <Parsing
          morph={morph}
          strong={strong}
        />

      </View>

      <View
        style={[
          styles.horizontalContainer,
          themedStyle,
        ]}
      >
        <View style={styles.leftSide}>

          <Definition
            id={id}
            lex={lex}
            vocal={vocal}
            hits={hits}
            pos={pos}
            gloss={gloss}
            morphPos={morphPos}
            showExtended={showExtended}
            toggleShowExtended={toggleShowExtended}
            doIPhoneBuffer={showExtended ? false : doIPhoneBuffer}
          />

          {showExtended &&
            <ExtendedDefinition
              lexEntry={lexEntry}
              syn={syn}
              rel={rel}
              lemmas={lemmas}
              morphLemma={lemma}
              forms={forms}
              doIPhoneBuffer={doIPhoneBuffer}
            />
          }

        </View>

        {showExtended &&
          <TranslationBreakdown
            breakdown={breakdown}
            lxx={lxx}
          />
        }

      </View>

    </View>
  )

}

const mapStateToProps = ({ myBibleVersions }) => ({
  myBibleVersions,
})

const matchDispatchToProps = dispatch => bindActionCreators({
}, dispatch)

export default memo(connect(mapStateToProps, matchDispatchToProps)(OriginalWordInfo), { name: 'OriginalWordInfo' })