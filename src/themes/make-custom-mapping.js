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
  alt4Color: "rgba(0, 0, 0, .3)", // semiSelectedVsThemedStyle
  alt5Color: "black", // selectedWordThemedStyle
  alt6TextShadowColor: "black", // selectedWordThemedStyle
  alt6Color: "black", // selectedVsThemedStyle
  alt7Color: "border-danger-color-3",  // matchThemedStyle

  alt9Color: "color-basic-600", // mt
  alt9Color: "color-basic-800", // ms
  alt10Color: "color-basic-600", // s1
  alt11Color: "color-basic-600", // s2

  alt12Color: "color-basic-500", // peh
  alt13Color: "color-basic-500", // samech
  alt14Color: "color-basic-600", // selah
  alt15Color: "color-basic-400", // x
  alt16Color: "color-primary-400", // xt
  alt17Color: "color-primary-700", // xt:selected
  alt17TextShadowColor: "color-primary-200", // xt:selected
  alt18Color: "color-primary-500", // f
  alt19Color: "color-info-500", // fe
  alt20Color: "color-basic-600", // fk

  alt21Color: "color-warning-600", // s3
  alt22Color: "color-basic-500", // qa
}

const mapping = {

  // See https://github.com/eva-design/eva/blob/master/packages/eva/mapping.json  

  // Eg.
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
          unselected: {},
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
      component: 'RecentSearch',
      parameters: {
        backgroundColor: "color-danger-700",
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
      component: 'SearchResult',
      parameters: {
        labelColor: "text-basic-color",
      },
    },
    {
      component: 'SearchSuggestion',
      parameters: {
        labelColor: "color-basic-1100",
        alt0Color: "color-basic-600",
        alt1Color: "color-basic-700",
        alt2Color: "color-basic-700",
      },
      variantGroups: {
        uiStatus: {
          unselected: {},
          disabled: {
            opacity: 0.35,
          },
        },
      },
    },
    {
      component: 'SearchSuggestions',
      parameters: {
        backgroundColor: "background-basic-color-1",
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
        backgroundColor: "background-basic-color-1",
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
      component: 'PassageChooser',
      parameters: {
        backgroundColor: "background-basic-color-4",
        labelColor: "text-basic-color",
        alt0BackgroundColor: "color-basic-transparent-600",
        alt1BackgroundColor: "background-basic-color-2",
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
      component: 'RecentSection',
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
      component: 'Definition',
      parameters: {
        borderTopColor: "rgba(0, 0, 0, .15)",
        // alt0Color: "", // lemmaThemedStyle
        alt1Color: "color-basic-600", // transliterationThemedStyle
        // alt2Color: "", // strongsThemedStyle
        alt3Color: "color-basic-700", // numThemedStyle
        // alt4Color: "", // definitionThemedStyle
        // alt5Color: "", // posThemedStyle
      },
    },
    {
      component: 'LanguageChooser',
      parameters: {
        backgroundColor: "background-basic-color-1",
      },
    },
    {
      component: 'Search',
      parameters: {
        color: "color-basic-transparent-600",
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
    ...MAPPING_CUSTOMIZATION,
  ]),
  
}

;(async () => {

  await fs.writeFile('./custom-mapping.json', JSON.stringify(mapping, null, '\t'), 'utf8')

})()