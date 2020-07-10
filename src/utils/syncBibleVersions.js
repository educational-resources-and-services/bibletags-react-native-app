import Constants from "expo-constants"
import { AsyncStorage } from "react-native"
import { Asset } from "expo-asset"
import * as FileSystem from "expo-file-system"

import { getVersionInfo } from "./toolbox"

const {
  DEFAULT_BIBLE_VERSIONS=['original'],
} = Constants.manifest.extra

const sqliteDir = `${FileSystem.documentDirectory}SQLite`

const noop = () => {}

const setUpVersion = async ({ id, setBibleVersionDownloadStatus=noop, removeBibleVersion=noop, forceRemove }) => {
  const versionInfo = getVersionInfo(id)

  const fileRevisionNum = `${(versionInfo || {}).fileRevisionNum || 0}`
  const fileRevisionKey = `fileRevisionNum-${id}`

  let { exists } = await FileSystem.getInfoAsync(`${sqliteDir}/${id}.db`)

  if(exists) {

    // first remove if it has an update
    if(
      !versionInfo
      || await AsyncStorage.getItem(fileRevisionKey) !== fileRevisionNum
      || forceRemove
    ) {

      console.log(`Removing ${id} from SQLite (there is a new revision)...`)

      if(!versionInfo) {
        removeBibleVersion({ id })
      } else if(!forceRemove) {
        setBibleVersionDownloadStatus({ id, downloaded: false })
      }

      await AsyncStorage.removeItem(fileRevisionKey)
      await FileSystem.deleteAsync(`${sqliteDir}/${id}.db`)
      exists = false

      console.log(`...done.`)

    }
  }

  if(!versionInfo || forceRemove) return

  if(!exists) {

    console.log(`Copy ${id} to SQLite dir...`)

    const { localUri, uri } = Asset.fromModule(versionInfo.file)

    if(localUri) {
      console.log(`...via local file...`)
      await FileSystem.copyAsync({
        from: localUri,
        to: `${sqliteDir}/${id}.db`
      })
    } else {
      console.log(`...via download...`)
      await FileSystem.downloadAsync(
        uri,
        `${sqliteDir}/${id}.db`
      )
    }

    await AsyncStorage.setItem(fileRevisionKey, fileRevisionNum)

    console.log(`...done.`)

  }

  setBibleVersionDownloadStatus({ id, downloaded: true })

}

const syncBibleVersions = async ({ versionIds, setBibleVersionDownloadStatus, removeBibleVersion }={}) => {

  const { exists } = await FileSystem.getInfoAsync(sqliteDir)

  try {
    await FileSystem.makeDirectoryAsync(sqliteDir, { intermediates: true })
  } catch(e) {}

  if(versionIds) {
    // Add/update all versions in versionIds

    for(let idx in versionIds) {
      await setUpVersion({ id: versionIds[idx], setBibleVersionDownloadStatus, removeBibleVersion })
    }

    // Remove any version not in versionIds
    const dbFilenames = await FileSystem.readDirectoryAsync(sqliteDir)

    for(let idx in dbFilenames) {
      const [ x, id ] = dbFilenames[idx].match(/^(.*)\.db$/)
      if(!versionIds.includes(id)) {
        await setUpVersion({ id, setBibleVersionDownloadStatus, removeBibleVersion, forceRemove: true })
      }
    }

  } else if(!exists) {
    // This is the first open
    // Set up default versions

    for(let idx in DEFAULT_BIBLE_VERSIONS) {
      await setUpVersion({ id: DEFAULT_BIBLE_VERSIONS[idx], setBibleVersionDownloadStatus, removeBibleVersion })
    }

  } else {
    // This is not the first open
    // Delete any removed versions and update versions where needed

    const dbFilenames = await FileSystem.readDirectoryAsync(sqliteDir)

    for(let idx in dbFilenames) {
      const [ x, id ] = dbFilenames[idx].match(/^(.*)\.db$/)
      await setUpVersion({ id, setBibleVersionDownloadStatus, removeBibleVersion })
    }

  }

}

export default syncBibleVersions