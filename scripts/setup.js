const fs = require('fs-extra')
const { getLanguageInfo } = require("@bibletags/bibletags-ui-helper")
require('colors')
const inquirer = require('inquirer')
inquirer.registerPrompt('search-checkbox', require('inquirer-search-checkbox'))
const { request, gql } = require('graphql-request')
const Spinnies = require('spinnies')
const spinnies = new Spinnies()
const { v4: uuidv4 } = require('uuid')

const { getVersionInfo, setVersionInfo, removeIndent } = require('./utils/fileTools')
const goSyncVersions = require('./goSyncVersions')

const TENANT_ITEMS = [ ".env", "app.json", "language.js", "fonts.js", "menu.js", "versions.js", "assets", "RouteSwitcher.js", "tenantComponents" ]
// Note: versions dir is brought over separately below, based on user choices

const graphqlUrl = `https://data.bibletags.org/graphql`

;(async () => {

  try {

    console.log(``)

    for(let tenantItem of TENANT_ITEMS) {
      if(!(await fs.pathExists(`defaultTenant/${tenantItem}`))) throw new Error(`The defaultTenant directory does not have the required contents (${tenantItem} missing).`)
      if((await fs.pathExists(`${tenantItem}`))) throw new Error(`It appears you have already run setup (${tenantItem} already exists). This script should only be run once.`)
    }

    const versionInfos = getVersionInfo({ tenantDir: `defaultTenant` })

    const getLanguageStr = languageId => {
      const { englishName, nativeName } = getLanguageInfo(languageId)
      return englishName === nativeName ? englishName : `${nativeName} (${englishName})`
    }

    const getVersionChoices = versionIds => (
      versionIds
        .map(versionId => versionInfos[versionId])
        .sort((a,b) => a.abbr < b.abbr ? -1 : 1)
        .map(({ name, abbr, id, languageId }) => ({
          name: `${name} (${abbr}) – ${getLanguageStr(languageId)} [ID: ${id}]`,
          value: id,
        }))
    )

    const { appSlug, appName, orgName, uri, contactEmail, versionIds, bundledVersionIds=[] } = (await inquirer.prompt([
      {
        type: `input`,
        name: `appSlug`,
        message: `Choose an app "slug"`+` (e.g. bibletags)`.gray,
        transformer: input => input.toLowerCase().replace(/[^a-z0-9]/g, ''),
        validate: input => !!input.trim() || `You must specify a slug.`,
      },
      {
        type: `input`,
        name: `appName`,
        message: `Choose an app name`,
        validate: input => !!input.trim() || `You must specify an app name.`,
      },
      {
        type: `input`,
        name: `orgName`,
        message: `Name of your Bible society, organization, or company`,
        validate: input => !!input.trim() || `You must specify an organization name.`,
      },
      {
        type: `input`,
        name: `uri`,
        message: `Organization website`+` (e.g. bibletags.org)`.gray,
      },
      {
        type: `input`,
        name: `contactEmail`,
        message: `Enter a valid contact email address`+` An invalid email may cause your app registration to be deleted.`.gray,
        validate: input => !!input.trim() || `You must specify a contact email.`,
      },
      {
        type: 'search-checkbox',
        name: `versionIds`,
        message: `Optionally add available open-source Bible versions`+` You can import unlisted versions later.`.gray,
        choices: getVersionChoices(Object.keys(versionInfos).filter(versionId => versionId !== `original`)),
        pageSize: 11,
      },
      {
        type: 'search-checkbox',
        name: `bundledVersionIds`,
        when: ({ versionIds }) => versionIds.length > 0,
        message: `Which versions do you want bundled within the initial app download?`+` Pick up to three.`.gray,
        choices: ({ versionIds }) => getVersionChoices(versionIds),
        validate: bundledVersionIds => bundledVersionIds.length <= 3 || `You cannot pick more than three versions to bundle.`,
      },
    ]))
    versionIds.unshift(`original`)
    bundledVersionIds.push(`original`)

    // Update versionInfos per their choices
    for(let versionId in versionInfos) {
      if(!versionIds.includes(versionId)) {
        versionInfos[versionId] = null
      } else if(bundledVersionIds.includes(versionId)) {
        versionInfos[versionId].bundled = true
      }
    }

    // Register the app with bibletags-data
    console.log(``)
    spinnies.add('add-embedding-app', { text: `Registering app at ${graphqlUrl}` })
    let response
    try {
      response = await request(
        graphqlUrl,
        gql`
          mutation {
            addEmbeddingApp(
              input: {
                uri: "${uri || appSlug}",
                appName: "${appName}",
                orgName: "${orgName}",
                contactEmail: "${contactEmail}"
              }
            ) {
              id
              uri
              notes
              awsAccessKeyId
              awsSecretAccessKey
            }
          }
        `,
      )
      spinnies.succeed('add-embedding-app', { text: `Registered app at ${graphqlUrl}` })
    } catch(err) {
      spinnies.fail('add-embedding-app', { text: `Registration failed` })
      let errMessage = `Could not register app. Report this problem to admin@bibletags.org.`
      if(/^There is already an embedding app with that uri/.test(err.message)) {
        errMessage = err.message.split(': {')[0]
      }
      throw new Error(errMessage)
    }
    const { addEmbeddingApp: { awsAccessKeyId, awsSecretAccessKey, ...embeddingApp } } = response
    console.log(``)

    // setup dev if backend exists
    const directlyAddEmbeddingAppPath = `../bibletags-data/src/scripts/directlyAddEmbeddingApp.js`
    const hasBackendSetup = !!(await fs.pathExists(directlyAddEmbeddingAppPath))
    if(hasBackendSetup) {
      console.log(`Add embeddingApp row locally...`.gray)
      const directlyAddEmbeddingApp = require(`../${directlyAddEmbeddingAppPath}`)
      await directlyAddEmbeddingApp(embeddingApp)
    }

    // Get random string for encryption
    const randomString = uuidv4()

    // Copy over files
    console.log(`Copy over files...`.gray)
    for(let tenantItem of TENANT_ITEMS) {
      await fs.copy(`defaultTenant/${tenantItem}`, tenantItem)
    }

    // Update versions.js
    console.log(`Update versions.js...`.gray)
    await setVersionInfo({ tenantDir: `.`, versionInfos })

    // Copy over chosen versions
    console.log(`Copy in chosen versions...`.gray)
    await fs.ensureDir(`versions`)
    for(let versionId of versionIds) {
      await fs.copy(`defaultTenant/versions/${versionId}`, `versions/${versionId}`)
      if(versionId !== `original` && bundledVersionIds.includes(versionId)) {
        await fs.ensureDir(`assets/bundledVersions/${versionId}`)
        await fs.copy(`versions/${versionId}/verses`, `assets/bundledVersions/${versionId}/verses`)
        const requires = Array(66).fill().map((x, idx) => `require("./verses/${idx + 1}.db"),`)
        const { partialScope } = versionInfos[versionId]
        if(partialScope === `nt`) requires.splice(0, 39)
        if(partialScope === `ot`) requires.splice(39, 27)
        const requiresContent = removeIndent(`
          const requires = [
            ${requires.join(`\n            `)}
          ]

          export default requires 
        `)
        await fs.writeFile(`assets/bundledVersions/${versionId}/requires.js`, requiresContent)
      }
    }

    // Update app.json
    console.log(`Update app.json...`.gray)
    let appJsonContents = await fs.readFile(`app.json`, { encoding: 'utf8' })
    appJsonContents = appJsonContents.replace(/\[APP_SLUG\]/g, appSlug)
    appJsonContents = appJsonContents.replace(/\[APP_NAME\]/g, appName)
    appJsonContents = appJsonContents.replace(/\[EMBEDDING_APP_ID\]/g, embeddingApp.id)
    appJsonContents = appJsonContents.replace(/\[BIBLETAGS_DATA_GRAPHQL_URI_DEV\]/g, hasBackendSetup ? `http://localhost:8082/graphql` : `https://data.bibletags.org/graphql`)
    appJsonContents = appJsonContents.replace(/\[RANDOM_STRING\]/g, randomString)
    appJsonContents = appJsonContents.replace(/"DEFAULT_BIBLE_VERSIONS"\s*:\s*(\[[^[\]]*\])/g, `"DEFAULT_BIBLE_VERSIONS": ${JSON.stringify(bundledVersionIds)}`)
    await fs.writeFile(`app.json`, appJsonContents)

    // Update .env
    console.log(`Update .env...`.gray)
    let envContents = await fs.readFile(`.env`, { encoding: 'utf8' })
    envContents = envContents.replace(/\[APP_SLUG\]/g, appSlug)
    envContents = envContents.replace(/\[EMBEDDING_APP_ID\]/g, embeddingApp.id)
    envContents = envContents.replace(/\[AWS_ACCESS_KEY_ID\]/g, awsAccessKeyId)
    envContents = envContents.replace(/\[AWS_SECRET_ACCESS_KEY\]/g, awsSecretAccessKey)
    await fs.writeFile(`.env`, envContents)

    // sync versions
    const skipSubmitWordHashes = !(await fs.pathExists(`../bibletags-data`))
    await goSyncVersions({ stage: `dev`, tenantDir: `.`, skipSubmitWordHashes, silent: true })

    console.log(``)
    console.log(`Basic setup complete.`.green.bold)
    console.log(``)
    if(hasBackendSetup) {
      console.log(`Use `.gray+`\`npm run dev\``+` to test.`.gray)
    } else {
      console.log(`Use `.gray+`\`npm start\``+` to test, `.gray+`\`npm run import-bible\``+` to add more versions, and `.gray+`\`build-ios-production\``+`/`.gray+`\`build-android-production\``+` to create builds for the app stores.`.gray)
      console.log(`NOTE: Even while testing locally, tagging data is drawn from and submitted to the production version of Bible Tags. Therefore, please only submit valid tags when testing tagging functionality.`.gray)
    }
    console.log(``)

  } catch(err) {

    console.log(``)
    console.log(`ERROR: ${err.message}`.bgRed.brightWhite)
    console.log(``)
    console.log(err)
    console.log(``)

  }

  process.exit()

})()