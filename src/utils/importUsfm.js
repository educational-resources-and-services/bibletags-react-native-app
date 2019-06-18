import { FileSystem, Asset, SQLite } from 'expo'
import bibleVersions from '../../versions.js'

const importUsfm = async () => {

  const sqliteDir = `${FileSystem.documentDirectory}SQLite`

  try {
    await FileSystem.makeDirectoryAsync(sqliteDir, { intermediates: true })
  } catch(e) {}

  for(let idx in bibleVersions) {
    const { exists } = await FileSystem.getInfoAsync(`${sqliteDir}/${bibleVersions[idx].id}.db`)

    if(!exists) {
    // if(exists) {
    //   await FileSystem.deleteAsync(`${sqliteDir}/${bibleVersions[idx].id}.db`)
    // }

      console.log(`Copy ${bibleVersions[idx].id} to SQLite dir...`)

      const { localUri, uri } = Asset.fromModule(bibleVersions[idx].file)

      if(localUri) {
        await FileSystem.copyAsync({
          from: localUri,
          to: `${sqliteDir}/${bibleVersions[idx].id}.db`
        })
      } else {
        await FileSystem.downloadAsync(
          uri,
          `${sqliteDir}/${bibleVersions[idx].id}.db`
        )
      }

    }
  }

}

export default importUsfm