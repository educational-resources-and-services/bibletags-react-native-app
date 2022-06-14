import React, { useCallback, useState } from "react"
import { StyleSheet, ScrollView, View, Text } from "react-native"
import { i18n } from "inline-i18n"
import { Button, CheckBox } from "@ui-kitten/components"

import { memo } from "../../utils/toolbox"
import useRouterState from "../../hooks/useRouterState"
import useThemedStyleSets from "../../hooks/useThemedStyleSets"

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  body: {
    paddingBottom: 400,
    paddingHorizontal: 20,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  checkBoxContainer: {
    marginTop: 15,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  checkBox: {
    marginVertical: 4,
    marginHorizontal: 6,
  },
  intro: {
    marginTop: 15,
    fontStyle: 'italic',
  },
  heading: {
    fontWeight: '700',
    fontSize: 15,
    textAlign: 'left',
    marginTop: 20,
  },
  p: {
    marginTop: 15,
  },
  i: {
    fontStyle: 'italic',
  },
  li: {
    marginTop: 10,
    marginLeft: 10,
  },
  firstExample: {
    fontWeight: '200',
  },
  example: {
    marginTop: 10,
    fontWeight: '200',
  },
  examples: {
    marginTop: 15,
    fontWeight: '200',
    borderWidth: 1,
    borderRadius: 3,
    borderColor: 'rgba(0, 0, 0, .15)',
    backgroundColor: 'rgba(0, 0, 0, .03)',
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  greek: {
    fontFamily: `original-grk`,
  },
  hebrew: {
    fontFamily: `original-heb`,
  },
  button: {
    marginVertical: 25,
  },
})

const VerseTaggerHelpRules = ({
  setHelpIndex,
  style,

  eva: { style: themedStyle={} },
}) => {

  const { labelThemedStyle } = useThemedStyleSets(themedStyle)

  const { routerState } = useRouterState()
  const { defaultOrigLangForExamples } = routerState

  const [ showHebrewExamples, setShowHebrewExamples ] = useState(defaultOrigLangForExamples === 'heb')
  const [ showGreekExamples, setShowGreekExamples ] = useState(defaultOrigLangForExamples === 'grk')

  const goToNextHelpIndex = useCallback(() => setHelpIndex(3), [ setHelpIndex ])

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.body}
    >


      <View style={styles.checkBoxContainer}>

        <CheckBox
          style={styles.checkBox}
          checked={showHebrewExamples}
          onChange={nextChecked => setShowHebrewExamples(nextChecked)}
        >
          {i18n("Show Hebrew")}
        </CheckBox>

        <CheckBox
          style={styles.checkBox}
          checked={showGreekExamples}
          onChange={nextChecked => setShowGreekExamples(nextChecked)}
        >
          {i18n("Show Greek")}
        </CheckBox>

      </View>

      <Text style={styles.intro}>
        {i18n("Please be careful to follow these tagging rules. This will result in the best automated lexical information.")}
      </Text>

      <Text
        style={[
          styles.heading,
          labelThemedStyle,
        ]}
      >
        {i18n("1.")}
        {i18n(" ", "word separator")}
        {i18n("Articles")}
      </Text>

      <Text style={styles.p}>
        <Text style={styles.i}>
          {i18n("Definite article")}
        </Text>
      </Text>
      <Text style={styles.p}>
        {i18n("The definite article in the original should be tagged to the definite article in the translation, or to whatever other word it happens to be translated to (eg. a relative pronoun).")}
        {i18n(" ", "word separator")}
        {i18n("When the definite article is not translated to anything or is absent from the original, it should be left untagged.")}
      </Text>
      <View style={(showHebrewExamples || showGreekExamples) ? styles.examples : null}>
        {showHebrewExamples &&
          <>
            <Text style={styles.firstExample}>
              Eg. For “<Text style={styles.hebrew}>פְּנֵ֥י הַ/מָּֽיִם</Text>” in Genesis 1:2, “<Text style={styles.hebrew}>פְּנֵ֥י</Text>” should be tagged to “face of” (NOT: “the face of”), “<Text style={styles.hebrew}>הַ</Text>” should be tagged to “the” (in the phrase “the deep”) and “<Text style={styles.hebrew}>מָּֽיִם</Text>” should be tagged to “deep.”
            </Text>
            <Text style={styles.example}>
              Eg. In Genesis 12:7, we find “<Text style={styles.hebrew}>הַ/נִּרְאֶ֥ה אֵלָֽי/ו</Text>” translated to “who had appeared to him.” In this case, the definite artcile “<Text style={styles.hebrew}>הַ</Text>” should be tagged to “who.”
            </Text>
          </>
        }
        {showGreekExamples &&
          <>
            <Text style={!showHebrewExamples ? styles.firstExample : styles.example}>
              Eg. For “<Text style={styles.greek}>τοὺς ἀδελφοὺς αὐτοῦ</Text>” in Matthew 1:11, “<Text style={styles.greek}>ἀδελφοὺς</Text>” should be tagged to “brothers,” “<Text style={styles.greek}>αὐτοῦ</Text>” should be tagged to “his,” and “<Text style={styles.greek}>τοὺς</Text>” should be left untagged.
            </Text>
            <Text style={styles.example}>
              Eg. In John 3:9, “<Text style={styles.greek}>ὁ γεγεννημένος</Text>” is translated to “who is born.” In this case, the definite article “<Text style={styles.greek}>ὁ</Text>” should be translated to “who.”
            </Text>
          </>
        }
      </View>
      <Text style={styles.p}>
        {i18n("The only exception is when a proper name with the definite article is translated to a proper name without, or vice versa.")}
        {i18n(" ", "word separator")}
        {i18n("In this case, include the definite article within the tag.")}
      </Text>
      <View style={(showHebrewExamples || showGreekExamples) ? styles.examples : null}>
        {showHebrewExamples &&
          <>
            <Text style={styles.firstExample}>
              Eg. “<Text style={styles.hebrew}>הָ/עָֽי</Text>” (with the definite article) in Genesis 13:3 should be tagged to “Ai.”
            </Text>
          </>
        }
        {showGreekExamples &&
          <>
            <Text style={!showHebrewExamples ? styles.firstExample : styles.example}>
              Eg. “<Text style={styles.greek}>τὸν Θεόν</Text>” (with the definite article) in John 1:1 should be tagged to “God.”
            </Text>
          </>
        }
      </View>

      <Text style={styles.p}>
        <Text style={styles.i}>
          {i18n("Indefinite article")}
        </Text>
      </Text>
      <Text style={styles.p}>
        {i18n("The indefinite article in a translation should almost never be tagged, since neither Hebrew nor Greek utilize an explicit indefinite article.")}
      </Text>
      <View style={(showHebrewExamples || showGreekExamples) ? styles.examples : null}>
        {showHebrewExamples &&
          <Text style={styles.firstExample}>
            Eg. “<Text style={styles.greek}>גַּן</Text>” in Genesis 2:8 should only be tagged to “garden,” leaving the preceding “a” untagged.
          </Text>
        }
        {showGreekExamples &&
          <Text style={!showHebrewExamples ? styles.firstExample : styles.example}>
            Eg. “<Text style={styles.greek}>ἄνθρωπος</Text>” in John 1:6 should only be tagged to “man,” leaving the preceding “a” untagged.
          </Text>
        }
      </View>

      <Text
        style={[
          styles.heading,
          labelThemedStyle,
        ]}
      >
        {i18n("2.")}
        {i18n(" ", "word separator")}
        {i18n("Words Added in the Translation")}
      </Text>

      <Text style={styles.p}>
        <Text style={styles.i}>
          {i18n("Do tag...")}
        </Text>
      </Text>
      <Text style={styles.li}>
        {i18n("a.")}
        {i18n(" ", "word separator")}
        {i18n("Pronouns designated by a verb’s inflection")}
      </Text>
      <Text style={styles.li}>
        {i18n("b.")}
        {i18n(" ", "word separator")}
        {i18n("Helping verbs")}
      </Text>
      <Text style={styles.li}>
        {i18n("c.")}
        {i18n(" ", "word separator")}
        {i18n("Genitive or dative helper words")}
      </Text>
      <Text style={styles.li}>
        {i18n("d.")}
        {i18n(" ", "word separator")}
        {i18n("Translations you disagree with")}
      </Text>
      <View style={(showHebrewExamples || showGreekExamples) ? styles.examples : null}>
        {showHebrewExamples &&
          <>
            <Text style={styles.firstExample}>
              Eg. In Genesis 2:17, “<Text style={styles.hebrew}>לֹ֥א תֹאכַ֖ל</Text>” is translated “you shall not eat.” In this case, “<Text style={styles.hebrew}>לֹ֨א</Text>” should be tagged to “not” and “<Text style={styles.hebrew}>תֹאכַ֖ל</Text>” should be tagged to “you shall ... eat.”
            </Text>
            <Text style={styles.example}>
              Eg. “<Text style={styles.hebrew}>ר֣וּחַ</Text>” in Genesis 1:2 (from the phrase “<Text style={styles.hebrew}>ר֣וּחַ אֱלֹהִ֔ים</Text>”) should be tagged to “Spirit of.”
            </Text>
          </>
        }
        {showGreekExamples &&
          <>
            <Text style={!showHebrewExamples ? styles.firstExample : styles.example}>
              Eg. In John 3:12, “<Text style={styles.greek}>οὐ πιστεύετε</Text>” is translated “you do not believe.” In this case, “<Text style={styles.greek}>οὐ</Text>” should be tagged to “not” and “<Text style={styles.greek}>πιστεύετε</Text>” should be tagged to “you do ... believe.”
            </Text>
            <Text style={styles.example}>
              Eg. “<Text style={styles.greek}>ἀνθρώπων</Text>” in John 1:4 should be tagged to “of men.”
            </Text>
            <Text style={styles.example}>
              Eg. In John 1:4, “<Text style={styles.greek}>τοῦ ἱεροῦ</Text>” is translated “of the temple.” In this case, include the genitive helper word in the tag of the article, such that “<Text style={styles.greek}>τοῦ</Text>” is tagged to “of the” and “<Text style={styles.greek}>ἱεροῦ</Text>” is tagged to “temple.”
            </Text>
          </>
        }
      </View>

      <Text style={styles.p}>
        <Text style={styles.i}>
          {i18n("Do NOT tag...")}
        </Text>
      </Text>
      <Text style={styles.li}>
        {i18n("a.")}
        {i18n(" ", "word separator")}
        {i18n("Words merely added for clarity and not translated from any particular word in the original")}
      </Text>
      <Text style={styles.li}>
        {i18n("b.")}
        {i18n(" ", "word separator")}
        {i18n("Pronouns translated to proper nouns, or vice versa")}
      </Text>
      {/* <Text style={styles.li}>
        {i18n("c.")}
        {i18n(" ", "word separator")}
        {i18n("Translation words indicated by grammatical constructions NOT found in the specific original word(s) you are currently tagging")}
      </Text> */}
      <View style={(showHebrewExamples || showGreekExamples) ? styles.examples : null}>
        {showHebrewExamples &&
          <>
            <Text style={styles.firstExample}>
              Eg. In Genesis 30:29, some translations read “Jacob said” even though the original only has “<Text style={styles.hebrew}>וַיֹּ֣אמֶר</Text>.” In such a case, “Jacob” should be left untagged.
            </Text>
            <Text style={styles.example}>
              Eg. In Genesis 29:23, some translations read “to Jacob” even though the original only has “<Text style={styles.hebrew}>אֵלָ֑י/ו</Text>.” In such a case, “Jacob” and “<Text style={styles.hebrew}>ו</Text>” should be left untagged.
            </Text>
            {/* <Text style={styles.example}>
              Eg. 
            </Text> */}
          </>
        }
        {showGreekExamples &&
          <>
            <Text style={!showHebrewExamples ? styles.firstExample : styles.example}>
              Eg. In Matthew 8:3, some translations read “Jesus stretched out” even though the original only has “<Text style={styles.greek}>ἐκτείνας</Text>.” In such a case, “Jesus” should be left untagged.
            </Text>
            {/* <Text style={styles.example}>
              Eg. pronoun -> proper noun
            </Text> */}
            {/* <Text style={styles.example}>
              Eg. 
            </Text> */}
          </>
        }
      </View>

      <Text
        style={[
          styles.heading,
          labelThemedStyle,
        ]}
      >
        {i18n("3.")}
        {i18n(" ", "word separator")}
        {i18n("Untranslated Original Language Words")}
      </Text>
      <Text style={styles.p}>
        {i18n("Do NOT tag words left untranslated, no matter the reason.")}
      </Text>
      {showHebrewExamples &&
        <>
          <Text style={styles.p}>
            <Text style={styles.i}>
              {i18n("This includes...")}
            </Text>
          </Text>
          <Text style={styles.li}>
            {i18n("b.")}
            {i18n(" ", "word separator")}
            {i18n("Words only repeated in the original language")}
          </Text>
          <Text style={styles.li}>
            {i18n("c.")}
            {i18n(" ", "word separator")}
            Paragogic <Text style={styles.hebrew}>ה</Text> or <Text style={styles.hebrew}>ן</Text>
          </Text>
          <Text style={styles.li}>
            {i18n("d.")}
            {i18n(" ", "word separator")}
            The definite object marker <Text style={styles.hebrew}>אֵת</Text>
          </Text>
        </>
      }
      <View style={(showHebrewExamples || showGreekExamples) ? styles.examples : null}>
        {showHebrewExamples &&
          <>
            <Text style={styles.firstExample}>
              Eg. Some versions do not translate “<Text style={styles.hebrew}>לֵ/אמֹֽר</Text>” in Genesis 8:15 since it is redundant. In such cases, leave the original word(s) untagged.
            </Text>
            <Text style={styles.example}>
              Eg. In Genesis 9:12, we find “<Text style={styles.hebrew}>בֵּינִ/י֙ וּ/בֵ֣ינֵי/כֶ֔ם וּ/בֵ֛ין כָּל־נֶ֥פֶשׁ חַיָּ֖ה</Text>” translated to “between me and you and every living creature.” The second and third occurrences of “<Text style={styles.hebrew}>בֵּין</Text>” should be left untagged.
            </Text>
            <Text style={styles.example}>
              Eg. For “<Text style={styles.hebrew}>תְּמֻתֽוּ/ן</Text>” in Genesis 3:4, only “<Text style={styles.hebrew}>תְּמֻתֽוּ</Text>” should be tagged to “you will die.” The “<Text style={styles.hebrew}>ן</Text>” should be left untagged.
            </Text>
            <Text style={styles.example}>
              Eg. For “<Text style={styles.hebrew}>בָּרָ֣א אֹת֑/וֹ</Text>” in Genesis 1:27, only “<Text style={styles.hebrew}>וֹ</Text>” should be tagged to “him” while “<Text style={styles.hebrew}>אֹת֑</Text>” should be left untagged.
            </Text>
          </>
        }
        {showGreekExamples &&
          <>
            <Text style={!showHebrewExamples ? styles.firstExample : styles.example}>
              Eg. In Matthew 26:48, we find “<Text style={styles.greek}>ὃν ἂν φιλήσω</Text>” and the translation “The one I will kiss.” Here, “<Text style={styles.greek}>ἂν</Text>” should be left untagged since no sense from it is drawn into the translation.
            </Text>
            <Text style={styles.example}>
              Eg. However, in Matthew 20:27, the entire phrase “<Text style={styles.greek}>ὃς ἂν</Text>” should be tagged to “whoever,” since “<Text style={styles.greek}>ἂν</Text>” does contribute to the sense captured by the translation.
            </Text>
          </>
        }
      </View>

      <Text
        style={[
          styles.heading,
          labelThemedStyle,
        ]}
      >
        {i18n("4.")}
        {i18n(" ", "word separator")}
        {i18n("Idioms and Word Combos")}
      </Text>
      <Text style={styles.p}>
        {i18n("Include an entire idiom in a single tag only when it is not possible to tag the words individually.")}
      </Text>
      <View style={(showHebrewExamples || showGreekExamples) ? styles.examples : null}>
        {showHebrewExamples &&
          <>
            <Text style={styles.firstExample}>
              Eg. The entire phrase “<Text style={styles.hebrew}>מ֥וֹת תָּמֽוּת</Text>” in Genesis 2:17 should be tagged to “shall surely die” since it would be incorrect to say that “<Text style={styles.hebrew}>מ֥וֹת</Text>” is translated “surely” (even though that is the effect of the infinitive absolute in this context).
            </Text>
            <Text style={styles.example}>
              Eg. In Genesis 9:14, we find “<Text style={styles.hebrew}>בְּ/עַֽנְנִ֥/י עָנָ֖ן</Text>” translated to “When I bring clouds.” “<Text style={styles.hebrew}>בְּ</Text>” should be tagged to “when” and “י” should be tagged to “I.” However, the entire phrase “<Text style={styles.hebrew}>עַֽנְנִ֥– עָנָ֖ן</Text>” should be tagged to “bring clouds” since the verb alone does not mean “to bring” but rather “to cloud.”
            </Text>
          </>
        }
        {showGreekExamples &&
          <>
            <Text style={!showHebrewExamples ? styles.firstExample : styles.example}>
              Eg. The entire phrase “<Text style={styles.greek}>ἐν γαστρὶ ἔχουσα</Text>” (lit. “in womb having”) in Matthew 1:18 should be tagged to the phrase “to be with child.”
            </Text>
            <Text style={styles.example}>
              Eg. In Luke 22:15, we find “<Text style={styles.greek}>ἐπιθυμίᾳ ἐπεθύμησα</Text>” translated to “I have earnestly desired.” The entire phrases should be tagged to each other since “<Text style={styles.greek}>ἐπιθυμίᾳ</Text>” alone does not mean “earnestly” but rather “with desire.”
            </Text>
          </>
        }
      </View>
      <Text style={styles.p}>
        {i18n("Only combine a verb and preposition within a tag if the presence of the preposition changes the verb’s meaning.")}
        
      </Text>
      <View style={(showHebrewExamples || showGreekExamples) ? styles.examples : null}>
        {showHebrewExamples &&
          <>
            <Text style={styles.firstExample}>
              Eg. In Genesis 9:3, we find “<Text style={styles.hebrew}>נָתַ֨תִּי לָ/כֶ֜ם</Text>” translated to “I gave you.” Only “<Text style={styles.hebrew}>נָתַ֨תִּי</Text>” should be tagged to “I gave” since that is the meaning of this verb with or without the “<Text style={styles.hebrew}>לְ</Text>.” Thus, “<Text style={styles.hebrew}>לְ</Text>” should be left untagged while “<Text style={styles.hebrew}>כֶ֜ם</Text>” should be tagged to “you.”
            </Text>
            <Text style={styles.example}>
              Eg. In Genesis 2:24, we find “<Text style={styles.hebrew}>וְ/הָי֖וּ לְ/בָשָׂ֥ר אֶחָֽד</Text>” translated to “and they shall become one flesh.” In this case, “<Text style={styles.hebrew}>הָי֖וּ</Text>” and “<Text style={styles.hebrew}>לְ</Text>” should be combined together and then tagged to “become” since “<Text style={styles.hebrew}>הָיָה</Text>” only carries that meaning when paired with the preposition “<Text style={styles.hebrew}>לְ</Text>”.
            </Text>
          </>
        }
        {showGreekExamples &&
          <>
            <Text style={!showHebrewExamples ? styles.firstExample : styles.example}>
              Eg. In Mark 3:20, we find “<Text style={styles.greek}>ἔρχεται εἰς οἶκον</Text>” translated to “he went home.” Only “<Text style={styles.greek}>ἔρχεται</Text>” should be tagged to “he went” since that is the meaning of this verb with or without the “<Text style={styles.greek}>εἰς</Text>.” Thus, “<Text style={styles.greek}>εἰς</Text>” should be left untagged while “<Text style={styles.greek}>οἶκον</Text>” should be tagged to “home.”
            </Text>
            <Text style={styles.example}>
              Eg. In Matthew 12:9, we find “<Text style={styles.greek}>ἦλθεν εἰς</Text>” translated to “entered.” In this case, “<Text style={styles.greek}>ἦλθεν</Text>” and “<Text style={styles.greek}>εἰς</Text>” should be combined together and then tagged to “entered” since “<Text style={styles.greek}>ἦλθεν</Text>” only carries that meaning when paired with the preposition “<Text style={styles.greek}>εἰς</Text>.”
            </Text>
          </>
        }
      </View>

      <Button
        style={styles.button}
        onPress={goToNextHelpIndex}
      >
        {i18n("Next: See some full examples")}
      </Button>

    </ScrollView>
  )

}

export default memo(VerseTaggerHelpRules, { name: 'VerseTaggerHelpRules' })
