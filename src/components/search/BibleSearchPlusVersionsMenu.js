import { useCallback } from 'react'
import { View, Text, StyleSheet } from "react-native"
// import Menu from '@material-ui/core/Menu'
// import MenuItem from '@material-ui/core/MenuItem'
// import Checkbox from '@material-ui/core/Checkbox'
import { i18n } from "inline-i18n"

import { memo, getVersionInfo } from '../../utils/toolbox'
import useRouterState from '../../hooks/useRouterState'

const styles = StyleSheet.create({
  menuItem: {
    paddingVertical: 5,
    paddingRight: 15,
    paddingLeft: 3,
    fontSize: 14,
  },
  checkbox: {
    padding: 5,
  
    // .MuiSvgIcon-root {
    //   height: 16px;
    //   height: 16px;
    // }
  },
  plusVersions: {
    // display: inline-block;
    paddingBottom: 6,
    alignSelf: 'flex-end',
    marginLeft: 5,
    // color: ${({ theme }) => theme.palette.grey[600]};
  },
  plusVersion: {
    // display: inline-block;
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '300',
    marginLeft: 3,
  },
  plus: {
    // color: ${({ theme }) => theme.palette.grey[400]};
  },
})

const BibleSearchPlusVersionsMenu = ({
  searchText,
  includeVersionIds,
}) => {

  // const { anchorEl, openModal, closeModal } = useModalAnchor()
  const openModal = () => {}
  const closeModal = () => {}

  const { historyReplace } = useRouterState()

  const onPress = useCallback(
    ({ currentTarget }) => {

      closeModal()

      const clickedVersionId = currentTarget.getAttribute('data-version-id')
      const newIncludeVersionIds = (
        includeVersionIds.includes(clickedVersionId)
          ? includeVersionIds.filter(versionId => versionId !== clickedVersionId)
          : [ ...includeVersionIds, clickedVersionId ]
      )

      const includeAddOn = ` include:${newIncludeVersionIds.length > 0 ? newIncludeVersionIds.join(',').toUpperCase() : `none`}`
      const newSearchText = `${searchText.replace(/((?:^| )include:[A-Z0-9]{2,9}(?:,[A-Z0-9]{2,9})*(?= |$))/gi, '').replace(/  +/g, ' ')}${includeAddOn}`

      historyReplace(null, {
        searchText: newSearchText,
      })
    },
    [ searchText, includeVersionIds, closeModal ],
  )

  return (
    <>

      <View
        style={styles.plusVersions}
        onPress={openModal}
      >
        {includeVersionIds.length === 0 &&
          <Text style={styles.plusVersion}>
            <Text style={styles.plus}>{i18n("+", "combination character")}</Text>
            {i18n("Add translation")}
          </Text>
        }

        {includeVersionIds.map(versionId => (
          <Text style={styles.plusVersion} key={versionId}>
            <Text style={styles.plus}>{i18n("+", "combination character")}</Text>
            {(getVersionInfo(versionId) || {}).abbr}
          </Text>
        ))}
      </View>

      {/* <Menu
        anchorEl={anchorEl}
        open={!!anchorEl}
        onClose={closeModal}
      >
        {nonOrigSelectedVersionInfos.map(({ id, version: { name }={}, safeVersionAbbr }) => (
          <MenuItem
            key={id}
            style={styles.menuItem}
            data-version-id={id}
            onPress={onPress}
          >
            <Checkbox style={styles.checkbox} checked={includeVersionIds.includes(id)} />
            {name
              ? (
                i18n("{{version_name}} ({{version_abbreviation}})", {
                  version_name: name,
                  version_abbreviation: safeVersionAbbr,
                })
              )
              : safeVersionAbbr
            }
          </MenuItem>
        ))}
      </Menu> */}

    </>
  )
}

export default memo(BibleSearchPlusVersionsMenu, { name: 'BibleSearchPlusVersionsMenu' })