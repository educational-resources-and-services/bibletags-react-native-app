import { useCallback } from 'react'
import { StyleSheet, View, Text } from "react-native"
import useToggle from "react-use/lib/useToggle"
import { i18n } from "inline-i18n"
import { i18nReact } from 'inline-i18n/build/i18nReact'
import { useWindowDimensions } from 'react-native'

import { memo } from '../../utils/toolbox'
import useThemedStyleSets from '../../hooks/useThemedStyleSets'

import SearchTabTipsDetailAccordion from './SearchTabTipsDetailAccordion'
import InlineLink from '../basic/InlineLink'
import { ScrollView } from 'react-native-gesture-handler'

const styles = StyleSheet.create({
  contentContainer: {
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 400,
    fontSize: 13,
    maxWidth: '100%',
    alignSelf: 'center',
  },
  tip: {
    marginVertical: 5,
  },
  tipTitle: {
    fontSize: 14,
    marginBottom: 3,
  },
  example: {
    marginVertical: 3,
    marginHorizontal: 7,
    alignSelf: 'flex-start',
    zIndex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  exampleIndicator: {
    fontSize: 12,
  },
  exampleContent: {
    borderRadius: 3,
    paddingVertical: 1,
    paddingHorizontal: 6,
    borderWidth: 1,
    overflow: 'hidden',
    fontSize: 12,
    marginHorizontal: 3,
  },
  exampleSecondLineExplanation: {
    marginLeft: 38,
    fontSize: 11,
  },
  noDetailsSpacer: {
    height: 7,
  },
  detail: {
    marginTop: 8,
    marginBottom: 4,
    fontSize: 12,
  },
  version: {
  },
  hashOrSlash: {
  },
  quotationMark: {
    color: 'rgb(40,174,39)',
  },
  dotOrPlaceholderStar: {
    color: 'rgb(40,174,39)',
  },
  parenthasesOrSlash: {
    color: 'rgb(15,106,186)',
  },
  star: {
    color: 'rgb(230,151,5)',
  },
  flag: {
  },
  noteAboutDetails: {
    fontSize: 11,
    marginTop: 7,
    fontStyle: 'italic',
  },
  finalNote: {
    // color: ${({ theme }) => theme.palette.grey[500]};
    fontSize: 12,
  },
  linkKeyBlock: {
    marginVertical: 3,
    marginHorizontal: 7,
    fontSize: 11,
  },
  navLink: {
    // color: ${({ theme }) => theme.palette.grey[500]};
  },
  greek: {
    fontFamily: `original-grc`,
  },
  hebrew: {
    fontFamily: `original-heb`,
  },
})

const SearchTabTips = ({
  eva: { style: themedStyle={} },
}) => {

  const { altThemedStyleSets } = useThemedStyleSets(themedStyle)
  const [
    tipTitleThemedStyle={},
    exampleIndicatorThemedStyle={},
    exampleContentThemedStyle={},
    detailThemedStyle={},
    versionThemedStyle={},
    hashOrSlashThemedStyle={},
    flagThemedStyle={},
    noteAboutDetailsThemedStyle={},
    finalNoteThemedStyle={},
  ] = altThemedStyleSets

  const { fontScale } = useWindowDimensions()

  const [ searchBibleWordExpanded, toggleSearchBibleWordExpanded ] = useToggle(false)
  const goToggleSearchBibleWordExpanded = useCallback(() => toggleSearchBibleWordExpanded(), [ toggleSearchBibleWordExpanded ])

  const [ searchOrigLangExpanded, toggleSearchOrigLangExpanded ] = useToggle(false)
  const goToggleSearchOrigLangExpanded = useCallback(() => toggleSearchOrigLangExpanded(), [ toggleSearchOrigLangExpanded ])

  const [ searchWordCombosExpanded, toggleSearchWordCombosExpanded ] = useToggle(false)
  const goToggleSearchWordCombosExpanded = useCallback(() => toggleSearchWordCombosExpanded(), [ toggleSearchWordCombosExpanded ])

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.contentContainer,
        { width: 400 * fontScale }
      ]}
    >

      <View style={styles.tip}>
        <Text style={[ styles.tipTitle, tipTitleThemedStyle ]}>
          {i18n("Look-up a passage")}
        </Text>
        <View style={styles.example}>
          <Text style={[ styles.exampleIndicator, exampleIndicatorThemedStyle ]}>
            {i18n("E.g.")}
          </Text>
          <Text style={[ styles.exampleContent, exampleContentThemedStyle ]}>
            {i18n("John 3")}
          </Text>
        </View>
        <View style={styles.example}>
          <Text style={[ styles.exampleIndicator, exampleIndicatorThemedStyle ]}>
            {i18n("E.g.")}
          </Text>
          <Text style={[ styles.exampleContent, exampleContentThemedStyle ]}>
            {i18nReact("1 John 1:9 {{version}}", {
              version: (
                <Text style={[ styles.version, versionThemedStyle ]}>
                  {i18n("NASB")}
                </Text>
              ),
            })}
          </Text>
        </View>
        <View style={styles.noDetailsSpacer} />
      </View>

      <View style={styles.tip}>
        <Text style={[ styles.tipTitle, tipTitleThemedStyle ]}>
          {i18n("Search the Bible for a word")}
        </Text>
        <View style={styles.example}>
          <Text style={[ styles.exampleIndicator, exampleIndicatorThemedStyle ]}>
            {i18n("E.g.")}
          </Text>
          <Text style={[ styles.exampleContent, exampleContentThemedStyle ]}>
            {i18n("love")}
          </Text>
        </View>
        <SearchTabTipsDetailAccordion
          expanded={searchBibleWordExpanded}
          uiStatus={searchBibleWordExpanded ? `expanded` : `collapsed`}
          onPress={goToggleSearchBibleWordExpanded}
          summary={i18n("Advanced")}
          details={
            <>
              <Text style={[ styles.detail, detailThemedStyle ]}>
                {i18n("Words that start a certain way")}
              </Text>
              <View style={styles.example}>
                <Text style={[ styles.exampleIndicator, exampleIndicatorThemedStyle ]}>
                  {i18n("E.g.")}
                </Text>
                <Text style={[ styles.exampleContent, exampleContentThemedStyle ]}>
                  {i18nReact("lov{{star}}", {
                    star: <Text style={styles.star}>*</Text>,
                  })}
                </Text>
                <Text style={[ styles.exampleIndicator, exampleIndicatorThemedStyle ]}>
                  {i18n("finds love, loves, loving, etc.")}
                </Text>
              </View>
              <Text style={[ styles.detail, detailThemedStyle ]}>
                {i18n("Specific version(s)")}
              </Text>
              <View style={styles.example}>
                <Text style={[ styles.exampleIndicator, exampleIndicatorThemedStyle ]}>
                  {i18n("E.g.")}
                </Text>
                <Text style={[ styles.exampleContent, exampleContentThemedStyle ]}>
                  {i18nReact("love {{flag}}", {
                    flag: (
                      <Text style={[ styles.flag, flagThemedStyle ]}>
                        {i18n("in:ESV,NASB")}
                      </Text>
                    ),
                  })}
                </Text>
              </View>
              <Text style={[ styles.detail, detailThemedStyle ]}>
                {i18n("Specific book(s) of the Bible")}
              </Text>
              <View style={styles.example}>
                <Text style={[ styles.exampleIndicator, exampleIndicatorThemedStyle ]}>
                  {i18n("E.g.")}
                </Text>
                <Text style={[ styles.exampleContent, exampleContentThemedStyle ]}>
                  {i18nReact("love {{flag}}", {
                    flag: (
                      <Text style={[ styles.flag, flagThemedStyle ]}>
                        {i18n("in:1Jn")}
                      </Text>
                    ),
                  })}
                </Text>
              </View>
              <View style={styles.example}>
                <Text style={[ styles.exampleIndicator, exampleIndicatorThemedStyle ]}>
                  {i18n("E.g.")}
                </Text>
                <Text style={[ styles.exampleContent, exampleContentThemedStyle ]}>
                  {i18nReact("love {{flag}}", {
                    flag: (
                      <Text style={[ styles.flag, flagThemedStyle ]}>
                        {i18n("in:prophets")}
                      </Text>
                    ),
                  })}
                </Text>
              </View>
            </>
          }
        />
      </View>

      <View style={styles.tip}>
        <Text style={[ styles.tipTitle, tipTitleThemedStyle ]}>
          {i18n("Search the Bible in its original languages")}
        </Text>
        <View style={styles.example}>
          <Text style={[ styles.exampleIndicator, exampleIndicatorThemedStyle ]}>
            {i18n("E.g.")}
          </Text>
          <Text style={[ styles.exampleContent, exampleContentThemedStyle ]}>
            <Text style={[ styles.hashOrSlash, hashOrSlashThemedStyle ]}>#</Text>elohiym
          </Text>
          <Text style={[ styles.exampleIndicator, exampleIndicatorThemedStyle ]}>
            {i18nReact("finds {{word}}", {
              word: <Text style={styles.hebrew}>אֱלֹהִים</Text>,
            })}
          </Text>
        </View>
        <View style={styles.example}>
          <Text style={[ styles.exampleIndicator, exampleIndicatorThemedStyle ]}>
            {i18n("E.g.")}
          </Text>
          <Text style={[ styles.exampleContent, exampleContentThemedStyle ]}>
          <Text style={[ styles.hashOrSlash, hashOrSlashThemedStyle ]}>#</Text>G30560
          </Text>
          <Text style={[ styles.exampleIndicator, exampleIndicatorThemedStyle ]}>
            {i18nReact("finds {{word}}", {
              word: <Text style={styles.greek}>λόγος</Text>,
            })}
          </Text>
        </View>
        <SearchTabTipsDetailAccordion
          expanded={searchOrigLangExpanded}
          uiStatus={searchOrigLangExpanded ? `expanded` : `collapsed`}
          onPress={goToggleSearchOrigLangExpanded}
          summary={i18n("Advanced")}
          details={
            <>
              <Text style={[ styles.detail, detailThemedStyle ]}>
                {i18n("Type # plus the original language word")}
              </Text>
              <View style={styles.example}>
                <Text style={[ styles.exampleIndicator, exampleIndicatorThemedStyle ]}>
                  {i18n("E.g.")}
                </Text>
                <Text style={[ styles.exampleContent, exampleContentThemedStyle ]}>
                  <Text style={[ styles.hashOrSlash, hashOrSlashThemedStyle ]}>#</Text>
                  <Text style={styles.greek}>πιστεύω</Text>
                </Text>
              </View>
              <Text style={[ styles.detail, detailThemedStyle ]}>
                {i18n("Type # plus a grammatical detail")}
              </Text>
              <View style={styles.example}>
                <Text style={[ styles.exampleIndicator, exampleIndicatorThemedStyle ]}>
                  {i18n("E.g.")}
                </Text>
                <Text style={[ styles.exampleContent, exampleContentThemedStyle ]}>
                  <Text style={[ styles.hashOrSlash, hashOrSlashThemedStyle ]}>#</Text>
                  {i18n("noun")}
                </Text>
              </View>
              <View style={styles.example}>
                <Text style={[ styles.exampleIndicator, exampleIndicatorThemedStyle ]}>
                  {i18n("E.g.")}
                </Text>
                <Text style={[ styles.exampleContent, exampleContentThemedStyle ]}>
                  <Text style={[ styles.hashOrSlash, hashOrSlashThemedStyle ]}>#</Text>
                  {i18n("noun")}
                  <Text style={[ styles.hashOrSlash, hashOrSlashThemedStyle ]}>#</Text>
                  {i18n("feminine")}
                </Text>
                <Text style={[ styles.exampleIndicator, exampleIndicatorThemedStyle ]}>
                  {i18n("finds feminine nouns")}
                </Text>
              </View>
              <View style={styles.example}>
                <Text style={[ styles.exampleIndicator, exampleIndicatorThemedStyle ]}>
                  {i18n("E.g.")}
                </Text>
                <Text style={[ styles.exampleContent, exampleContentThemedStyle ]}>
                  <Text style={[ styles.hashOrSlash, hashOrSlashThemedStyle ]}>#</Text>
                  {i18n("{{strongs}}", {
                    strongs: "G41000",
                  })}
                  <Text style={[ styles.hashOrSlash, hashOrSlashThemedStyle ]}>#</Text>
                  {i18n("aorist")}
                </Text>
                <Text style={[ styles.exampleIndicator, exampleIndicatorThemedStyle ]}>
                  {i18nReact("finds {{word}} in the aorist", {
                    word: <Text style={styles.greek}>πιστεύω</Text>,
                  })}
                </Text>
              </View>
              <View style={styles.example}>
                <Text style={[ styles.exampleIndicator, exampleIndicatorThemedStyle ]}>
                  {i18n("E.g.")}
                </Text>
                <Text style={[ styles.exampleContent, exampleContentThemedStyle ]}>
                  <Text style={[ styles.hashOrSlash, hashOrSlashThemedStyle ]}>#</Text>
                  {i18nReact("aorist{{slash}}imperfect", {
                    slash: <Text style={[ styles.hashOrSlash, hashOrSlashThemedStyle ]}>/</Text>
                  })}
                </Text>
                <Text style={[ styles.exampleIndicator, exampleIndicatorThemedStyle ]}>
                  {i18n("finds aorists and imperfects")}
                </Text>
              </View>
              <View style={styles.example}>
                <Text style={[ styles.exampleIndicator, exampleIndicatorThemedStyle ]}>
                  {i18n("E.g.")}
                </Text>
                <Text style={[ styles.exampleContent, exampleContentThemedStyle ]}>
                  <Text style={[ styles.hashOrSlash, hashOrSlashThemedStyle ]}>#</Text>
                  {i18n("verb")}
                  <Text style={[ styles.hashOrSlash, hashOrSlashThemedStyle ]}>#</Text>
                  {i18n("not:indicative")}
                </Text>
                <Text style={[ styles.exampleIndicator, exampleIndicatorThemedStyle ]}>
                  {i18n("finds non-indicative verbs")}
                </Text>
              </View>
              <View style={styles.example}>
                <Text style={[ styles.exampleIndicator, exampleIndicatorThemedStyle ]}>
                  {i18n("E.g.")}
                </Text>
                <Text style={[ styles.exampleContent, exampleContentThemedStyle ]}>
                  <Text style={[ styles.hashOrSlash, hashOrSlashThemedStyle ]}>#</Text>
                  {i18n("b")}
                  <Text style={[ styles.hashOrSlash, hashOrSlashThemedStyle ]}>#</Text>
                  {i18n("noun")}
                </Text>
                <Text style={[ styles.exampleIndicator, exampleIndicatorThemedStyle ]}>
                  {i18n("finds nouns with a ב prepositional prefix")}
                </Text>
              </View>
              <View style={styles.example}>
                <Text style={[ styles.exampleIndicator, exampleIndicatorThemedStyle ]}>
                  {i18n("E.g.")}
                </Text>
                <Text style={[ styles.exampleContent, exampleContentThemedStyle ]}>
                  <Text style={[ styles.hashOrSlash, hashOrSlashThemedStyle ]}>#</Text>
                  {i18n("verb")}
                  <Text style={[ styles.hashOrSlash, hashOrSlashThemedStyle ]}>#</Text>
                  {i18n("h->")}
                </Text>
                <Text style={[ styles.exampleIndicator, exampleIndicatorThemedStyle ]}>
                  {i18n("finds verbs with a directional ה")}
                </Text>
              </View>
              <View style={styles.example}>
                <Text style={[ styles.exampleIndicator, exampleIndicatorThemedStyle ]}>
                  {i18n("E.g.")}
                </Text>
                <Text style={[ styles.exampleContent, exampleContentThemedStyle ]}>
                  <Text style={[ styles.hashOrSlash, hashOrSlashThemedStyle ]}>#</Text>
                  {i18n("suffix:3ms")}
                </Text>
                <Text style={[ styles.exampleIndicator, exampleIndicatorThemedStyle ]}>
                  {i18n("finds words with a 3ms suffix")}
                </Text>
              </View>
              <View style={styles.linkKeyBlock}>
                <InlineLink
                  url="https://preview.biblearc.com/grammar-search-key"
                  label={i18n("Grammatical Detail Search Key")}
                  fontSize={12}
                />
              </View>
              {/* <Text style={[ styles.detail, detailThemedStyle ]}>
                {i18n("Include synonyms in the results")}
                <View style={styles.example}>
                  {i18nReact("E.g. {{example}} {{explanation}}", {
                    example: (
                      <Text style={[ styles.exampleContent, exampleContentThemedStyle ]}>
                        <Text style={[ styles.hashOrSlash, hashOrSlashThemedStyle ]}>#</Text>G41000+
                      </Text>
                    ),
                    explanation: i18n("finds {{word}} and its synonyms", {
                      word: "πιστεύω",
                    }),
                  })}
                </Text>
              </Text>
              <Text style={[ styles.detail, detailThemedStyle ]}>
                {i18n("Include related words in the results")}
                <View style={styles.example}>
                  {i18nReact("E.g. {{example}} {{explanation}}", {
                    example: (
                      <Text style={[ styles.exampleContent, exampleContentThemedStyle ]}>
                        <Text style={[ styles.hashOrSlash, hashOrSlashThemedStyle ]}>#</Text>G41000~
                      </Text>
                    ),
                    explanation: i18n("finds {{word}} and related words", {
                      word: "πιστεύω",
                    }),
                  })}
                </Text>
              </Text>
              <Text style={[ styles.detail, detailThemedStyle ]}>
                {i18n("Search all original language words with a particular translation")}
                <View style={styles.example}>
                  {i18nReact("E.g. {{example}} {{explanation}}", {
                    example: (
                      <Text style={[ styles.exampleContent, exampleContentThemedStyle ]}>
                        {i18n("=love")}
                      </Text>
                    ),
                    explanation: i18n("finds words sometimes translated “love”"),
                  })}
                </Text>
                <View style={styles.example}>
                  {i18nReact("E.g. {{example}} {{explanation}}", {
                    example: (
                      <Text style={[ styles.exampleContent, exampleContentThemedStyle ]}>
                        {i18n("=lov*")}
                      </Text>
                    ),
                    explanation: i18n("also includes words translated loves, loving, etc."),
                  })}
                </Text>
                <View style={styles.example}>
                  {i18nReact("E.g. {{example}} {{explanation}}", {
                    example: (
                      <Text style={[ styles.exampleContent, exampleContentThemedStyle ]}>
                        {i18n("=love[ESV]")}
                      </Text>
                    ),
                    explanation: i18n("considers only the ESV translation"),
                  })}
                </Text>
              </Text>
              <Text style={[ styles.detail, detailThemedStyle ]}>
                {i18n("Search the LXX")}
                <View style={styles.example}>
                <Text style={st[ yles.exampleIndicator, }>ThemedStyle ]}>
              </Text>
                  <Text style={[ styles.exampleContent, exampleContentThemedStyle ]}>
                  {i18n("E.g.")}
                        <Text style={[ styles.hashOrSlash, hashOrSlashThemedStyle ]}>#</Text>
                        {i18n("{{strongs}} in:{{version}}", {
                          strongs: "G41000",
                          version: "LXX",
                        })}
                      </Text>
                    ),
                  })}
                </Text>
              </Text> */}
            </>
          }
        />
      </View>

      <View style={styles.tip}>
        <Text style={[ styles.tipTitle, tipTitleThemedStyle ]}>
          {i18n("Search word combos")}
        </Text>
        <View style={styles.example}>
          <Text style={[ styles.exampleIndicator, exampleIndicatorThemedStyle ]}>
            {i18n("E.g.")}
          </Text>
          <Text style={[ styles.exampleContent, exampleContentThemedStyle ]}>
            {i18n("grace truth")}
          </Text>
          <Text style={[ styles.exampleIndicator, exampleIndicatorThemedStyle ]}>
            {i18n("finds verses with both words")}
          </Text>
        </View>
        <View style={styles.example}>
          <Text style={[ styles.exampleIndicator, exampleIndicatorThemedStyle ]}>
            {i18n("E.g.")}
          </Text>
          <Text style={[ styles.exampleContent, exampleContentThemedStyle ]}>
            {i18nReact("{{quotation_mark}}{{hash}}{{strongs}} {{hash}}accusative{{quotation_mark}}", {
              quotation_mark: <Text style={styles.quotationMark}>"</Text>,
              hash: <Text style={[ styles.hashOrSlash, hashOrSlashThemedStyle ]}>#</Text>,
              strongs: "G43140",
            })}
          </Text>
          <Text style={[ styles.exampleIndicator, exampleIndicatorThemedStyle ]}>
            {i18nReact("finds {{word}} + accusative", {
              word: <Text style={styles.greek}>πρός</Text>,
            })}
          </Text>
        </View>
        <SearchTabTipsDetailAccordion
          expanded={searchWordCombosExpanded}
          uiStatus={searchWordCombosExpanded ? `expanded` : `collapsed`}
          onPress={goToggleSearchWordCombosExpanded}
          summary={i18n("Advanced")}
          details={
            <>
              <Text style={[ styles.noteAboutDetails, noteAboutDetailsThemedStyle ]}>
                {i18n("Note: Everything but scope works also with original languages.")}
              </Text>
              <Text style={[ styles.detail, detailThemedStyle ]}>
                {i18n("Exact phrases")}
              </Text>
              <View style={styles.example}>
                <Text style={[ styles.exampleIndicator, exampleIndicatorThemedStyle ]}>
                  {i18n("E.g.")}
                </Text>
                <Text style={[ styles.exampleContent, exampleContentThemedStyle ]}>
                  {i18nReact("{{quotation_mark}}love of god{{quotation_mark}}", {
                    quotation_mark: <Text style={styles.quotationMark}>"</Text>,
                  })}
                </Text>
              </View>
              <View style={styles.example}>
                <Text style={[ styles.exampleIndicator, exampleIndicatorThemedStyle ]}>
                  {i18n("E.g.")}
                </Text>
                <Text style={[ styles.exampleContent, exampleContentThemedStyle ]}>
                  {i18nReact("{{quotation_mark}}cut {{star}} off{{quotation_mark}}", {
                    quotation_mark: <Text style={styles.quotationMark}>"</Text>,
                    star: <Text style={styles.dotOrPlaceholderStar}>*</Text>
                  })}
                </Text>
                <Text style={[ styles.exampleIndicator, exampleIndicatorThemedStyle ]}>
                  {i18n("finds “cut them/me/him off”")}
                </Text>
              </View>
              <View style={styles.example}>
                <Text style={[ styles.exampleIndicator, exampleIndicatorThemedStyle ]}>
                  {i18n("E.g.")}
                </Text>
                <Text style={[ styles.exampleContent, exampleContentThemedStyle ]}>
                  {i18nReact("{{quotation_mark}}because {{ellipsis}} love{{quotation_mark}}", {
                    quotation_mark: <Text style={styles.quotationMark}>"</Text>,
                    ellipsis: <Text style={styles.dotOrPlaceholderStar}>...</Text>
                  })}
                </Text>
                <Text style={[ styles.exampleIndicator, exampleIndicatorThemedStyle ]}>
                  {i18n("(“followed by” search)")}
                </Text>
              </View>
              <Text style={[ styles.exampleSecondLineExplanation, exampleIndicatorThemedStyle ]}>
                {i18n("Finds “because your steadfast love”")}
              </Text>
              <Text style={[ styles.exampleSecondLineExplanation, exampleIndicatorThemedStyle ]}>
                {i18n("Does NOT find “I love the Lord because”")}
              </Text>
              <Text style={[ styles.detail, detailThemedStyle ]}>
                {i18n("One word or another")}
              </Text>
              <View style={styles.example}>
                <Text style={[ styles.exampleIndicator, exampleIndicatorThemedStyle ]}>
                  {i18n("E.g.")}
                </Text>
                <Text style={[ styles.exampleContent, exampleContentThemedStyle ]}>
                  {i18nReact("faith {{slash}} belief", {
                    star: <Text style={styles.star}>*</Text>,
                    slash: <Text style={styles.parenthasesOrSlash}>/</Text>
                  })}
                </Text>
                <Text style={[ styles.exampleIndicator, exampleIndicatorThemedStyle ]}>
                  {i18n("finds faith, belief")}
                </Text>
              </View>
              <View style={styles.example}>
                <Text style={[ styles.exampleIndicator, exampleIndicatorThemedStyle ]}>
                  {i18n("E.g.")}
                </Text>
                <Text style={[ styles.exampleContent, exampleContentThemedStyle ]}>
                  {i18nReact("{{two_plus}} faith hope love", {
                    two_plus: <Text style={styles.parenthasesOrSlash}>2+</Text>,
                  })}
                </Text>
              </View>
              <Text style={[ styles.exampleSecondLineExplanation, exampleIndicatorThemedStyle ]}>
                {i18n("Finds verses with at least two of these words")}
              </Text>
              <Text style={[ styles.detail, detailThemedStyle ]}>
                {i18n("Changing the scope")}
              </Text>
              <View style={styles.example}>
                <Text style={[ styles.exampleIndicator, exampleIndicatorThemedStyle ]}>
                  {i18n("E.g.")}
                </Text>
                <Text style={[ styles.exampleContent, exampleContentThemedStyle ]}>
                  {i18nReact("god love {{flag}}", {
                    flag: (
                      <Text style={[ styles.flag, flagThemedStyle ]}>
                        {i18n("same:phrase")}
                      </Text>
                    ),
                  })}
                </Text>
              </View>
              <Text style={[ styles.exampleSecondLineExplanation, exampleIndicatorThemedStyle ]}>
                {i18n("Finds “love of God”")}
              </Text>
              <Text style={[ styles.exampleSecondLineExplanation, exampleIndicatorThemedStyle ]}>
                {i18n("Does NOT find “love the brotherhood, fear God”")}
              </Text>
              <View style={styles.example}>
                <Text style={[ styles.exampleIndicator, exampleIndicatorThemedStyle ]}>
                  {i18n("E.g.")}
                </Text>
                <Text style={[ styles.exampleContent, exampleContentThemedStyle ]}>
                  {i18nReact("god love {{flag}}", {
                    flag: (
                      <Text style={[ styles.flag, flagThemedStyle ]}>
                        {i18n("same:sentence")}
                      </Text>
                    ),
                  })}
                </Text>
              </View>
              <Text style={[ styles.exampleSecondLineExplanation, exampleIndicatorThemedStyle ]}>
                {i18n("Finds “I thank God... [5] because of your love”")}
              </Text>
              <View style={styles.example}>
                <Text style={[ styles.exampleIndicator, exampleIndicatorThemedStyle ]}>
                  {i18n("E.g.")}
                </Text>
                <Text style={[ styles.exampleContent, exampleContentThemedStyle ]}>
                  {i18nReact("god love {{flag}}", {
                    flag: (
                      <Text style={[ styles.flag, flagThemedStyle ]}>
                        {i18n("same:paragraph")}
                      </Text>
                    ),
                  })}
                </Text>
              </View>
              <Text style={[ styles.exampleSecondLineExplanation, exampleIndicatorThemedStyle ]}>
                {i18n("Finds “Blessed be God... In love...”")}
              </Text>
              <Text style={[ styles.detail, detailThemedStyle ]}>
                {i18n("Complex searches")}
              </Text>
              <View style={styles.example}>
                <Text style={[ styles.exampleIndicator, exampleIndicatorThemedStyle ]}>
                  {i18n("E.g.")}
                </Text>
                <Text style={[ styles.exampleContent, exampleContentThemedStyle ]}>
                  {i18nReact("{{quotation_mark}}word{{star}} of {{left_parentases}}{{quotation_mark}}the lord{{quotation_mark}} {{slash}} god{{right_parentases}}{{quotation_mark}}", {
                    quotation_mark: <Text style={styles.quotationMark}>"</Text>,
                    left_parentases: <Text style={styles.parenthasesOrSlash}>(</Text>,
                    right_parentases: <Text style={styles.parenthasesOrSlash}>)</Text>,
                    slash: <Text style={styles.parenthasesOrSlash}>/</Text>,
                    star: <Text style={styles.star}>*</Text>,
                  })}
                </Text>
              </View>
              <Text style={[ styles.exampleSecondLineExplanation, exampleIndicatorThemedStyle ]}>
                {i18n("Finds “word(s) of God” and “word(s) of the Lord”")}
              </Text>
            </>
          }
        />
      </View>

      {/* <Text style={[ styles.finalNote, finalNoteThemedStyle ]}>
        {i18n("Search results also include your projects, highlights, alerts, Study Bible notes, Bible versions, online courses, learning resources, help topics, and others’ work shared with you.")}
      </Text> */}

    </ScrollView>
  )
}

export default memo(SearchTabTips, { name: 'SearchTabTips' })