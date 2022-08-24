const deepmerge = require("deepmerge")
const fs = require('fs').promises

const { MAPPING_CUSTOMIZATION=[] } = require("../../app.json").expo.extra

const objectMap = (obj, fn) => (
  Object.fromEntries(
    Object.entries(obj).map(
      ([k, v], i) => [k, fn(v, k, i)]
    )
  )
)

const getComponentSetup = ({ parameters={}, appearance="default", variantGroups={}, isCustom=true }={}) => {

  let { state, ...parametersIncludingFromVariantGroups } = parameters
  const states = {}

  const addToStates = stateValue => {
    if(!states[stateValue]) {
      states[stateValue] = {
        default: false,
        priority: Object.keys(states).length,
        scope: 'all',
      }
    }
  }

  const addToParametersAndStates = state => {
    for(let stateValue in state) {
      parametersIncludingFromVariantGroups = {
        ...parametersIncludingFromVariantGroups,
        ...state[stateValue],
      }

      addToStates(stateValue)
    }
  }

  addToStates('none')  // It is unclear why this is needed, but it is.
  addToParametersAndStates(state)

  for(let group in variantGroups) {
    for(let groupValue in variantGroups[group]) {

      const { state={}, ...params } = variantGroups[group][groupValue]

      parametersIncludingFromVariantGroups = {
        ...parametersIncludingFromVariantGroups,
        ...params,
      }

      addToParametersAndStates(state)
    }
  }

  return {
    meta: {
      parameters: objectMap(parametersIncludingFromVariantGroups, val => ({
        type: typeof val,
      })),
      ...(!isCustom ? {} : {
        variantGroups: objectMap(variantGroups, group => (
          objectMap(group, (val, key, index) => ({
            default: false,
          }))
        )),
        states,
        appearances: {
          [appearance]: {
            default: appearance === 'default',
          },
        },  
      }),
    },
    appearances: {
      [appearance]: {
        mapping: parameters,
        variantGroups,
      },
    },
  }
}

const getComponentMapping = componentInfos => (
  deepmerge.all(
    componentInfos.map(({ component, ...info }) => ({
      [component]: getComponentSetup(info),
    }))
  )
)

const readTextAndVerseParameters = {
  alt0Opacity: 0.2, // unfocussedBlockThemedStyle
  alt1Color: "rgba(0, 0, 0, .2)", // unfocussedThemedStyle
  alt2Opacity: 0.1, // unselectedBlockThemedStyle
  alt3Color: "rgba(0, 0, 0, .1)", // unselectedThemedStyle
  alt4Color: "rgba(0, 0, 0, .2)", // semiSelectedVsThemedStyle
  alt5Color: "black", // selectedWordThemedStyle
  alt6TextShadowColor: "black", // selectedWordThemedStyle
  alt6Color: "black", // selectedVsThemedStyle
  alt7Color: "color-danger-500",  // matchThemedStyle
  alt8TextDecorationLine: "line-through",  // usedWordThemedStyle
  alt8Color: "color-basic-500",  // usedWordThemedStyle

  alt9Color: "color-basic-600", // mt, mt1
  alt10Color: "color-basic-600", // mte, mte1
  alt11Color: "color-basic-800", // ms, ms1
  alt12Color: "color-basic-600", // mr
  alt13Color: "color-basic-600", // s, s1
  alt14Color: "color-basic-600", // s2
  alt15Color: "color-basic-500", // s3
  alt16Color: "color-basic-600", // sr
  alt17Color: "color-basic-600", // r
  alt18Color: "color-basic-600", // rq
  alt19Color: "color-basic-600", // sp

  alt20Color: "color-basic-500", // peh
  alt21Color: "color-basic-500", // samech
  alt22Color: "color-basic-600", // selah
  alt23Color: "color-basic-400", // x
  alt24Color: "color-primary-400", // xt
  alt25Color: "color-primary-700", // xt:selected
  alt25TextShadowColor: "color-primary-200", // xt:selected
  alt26Color: "color-primary-500", // f
  alt27Color: "color-info-500", // fe
  alt28Color: "color-basic-600", // fk
  
  alt29Color: "color-warning-600", // s3
  alt30Color: "color-basic-500", // qa
  alt31Color: "color-info-500", // zApparatusJson
}

