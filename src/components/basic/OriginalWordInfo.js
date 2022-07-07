import React, { useState, useCallback, useLayoutEffect } from "react"
import { StyleSheet, View, Text } from "react-native"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"
import { i18n } from "inline-i18n"
import { getMorphInfo } from "@bibletags/bibletags-ui-helper"

import useDefinition from "../../hooks/useDefinition"
import useBibleVersions from "../../hooks/useBibleVersions"
import { memo } from "../../utils/toolbox"

import Parsing from "./Parsing"
import Definition from "./Definition"
import TranslationsOfWordInMyVersions from "./TranslationsOfWordInMyVersions"
import ExtendedDefinition from "./ExtendedDefinition"
import TranslationBreakdown from "./TranslationBreakdown"

const minWordAndParsingHeight = 60

const styles = StyleSheet.create({
  container: {
    justifyContent: 'flex-end',
  },
  containerSelfContained: {
  },
  wordAndParsing: {
    marginTop: -15,
    paddingBottom: 15,
    paddingHorizontal: 18,
    minHeight: minWordAndParsingHeight,
    justifyContent: 'flex-end',
  },
  wordAndParsingSelfContained: {
    marginTop: 0,
    minHeight: 0,
    paddingVertical: 15,
  },
  noPaddingTop: {
    paddingTop: 0,
  },
  translationAndParsingScrollView: {
  },
  horizontalContainer: {
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
    paddingBottom: 50,
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
  wordId,
  onLayout,
  doIPhoneBuffer=false,
  originalLoc,
  hideEditTagIcon,
  extendedHeight,
  noPaddingTop,

  eva: { style: themedStyle={} },

  myBibleVersions,
}) => {

  extendedHeight = Math.min(220, extendedHeight)

  const [ showExtended, setShowExtended ] = useState(false)
  const toggleShowExtended = useCallback(() => setShowExtended(!showExtended), [ showExtended ])
  const adjShowExtended = showExtended && extendedHeight > 150

  const { downloadedNonOriginalVersionIds } = useBibleVersions({ myBibleVersions })
  const versionId = downloadedNonOriginalVersionIds[0]

  const definitionId = (strong.match(/[GH][0-9]{5}/) || [])[0] || strong

  const { definition } = useDefinition({
    definitionId,
    versionId,
    myBibleVersions,
  })
  const { id, lex, vocal, hits, lemmas, forms, pos, gloss, lexEntry, syn, rel, breakdown, lxx } = definition

  const { morphPos } = getMorphInfo(morph)

  if(!morph) {
    return (
      <View
        style={[
          styles.noCorrespondingContainer,
        ]}
        onLayout={onLayout}
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
        styles.containerSelfContained,
      ]}
    >
      <View onLayout={onLayout}>

        <View
          style={[
            styles.wordAndParsing,
            styles.wordAndParsingSelfContained,
            noPaddingTop ? styles.noPaddingTop : null,
          ]}
        >

          {!!originalLoc &&
            <TranslationsOfWordInMyVersions
              wordId={wordId}
              originalLoc={originalLoc}
              originalLanguage={/^G/.test(definitionId) ? `greek` : `hebrew`}
              downloadedNonOriginalVersionIds={downloadedNonOriginalVersionIds}
              hideEditTagIcon={hideEditTagIcon}
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
              showExtended={adjShowExtended}
              // showExtendedOption={extendedHeight > 150}
              showExtendedOption={false}
              toggleShowExtended={toggleShowExtended}
              doIPhoneBuffer={showExtended ? false : doIPhoneBuffer}
            />

            {adjShowExtended &&
              <ExtendedDefinition
                lexEntry={lexEntry}
                syn={syn}
                rel={rel}
                lemmas={lemmas}
                morphLemma={lemma}
                forms={forms}
                doIPhoneBuffer={doIPhoneBuffer}
                height={extendedHeight}
              />
            }

          </View>

          {adjShowExtended &&
            <TranslationBreakdown
              breakdown={breakdown}
              lxx={lxx}
            />
          }

        </View>

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