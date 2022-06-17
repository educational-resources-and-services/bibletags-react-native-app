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
  onSizeChangeFunctions,
  doIPhoneBuffer=false,
  translationsOfWordInMyVersions=[],
  originalLoc,
  hideEditTagIcon,
  extendedHeight,

  eva: { style: themedStyle={} },

  myBibleVersions,
}) => {

  extendedHeight = Math.min(220, extendedHeight)

  const [ showExtended, setShowExtended ] = useState(false)
  const toggleShowExtended = useCallback(() => setShowExtended(!showExtended), [ showExtended ])
  const height = minWordAndParsingHeight + 63 + (showExtended ? extendedHeight : 0)
  const adjShowExtended = showExtended && extendedHeight > 150

  const { downloadedVersionIds } = useBibleVersions({ myBibleVersions })
  const versionId = downloadedVersionIds.find(versionId => versionId !== 'original')

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
      onSizeChange && onSizeChange(0, height)
    },
    [ height ],
  )

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
        (onSizeChange ? { height } : styles.containerSelfContained),
      ]}
    >

      <View
        style={[
          styles.wordAndParsing,
          (!onSizeChange ? styles.wordAndParsingSelfContained : null),
        ]}
        onLayout={onSizeChangeFunctions ? onSizeChangeFunctions[0] : null}
      >

        {!!originalLoc &&
          <TranslationsOfWordInMyVersions
            translationsOfWordInMyVersions={translationsOfWordInMyVersions}
            originalLoc={originalLoc}
            originalLanguage={/^G/.test(definitionId) ? `greek` : `hebrew`}
            downloadedVersionIds={downloadedVersionIds}
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
        onLayout={onSizeChangeFunctions ? onSizeChangeFunctions[1] : null}
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
  )

}

const mapStateToProps = ({ myBibleVersions }) => ({
  myBibleVersions,
})

const matchDispatchToProps = dispatch => bindActionCreators({
}, dispatch)

export default memo(connect(mapStateToProps, matchDispatchToProps)(OriginalWordInfo), { name: 'OriginalWordInfo' })