const mapping = {

  // See https://github.com/eva-design/eva/blob/master/packages/eva/mapping.json  

  // E.g.
  // components: {
  //   TopNavigation: {
  //     appearances: {
  //       default: {
  //         mapping: {
  //           titleLineHeight: 150,
  //         },
  //       },
  //     },
  //   },
  // },
  
  components: getComponentMapping([
    {
      component: 'Layout',
      parameters: {
        flex: 1,
      },
      isCustom: false,
    },
    {
      component: 'OverflowMenu',
      parameters: {
        borderWidth: 1,
        borderColor: "border-basic-color-3",
        borderRadius: 0,
      },
      isCustom: false,
    },
    {
      component: 'AppHeader',
      parameters: {
        backgroundColor: "background-basic-color-1",
        borderColor: "color-basic-active-border",
      },
      variantGroups: {
        uiStatus: {
          selected: {
            backgroundColor: "background-alternative-color-4",
          },
        },
      },
    },
    {
      component: 'StatusBarWithBackground',
      parameters: {
        backgroundColor: "background-basic-color-1",
      },
    },
    {
      component: 'ChooserBook',
      variantGroups: {
        uiStatus: {
          unselected: {},
          selected: {
            backgroundColor: "background-alternative-color-4",
            labelColor: "text-alternate-color",
          },
        },
      },
    },
    {
      component: 'ChooserChapter',
      variantGroups: {
        uiStatus: {
          unselected: {},
          selected: {
            backgroundColor: "background-alternative-color-4",
            labelColor: "text-alternate-color",
          },
        },
      },
    },
    {
      component: 'ChooserVersion',
      variantGroups: {
        uiStatus: {
          disabled: {
            labelColor: "color-basic-500",
          },
          unselected: {
          },
          selected: {
            backgroundColor: "background-alternative-color-4",
            labelColor: "text-alternate-color",
            iconColor: "color-basic-600",
          },
        },
      },
    },
    {
      component: 'CoverAndSpin',
      parameters: {
        backgroundColor: "background-basic-color-1",
      },
    },
    {
      component: 'LanguageItem',
      variantGroups: {
        uiStatus: {
          unselected: {},
          selected: {
            color: "border-danger-color-3",
            fontWeight: 'bold',
          },
        },
      },
    },
    {
      component: 'RecentBookmark',
      parameters: {
        labelColor: "text-control-color",
      },
    },
    {
      component: 'RecentRef',
      variantGroups: {
        uiStatus: {
          unselected: {
            backgroundColor: "color-basic-600",
          },
          selected: {
            backgroundColor: "background-alternative-color-4",
          },
        },
      },
    },
    {
      component: 'Verse',
      parameters: readTextAndVerseParameters,
      variantGroups: {
        uiStatus: {
          unselected: {
            color: "text-hint-color",
          },
          selected: {
            color: "text-basic-color",
          },
        },
      },
    },
    {
      component: 'Spin',
      parameters: {
        color: "border-danger-color-3",
        backgroundColor: "background-basic-color-2",
      },
    },
    {
      component: 'TapOptions',
      parameters: {
        labelColor: "text-alternate-color",
        backgroundColor: "background-alternative-color-1",
      },
    },
    {
      component: 'DisplaySettings',
      parameters: {
        labelColor: "text-basic-color",
        alt0MinimumTrackTintColor: "color-danger-700",
        alt0MaximumTrackTintColor: "color-basic-500",
        alt0ThumbTintColor: "color-danger-700",
      },
    },
    {
      component: 'Drawer',
      parameters: {
        color: "color-basic-700",
        labelColor: "color-basic-600",
        alt0BackgroundColor: "background-basic-color-2",
        alt1Color: "color-basic-500",
      },
    },
    {
      component: 'DrawerStatusItem',
      parameters: {
        color: "color-basic-700",
      },
    },
    {
      component: 'PassageChooser',
      parameters: {
        backgroundColor: "background-basic-color-4",
        labelColor: "text-basic-color",
        alt0BackgroundColor: "color-basic-transparent-600",  // parallelLabelContainerThemedStyle
        alt1BackgroundColor: "background-basic-color-1",  // addParallelContainerThemedStyle
        alt2BackgroundColor: "background-basic-color-3",  // addParallelButtonThemedStyle
        alt3BackgroundColor: "background-basic-color-2",  // bookListThemedStyle
        // alt4: "",  // extras
      },
    },
    {
      component: 'VersionChooser',
      parameters: {
        iconColor: "color-basic-600",  //info icon
      },
      variantGroups: {
        type: {
          primary: {
            backgroundColor: "background-basic-color-1",
          },
          secondary: {
            backgroundColor: "background-basic-color-3",
          },
          search: {
            backgroundColor: "background-basic-color-1",
          },
        },
      },
    },
    {
      component: 'ReadContentPage',
      parameters: {
        backgroundColor: "background-basic-color-3",
      },
    },
    {
      component: 'ReadHeader',
      parameters: {
        color: "text-hint-color",
        iconColor: "color-basic-800",  // drop down arrow
      },
    },
    {
      component: 'GradualFade',
    },
    {
      component: 'ReadText',
      parameters: readTextAndVerseParameters,
    },
    {
      component: 'Splash',
      parameters: {
        backgroundColor: "background-basic-color-1",
      },
    },
    {
      component: 'OriginalWordInfo',
      parameters: {
        backgroundColor: '#E9E9E9',
      },
    },
    {
      component: 'Definition',
      parameters: {
        backgroundColor: '#CCC',
        // alt0Color: "", // lexThemedStyle
        alt1Color: "rgba(0,0,0,.5)", // vocalThemedStyle
        alt2Color: "rgba(0,0,0,.5)", // strongsHashThemedStyle
        // alt3Color: "", // strongsThemedStyle
        alt4Color: "rgba(0,0,0,.5)", // numThemedStyle
        // alt5Color: "", // definitionThemedStyle
        alt6Color: "rgba(0,0,0,.3)", // posThemedStyle
        alt7Color: "rgba(0,0,0,.5)", // selectedPosThemedStyle
      },
    },
    {
      component: 'LowerPanelVsComparison',
    },
    {
      component: 'ExtendedDefinition',
    },
    {
      component: 'TranslationBreakdown',
      parameters: {
        backgroundColor: '#DADADA',
      },
    },
    {
      component: 'LanguageChooser',
      parameters: {
        backgroundColor: "background-basic-color-1",
      },
    },
    {
      component: 'VersionInfo',
      parameters: {
        color: 'color-info-focus',
      },
    },
    {
      component: 'Versions',
      parameters: {
        backgroundColor: "background-basic-color-1",
        labelBackgroundColor: "color-primary-transparent-300",
        labelColor: "color-basic-900",
      },
    },
    {
      component: 'AddVersion',
      parameters: {
        backgroundColor: "background-basic-color-1",
        labelBackgroundColor: "color-primary-transparent-300",
        labelColor: "color-basic-900",
      },
    },
    {
      component: 'VersionItem',
      parameters: {
        backgroundColor: "background-basic-color-1",
        alt1Color: "color-basic-600",  // languageThemedStyle
        alt2TintColor: "color-warning-500",  // offlineIconThemedStyle
      },
    },
    {
      component: 'HeaderIconButton',
    },
    {
      component: 'Icon',
      variantGroups: {
        uiStatus: {
          unselected: {},
          selected: {
            color: "color-primary-600",
          },
          disabled: {
            color: "color-basic-500",
          },
        },
      },
    },
    {
      component: 'NotYetTagged',
      parameters: {
        labelColor: "color-basic-600",
      },
    },
    {
      component: 'StatusIcon',
      parameters: {
        labelColor: "color-basic-600",
        alt0Color: "color-basic-500",  // noneIconThemedStyle
        alt1Color: "color-danger-500",  // automatchIcomThemedStyle
        alt2Color: "color-warning-500",  // unconfirmedIconThemedStyle
        alt3Color: "color-primary-500",  // confirmedIconThemedStyle
      },
    },
    {
      component: 'VerseTagger',
    },
    {
      component: 'VerseTaggerContent',
      parameters: {
        alt0Color: "color-basic-600",  // translationThemedStyle
        alt1Color: "text-danger-color",  // unselectedWordThemedStyle
        alt2TextDecorationLine: "line-through",  // selectedWordThemedStyle
      },
    },
    {
      component: 'TaggerVerse',
      parameters: {
        alt0Color: "color-basic-600",  // wordThemedStyle
        alt1Color: "text-danger-color",  // unusedWordThemedStyle
        alt2Color: "color-basic-1100",  // selectedWordThemedStyle
        alt2BackgroundColor: "color-basic-transparent-100",  // selectedWordThemedStyle
        alt2BorderColor: "border-alternative-color-5",  // selectedWordThemedStyle
        alt2Color: "color-basic-1100",  // selectedWordThemedStyle
        alt3Color: "color-basic-500",  // slashThemedStyle
        alt4Color: "color-basic-600",  // translationWordsThemedStyle
        alt5Color: "color-basic-1100",  // selectedTranslationWordThemedStyle
      },
    },
    {
      component: 'Dialog',
      parameters: {
        backgroundColor: "background-basic-color-1",
        labelColor: "text-basic-color",
      },
    },
    {
      component: 'ConfirmTagSubmissionButton',
      parameters: {
        alt0Color: "text-danger-color",  // untaggedWordThemedStyle
      },
    },
    {
      component: 'VerseTaggerHelp',
      parameters: {
        labelBackgroundColor: "color-primary-500",  // the dot
      },
    },
    {
      component: 'VerseTaggerHelpWhy',
      parameters: {
        labelColor: "color-info-700",  // headingThemedStyle
      },
    },
    {
      component: 'VerseTaggerHelpHow',
      parameters: {
        labelColor: "color-info-700",  // headingThemedStyle
      },
    },
    {
      component: 'VerseTaggerHelpRules',
      parameters: {
        labelColor: "color-info-700",  // headingThemedStyle
      },
    },
    {
      component: 'VerseTaggerHelpExamples',
    },
    {
      component: 'DrawerItem',
    },
    {
      component: 'InlineLink',
      parameters: {
        color: "color-primary-500",
      },
    },
    {
      component: 'OriginalWordBehindTranslation',
      parameters: {
        labelColor: "color-basic-600",
      },
    },
    {
      component: 'SearchX',
      parameters: {
        color: "color-basic-transparent-600",
      },
    },
    {
      component: 'RecentSection',
    },
    {
      component: 'RecentSearch',
      parameters: {
        backgroundColor: "color-danger-700",
      },
    },
    {
      component: 'Search',
      parameters: {
        alt0BackgroundColor: "color-basic-active-border",  // dividerThemedStyle
      },
    },
    {
      component: 'SearchTabBible',
    },
    {
      component: 'SearchTabOriginalWord',
    },
    {
      component: 'SearchTabOther',
    },
    {
      component: 'SearchTabRecent',
    },
    {
      component: 'SearchTabSuggestions',
      parameters: {
        labelColor: "color-basic-600",
      },
    },
    {
      component: 'SearchTabSuggestion',
    },
    {
      component: 'SearchTabTips',
      parameters: {
        alt0Color: "color-basic-800",  // tipTitleThemedStyle
        alt1Color: "color-basic-600",  // exampleThemedStyle
        alt2Color: "color-basic-1100",  // exampleContentThemedStyle
        alt2BackgroundColor: "background-basic-color-2",  // exampleContentThemedStyle
        alt2BorderColor: "color-basic-active-border",  // exampleContentThemedStyle
        alt3Color: "color-basic-700",  // detailThemedStyle
        alt4Color: "color-basic-600",  // versionThemedStyle
        alt5Color: "color-basic-600",  // hashOrSlashThemedStyle
        alt6Color: "color-basic-600",  // flagThemedStyle
        alt7Color: "color-basic-600",  // noteAboutDetailsThemedStyle
        alt8Color: "color-basic-600",  // finalNoteThemedStyle
      },
    },
    {
      component: 'SearchTabTipsDetailAccordion',
      variantGroups: {
        uiStatus: {
          collapsed: {
            labelColor: "color-basic-600",
            iconTintColor: "color-basic-600",
          },
          expanded: {
          },
        },
      },
    },
    {
      component: 'AppItemSearchResults',
    },
    {
      component: 'AppItemSearchResultsRow',
    },
    {
      component: 'BibleSearchHeader',
      parameters: {
        backgroundColor: "background-basic-color-4",
      },
    },
    {
      component: 'BibleSearchOtherSuggestedQueries',
    },
    {
      component: 'BibleSearchPlusVersionsMenu',
    },
    {
      component: 'BibleSearchResults',
    },
    {
      component: 'BibleSearchResultsBookBreakdown',
    },
    {
      component: 'BibleSearchResultsOriginalRow',
      parameters: {
        labelColor: "color-basic-600",
      },
    },
    {
      component: 'BibleSearchResultsTranslationRow',
      parameters: {
        labelColor: "color-basic-600",
      },
    },
    {
      component: 'HelpItemSearchResults',
    },
    {
      component: 'HelpItemSearchResultsRow',
    },
    {
      component: 'OtherSearchResultsHeader',
    },
    {
      component: 'PassageSearchResultsRow',
    },
    {
      component: 'AllSearchResults',
    },
    {
      component: 'SearchResultsError',
    },
    {
      component: 'SearchTextField',
      variantGroups: {
        uiStatus: {
          error: {
            borderColor: "color-danger-default-border",
          },
          editing: {
            borderColor: "color-primary-500",
          },
          results: {
            backgroundColor: "background-basic-color-4",
          },
        },
      },
    },
    {
      component: 'VersionSearchResults',
    },
    {
      component: 'VersionSearchResultsRow',
    },
    {
      component: 'VerseText',
    },
    {
      component: 'PassageRef',
    },
    {
      component: 'TranslationsOfWordInMyVersions',
    },
    ...MAPPING_CUSTOMIZATION,
  ]),
  
}

;(async () => {

  await fs.writeFile('./custom-mapping.json', JSON.stringify(mapping, null, '\t'), 'utf8')

})()