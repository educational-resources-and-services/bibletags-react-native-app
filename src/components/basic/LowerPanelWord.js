import React from "react"
import { StyleSheet, View } from "react-native"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"

import useDefinition from "../../hooks/useDefinition"
import useBibleVersions from "../../hooks/useBibleVersions"
import { getMorphInfo, memo } from "../../utils/toolbox"

import Parsing from "./Parsing"
import Definition from "./Definition"
import TranslationsOfWordInMyVersions from "./TranslationsOfWordInMyVersions"
import OriginalWordBehindTranslation from "./OriginalWordBehindTranslation"
import ExtendedDefinition from "./ExtendedDefinition"
import TranslationBreakdown from "./TranslationBreakdown"
import IPhoneXBuffer from "./IPhoneXBuffer"

const styles = StyleSheet.create({
  wordAndParsing: {
    paddingVertical: 15,
    paddingHorizontal: 18,
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
})

const LowerPanelWord = ({
  morph=``,
  strong=``,
  lemma=``,
  onSizeChangeFunctions,
  translationsOfWordInMyVersions,  // optional (sent by LowerPanelTranslationWord)
  originalWordsInfo,  // optional (sent by LowerPanelOriginalWord)
  setSelectedWordIdx,  // optional (sent by LowerPanelOriginalWord)
  selectedWordIdx,  // optional (sent by LowerPanelOriginalWord)
  versionId,  // optional

  eva: { style: themedStyle={} },

  myBibleVersions,
}) => {

  const { versionIds } = useBibleVersions({ myBibleVersions })
  versionId = versionIds.find(versionId => versionId !== 'original')

  const definitionId = (strong.match(/[GH][0-9]{5}/) || [])[0] || strong

  const { definition } = useDefinition({
    definitionId,
    versionId,
    myBibleVersions,
  })
  const { id, lex, vocal, hits, lemmas, forms, pos, gloss, lexEntry, syn, rel, breakdown, lxx } = definition

  const { morphPos } = getMorphInfo(morph)

  return (
    <>

      <View
        style={styles.wordAndParsing}
        onLayout={onSizeChangeFunctions[0]}
      >

        {translationsOfWordInMyVersions &&
          <TranslationsOfWordInMyVersions
            translationsOfWordInMyVersions={translationsOfWordInMyVersions}
          />
        }

        {originalWordsInfo &&
          <OriginalWordBehindTranslation
            originalWordsInfo={originalWordsInfo}
            selectedWordIdx={selectedWordIdx}
            setSelectedWordIdx={setSelectedWordIdx}
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
            onLayout={onSizeChangeFunctions[1]}
          />

          <ExtendedDefinition
            lexEntry={lexEntry}
            syn={syn}
            rel={rel}
            lemmas={lemmas}
            morphLemma={lemma}
            forms={forms}
            onContentSizeChange={onSizeChangeFunctions[2]}
          />

          <IPhoneXBuffer
            extraSpace={true}
            onLayout={onSizeChangeFunctions[3]}
          />

        </View>

        <TranslationBreakdown
          breakdown={breakdown}
          lxx={lxx}
        />

      </View>

    </>
  )

}

const mapStateToProps = ({ myBibleVersions }) => ({
  myBibleVersions,
})

const matchDispatchToProps = dispatch => bindActionCreators({
}, dispatch)

export default memo(connect(mapStateToProps, matchDispatchToProps)(LowerPanelWord), { name: 'LowerPanelWord' })