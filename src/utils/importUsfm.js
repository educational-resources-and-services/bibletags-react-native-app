import { AsyncStorage } from "react-native"
import { Asset } from "expo-asset"
import * as FileSystem from "expo-file-system"
import bibleVersions, { bibleVersionsToRemove } from "../../versions"

const importUsfm = async () => {

  const sqliteDir = `${FileSystem.documentDirectory}SQLite`

  try {
    await FileSystem.makeDirectoryAsync(sqliteDir, { intermediates: true })
  } catch(e) {}

  // remove bible versions which are no longer a part of the app
  for(let idx in bibleVersionsToRemove) {
    const versionId = bibleVersionsToRemove[idx]

    const { exists } = await FileSystem.getInfoAsync(`${sqliteDir}/${versionId}.db`)

    if(exists) {
      console.log(`Removing ${versionId} from SQLite...`)
      await FileSystem.deleteAsync(`${sqliteDir}/${versionId}.db`)
      console.log(`...done.`)
    }
  }

  // copy in needed bible versions
  for(let idx in bibleVersions) {
    const versionId = bibleVersions[idx].id
    const fileRevisionNum = `${bibleVersions[idx].fileRevisionNum || 0}`
    const fileRevisionKey = `fileRevisionNum-${versionId}`

    let { exists } = await FileSystem.getInfoAsync(`${sqliteDir}/${versionId}.db`)

    if(exists) {

      // first remove bible versions which have an update
      if(await AsyncStorage.getItem(fileRevisionKey) !== fileRevisionNum) {

        console.log(`Removing ${versionId} from SQLite (there is a new revision)...`)

        await FileSystem.deleteAsync(`${sqliteDir}/${versionId}.db`)
        exists = false

        console.log(`...done.`)

      }
    }

    if(!exists) {

      console.log(`Copy ${versionId} to SQLite dir...`)

      const { localUri, uri } = Asset.fromModule(bibleVersions[idx].file)

      if(localUri) {
        await FileSystem.copyAsync({
          from: localUri,
          to: `${sqliteDir}/${versionId}.db`
        })
      } else {
        await FileSystem.downloadAsync(
          uri,
          `${sqliteDir}/${versionId}.db`
        )
      }

      await AsyncStorage.setItem(fileRevisionKey, fileRevisionNum)

      console.log(`...done.`)

    }
  }

}

export default importUsfm