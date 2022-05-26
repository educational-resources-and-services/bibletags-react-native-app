import React from "react"
import { StyleSheet, ScrollView, View, Text } from "react-native"

import { memo } from "../../utils/toolbox"

import SafeLayout from "../basic/SafeLayout"
import BasicHeader from "../major/BasicHeader"
import { i18n } from "inline-i18n"

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  body: {
    paddingTop: 20,
    paddingBottom: 400,
    paddingHorizontal: 20,
    width: '100%',
  },
  intro: {
    marginBottom: 7,
    fontStyle: 'italic',
  },
  point: {
    marginVertical: 7,
  },
  line: {
    marginVertical: 4,
    fontWeight: '700',
  },
  example: {
    marginVertical: 4,
    fontWeight: '200',
  },
  note: {
    marginTop: 8,
    marginBottom: 4,
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
})

const VerseTaggerHelp = ({
  style,

  eva: { style: themedStyle={} },
}) => {

  return (
    <SafeLayout>
      <BasicHeader
        title={i18n("Instructions for Tagging")}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.body}
      >

        <Text style={styles.intro}>
          {i18n("Please be careful to follow the instructions below. This will result in the best automated lexical information.")}
        </Text>

        <View style={styles.point}>
          <Text style={styles.line}>
            1. Short-tap an original language word, then all its associated translation words. Repeat. Do this for the entire verse before submitting.
          </Text>
          <Text style={styles.example}>
            Eg. In Genesis 1:1, you would tap “<Text style={styles.hebrew}>בְּ</Text>” then “In.” Next, you would tap “<Text style={styles.hebrew}>רֵאשִׁ֖ית</Text>” then “beginning.” And so on until the end of the verse.
          </Text>
          <Text style={styles.example}>
            Eg. In Romans 1:2, you would tap “<Text style={styles.greek}>ὃ</Text>” then “which.” Next, you would tap “<Text style={styles.greek}>προεπηγγείλατο</Text>” followed by tapping “he,” “promised,” and “beforehand.” And so forth.
          </Text>
          <Text style={styles.note}>
            Note: You will often find a number of words pre-tagged by our auto-tagger. You should check (and correct, when needed) these tags before submitting.
          </Text>
        </View>

        <View style={styles.point}>
          <Text style={styles.line}>
            2. Tag all translated words. This includes pronouns designated by a verb’s inflection, helping verbs, and translations you disagree with.
          </Text>
          <Text style={styles.example}>
            Eg. In John 1:43, “<Text style={styles.greek}>εὑρίσκει</Text>” should be tagged to both “He” and “found.”
          </Text>
          <Text style={styles.example}>
            Eg. In Genesis 2:5, “<Text style={styles.hebrew}>לֹ֨א הִמְטִ֜יר</Text>” is translated “had not caused it to rain.” In this case, “<Text style={styles.hebrew}>לֹ֨א</Text>” should be tagged to “not” and “<Text style={styles.hebrew}>הִמְטִ֜יר</Text>” should be tagged to “had ... caused it to rain.”
          </Text>
        </View>

        <View style={styles.point}>
          <Text style={styles.line}>
            3. DO NOT tag the indefinite article in a translation.
          </Text>
          <Text style={styles.example}>
            Eg. “<Text style={styles.greek}>ἄνθρωπος</Text>” in John 1:6 should be tagged to “man” even though it is translated “a man.”
          </Text>
        </View>

        <View style={styles.point}>
          <Text style={styles.line}>
            4. Leave words untagged when they are repeated in the translation or original language, but not in both.
          </Text>
          <Text style={styles.example}>
            Eg. In Genesis 9:12, where we find “<Text style={styles.hebrew}>בֵּינִ/י֙ וּ/בֵ֣ינֵי/כֶ֔ם</Text>” translated to “between me and you,” the second “<Text style={styles.hebrew}>בֵּין</Text>” (inflected to “<Text style={styles.hebrew}>בֵ֣ינֵי</Text>”) should be left untagged.
          </Text>
        </View>

        <View style={styles.point}>
          <Text style={styles.line}>
            5. Include a translation’s genitive or dative helper words (eg. “of” and “to” in English).
          </Text>
          <Text style={styles.example}>
            Eg. “<Text style={styles.greek}>τῶν ἀνθρώπων</Text>” in John 1:4 should be tagged to “of men.”
          </Text>
          <Text style={styles.example}>
            Eg. “<Text style={styles.hebrew}>פְּנֵ֣י</Text>” in Genesis 1:2 should be tagged to “face of.” So also “<Text style={styles.hebrew}>ר֣וּחַ</Text>” from the same verse should be tagged to “Spirit of” (even though its form can be construct or absolute) because context shows it to be in construct form.
          </Text>
        </View>

        <View style={styles.point}>
          <Text style={styles.line}>
            6. DO NOT include translation words indicated by grammatical constructions not found in the specific original word(s) you are currently tagging.
          </Text>
          <Text style={styles.example}>
            Eg. From the previous point, note that “face of” and not “the face of” should be tagged to “<Text style={styles.hebrew}>פְּנֵ֣י</Text>.” The entire phrase is “<Text style={styles.hebrew}>פְּנֵ֥י הַ/מָּֽיִם</Text>” translated to “the face of the deep.” Without “<Text style={styles.hebrew}>הַ/מָּֽיִם</Text>” it is unclear whether “<Text style={styles.hebrew}>פְּנֵ֥י</Text>” is definite or not. Therefore, the “the” before “face of” should simply remain untagged.
          </Text>
        </View>

        <View style={styles.point}>
          <Text style={styles.line}>
            7. Long press on original language words to select more than one at a time. Do this when multiple words correspond to the translation word(s).
          </Text>
          <Text style={styles.example}>
            Eg. “<Text style={styles.hebrew}>מ֥וֹת תָּמֽוּת</Text>” in Genesis 2:17 should be tagged to “shall surely die.” (It would be incorrect to say that “<Text style={styles.hebrew}>מ֥וֹת</Text>” is translated “surely” even though that is the effect of the infinitive absolute in this context.)
          </Text>
          <Text style={styles.example}>
            Eg. “<Text style={styles.greek}>τὸν Θεόν</Text>” in John 1:1 should be tagged to “God.”
          </Text>
          <Text style={styles.example}>
            Eg. However, in Matthew 1:11, we find “<Text style={styles.greek}>τοὺς ἀδελφοὺς αὐτοῦ</Text>” translated to “his brothers.” In this case, the article should be left untagged since it is not contributing to the translation of “his” or “brothers.”
          </Text>
        </View>

        <View style={styles.point}>
          <Text style={styles.line}>
            8. Only tag phrases to phrases when you must.
          </Text>
          <Text style={styles.example}>
            Eg. In Genesis 9:14, we find “<Text style={styles.hebrew}>בְּ/עַֽנְנִ֥/י עָנָ֖ן</Text>” translated to “When I bring clouds.” “<Text style={styles.hebrew}>בְּ</Text>” should be tagged to “when” and “י” should be tagged to “I.” However, the entire phrase “<Text style={styles.hebrew}>עַֽנְנִ֥– עָנָ֖ן</Text>” should be tagged to “bring clouds” since the verb does not mean “to bring” but rather “to cloud.”
          </Text>
        </View>

        <View style={styles.point}>
          <Text style={styles.line}>
            9. Only tag a preposition with a verb, if its presence changes the verb’s meaning.
          </Text>
          <Text style={styles.example}>
            Eg. You should NOT include the “<Text style={styles.hebrew}>לְ</Text>” in your tagging of the verbs in these phrases: “<Text style={styles.hebrew}>מִ֚י הִגִּ֣יד לְ/ךָ֔</Text>” “who told you” (Genesis 3:4) and “<Text style={styles.hebrew}>נָתַ֨תִּי לָ/כֶ֜ם</Text>” “I gave you” (Genesis 9:3). This is because they still mean “told” and “gave” without the “<Text style={styles.hebrew}>לְ</Text>.”
          </Text>
          <Text style={styles.example}>
            Eg. However, for “<Text style={styles.hebrew}>וְ/הָי֖וּ לְ/בָשָׂ֥ר אֶחָֽד</Text>” “and they shall become one flash” (Genesis 2:24) both “<Text style={styles.hebrew}>הָי֖וּ</Text>” and “<Text style={styles.hebrew}>לְ</Text>” should be tagged to “become” since “<Text style={styles.hebrew}>הָיָה</Text>” only carries that meaning when paired with “<Text style={styles.hebrew}>לְ</Text>”.
          </Text>
        </View>

        <View style={styles.point}>
          <Text style={styles.line}>
            10. DO NOT include a paragogic <Text style={styles.hebrew}>נ</Text> or <Text style={styles.hebrew}>ה</Text> in your tagging. DO NOT tag the particle <Text style={styles.hebrew}>אֵת</Text>.
          </Text>
          <Text style={styles.example}>
            Eg. For “<Text style={styles.hebrew}>תְּמֻתֽוּ/ן</Text>” in Genesis 3:4, only “<Text style={styles.hebrew}>תְּמֻתֽוּ</Text>” should be tagged to “you will die.” The “<Text style={styles.hebrew}>ן</Text>” should be left untagged.
          </Text>
          <Text style={styles.example}>
            Eg. For “<Text style={styles.hebrew}>בָּרָ֣א אֹת֑/וֹ</Text>” in Genesis 1:27, only “<Text style={styles.hebrew}>וֹ</Text>” should be tagged to “him.”
          </Text>
        </View>

      </ScrollView>
    </SafeLayout>
  )

}

export default memo(VerseTaggerHelp, { name: 'VerseTaggerHelp' })
