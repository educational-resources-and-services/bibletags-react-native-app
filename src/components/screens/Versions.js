import React, { useState, useMemo, useCallback, useRef } from "react"
import { StyleSheet, Text } from "react-native"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"
import { styled } from "@ui-kitten/components"
import { Switch, Route } from "react-router-native"
import { i18n } from "inline-i18n"
import SortableList from "react-native-sortable-list"

import useRouterState from "../../hooks/useRouterState"
import useBibleVersions from "../../hooks/useBibleVersions"
import useThemedStyleSets from "../../hooks/useThemedStyleSets"
import SafeLayout from "../basic/SafeLayout"
import VersionInfo from "./VersionInfo"
import AddVersion from "./AddVersion"
import BasicHeader from "../major/BasicHeader"
import VersionItem from "../basic/VersionItem"
import HeaderIconButton from "../basic/HeaderIconButton"
import { setMyBibleVersionsOrder, removeBibleVersion, removeParallelVersion } from "../../redux/actions"

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: 10,
  },
  label: {
    paddingHorizontal: 20,
    paddingVertical: 7,
    fontSize: 11,
  },
})

const Versions = ({
  style,
  labelStyle,

  themedStyle,

  myBibleVersions,

  setMyBibleVersionsOrder,
  removeBibleVersion,
  removeParallelVersion,
}) => {

  const { baseThemedStyle, labelThemedStyle } = useThemedStyleSets(themedStyle)

  const [ reordering, setReordering ] = useState(false)

  const currentOrder = useRef()

  const { historyPush } = useRouterState()

  const { versionIds, requiredVersionIds, unusedVersionIds, getVersionStatus, getParallelIsAvailable } = useBibleVersions({ myBibleVersions })

  const renderItem = ({ data: versionId, active }) => {
    const { download, downloaded } = getVersionStatus(versionId)

    return (
      <VersionItem
        key={versionId}
        versionId={versionId}
        active={active}
        reorderable={true}
        reordering={reordering}
        downloading={download && !downloaded}
        downloaded={downloaded}
        options={[
          {
            title: i18n("Version information"),
            onPress: () => {
              historyPush(
                "/Read/Versions/VersionInfo",
                {
                  versionId,
                },
              )
            },
          },
          ...(requiredVersionIds.includes(versionId) ? [] : [{
            title: i18n("Remove"),
            onPress: () => {
              if(!getParallelIsAvailable({ versionIdToRemove: versionId })) {
                removeParallelVersion()
              }
              removeBibleVersion({
                id: versionId,
              })
            },
          }]),
        ]}
      />
    )
}

  const extraButtons = useMemo(
    () => [
      <HeaderIconButton
        key="reorder"
        name={"md-reorder"}
        onPress={() => {
          setReordering(!reordering)
          if(currentOrder.current) {
            setMyBibleVersionsOrder({ ids: currentOrder.current.map(idx => versionIds[idx]) })
            currentOrder.current = undefined
          }
        }}
        uiStatus={reordering ? `selected` : `unselected`}
      />,
      <HeaderIconButton
        key="add"
        name={"md-add"}
        onPress={() => historyPush("/Read/Versions/AddVersion")}
        uiStatus={(reordering || unusedVersionIds.length === 0) ? `disabled` : `unselected`}
      />,
    ],
    [ reordering, unusedVersionIds ],
  )

  const onReleaseRow = useCallback(
    (x, newOrder) => {
      currentOrder.current = newOrder
    },
    [ versionIds ],
  )

  return (
    <Switch>
      <Route path="/Read/Versions/VersionInfo" component={VersionInfo} />
      <Route path="/Read/Versions/AddVersion" component={AddVersion} />
      <Route>

        <SafeLayout>
          <BasicHeader
            title={i18n("My Bible versions")}
            extraButtons={extraButtons}
            disableBack={reordering}
          />
          {reordering &&
            <Text
              style={[
                styles.label,
                labelThemedStyle,
                labelStyle,
              ]}
            >
              {i18n("Drag to reorder")}
            </Text>
          }
          <SortableList
            key={JSON.stringify(versionIds)}
            style={[
              styles.list,
              baseThemedStyle,
              style,
            ]}
            contentContainerStyle={styles.contentContainer}
            data={versionIds}
            renderRow={renderItem}
            scrollEnabled={!reordering}
            sortingEnabled={reordering}
            onReleaseRow={onReleaseRow}
          />
        </SafeLayout>

      </Route>
    </Switch>
  )

}

Versions.styledComponentName = 'Versions'

const mapStateToProps = ({ myBibleVersions }) => ({
  myBibleVersions,
})

const matchDispatchToProps = dispatch => bindActionCreators({
  setMyBibleVersionsOrder,
  removeBibleVersion,
  removeParallelVersion,
}, dispatch)

export default styled(connect(mapStateToProps, matchDispatchToProps)(Versions))