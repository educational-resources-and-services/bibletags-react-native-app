import React from "react"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"
import { StyleSheet } from "react-native"
import { Container, Content, Body, List } from "native-base"

import { i18n } from "inline-i18n"
import { languageOptions } from "../../../language"

import BasicHeader from "../major/BasicHeader"
import LanguageItem from "../basic/LanguageItem"

const styles = StyleSheet.create({
  containerLowLight: {
    backgroundColor: 'black',
  },
  body: {
    width: '100%',
  },
  bodyLowLight: {
    backgroundColor: 'black',
  },
  list: {
    width: '100%',
  },
  listLowLight: {
    color: 'white',
  },
})

const LanguageChooser = ({
  displaySettings,
}) => {

  const { theme } = displaySettings

  return (
    <Container style={theme === 'low-light' ? styles.containerLowLight : {}}>
      <BasicHeader
        title={i18n("Change app language")}
      />
      <Content>
        <Body
          style={[
            styles.body,
            (theme === 'low-light' ? styles.bodyLowLight : null),
          ]}
        >
          <List style={styles.list}>
            {languageOptions.map(({ locale, label }) => (
              <LanguageItem
                key={locale}
                locale={locale}
                label={label}
              />
            ))}
          </List>
        </Body>
      </Content>
    </Container>
  )

}

const mapStateToProps = ({ displaySettings }) => ({
  displaySettings,
})

const matchDispatchToProps = dispatch => bindActionCreators({
  // setTheme,
}, dispatch)

export default connect(mapStateToProps, matchDispatchToProps)(LanguageChooser)