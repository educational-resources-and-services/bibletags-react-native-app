import React from "react"
import { StyleSheet, ScrollView, View, Text } from "react-native"

import { memo } from "../../utils/toolbox"

import SafeLayout from "../basic/SafeLayout"
import BasicHeader from "../major/BasicHeader"
import { i18n } from "inline-i18n"

const styles = StyleSheet.create({
  body: {
    marginVertical: 10,
    paddingHorizontal: 20,
    width: '100%',
  },
  intro: {
    marginVertical: 7,
    fontStyle: 'italic',
  },
  point: {
    marginVertical: 7,
  },
  line: {
    marginVertical: 4,
    fontWeight: '600',
  },
  example: {
    marginVertical: 4,
    fontWeight: '200',
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
        contentContainerStyle={styles.body}
      >

        <Text style={styles.intro}>
          {i18n("Please be careful to follow the instructions below. This will result in the best automated lexical information.")}
        </Text>

        <View style={styles.point}>
          <Text style={styles.line}>
            1. Tap an original language word, then its associated translation words. Repeat. Do this for the entire verse before submitting.
          </Text>
          <Text style={styles.example}>
            Eg. In Genesis 1:1, you would tap “<Text style={styles.hebrew}>בְּ</Text>” then “In”. Next, you would tap “<Text style={styles.hebrew}>רֵאשִׁ֖ית</Text>” then “beginning”. And so on until the end of the verse.
          </Text>
        </View>

        <View style={styles.point}>
          <Text style={styles.line}>
            2. DO NOT tag the indefinite article in a translation.
          </Text>
          <Text style={styles.example}>
            Eg. “<Text style={styles.greek}>ἄνθρωπος</Text>” in John 1:6 should be tagged to “man” even though it is translated “a man”.
          </Text>
        </View>

        <View style={styles.point}>
          <Text style={styles.line}>
            3. DO include a translation’s genitive or dative helper words (eg. “of” and “to” in English) when you tag Hebrew in the construct form or Greek genitives.
          </Text>
          <Text style={styles.example}>
            Eg. “<Text style={styles.greek}>τῶν ἀνθρώπων</Text>” in John 1:4 should be tagged to “of men”.
          </Text>
          <Text style={styles.example}>
            Eg. “<Text style={styles.hebrew}>פְּנֵ֣י</Text>” in Genesis 1:2 should be tagged to “face of”. So also “<Text style={styles.hebrew}>ר֣וּחַ</Text>” from the same verse should be tagged to “Spirit of” (even though its form can be construct or absolute) because the translation interprets it to be in construct form.
          </Text>
        </View>

        <View style={styles.point}>
          <Text style={styles.line}>
            4. Long press on original language words to select more than one at a time. Do this when multiple words correspond to the translation word(s).
          </Text>
          <Text style={styles.example}>
            Eg. “<Text style={styles.hebrew}>מ֥וֹת תָּמֽוּת</Text>” in Genesis 2:17 should be tagged to “shall surely die”. (It would be incorrect to say that “<Text style={styles.hebrew}>מ֥וֹת</Text>” is translated “surely” even though that is the effect of the infinitive absolute in this context.)
          </Text>
          <Text style={styles.example}>
            Eg. “<Text style={styles.greek}>τὸν Θεόν</Text>” in John 1:1 should be tagged to “God”.
          </Text>
        </View>

      </ScrollView>
    </SafeLayout>
  )

}

export default memo(VerseTaggerHelp, { name: 'VerseTaggerHelp' })
