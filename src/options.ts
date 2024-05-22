import { InitialOptions, WebfontOptions } from './types'

type OptionsGetter = (initialOptions?: InitialOptions) => WebfontOptions

export const getOptions: OptionsGetter = (initialOptions) => {
  if (!initialOptions || !initialOptions.files) {
    throw new Error('You must pass webfont a `files` glob')
  }

  return {
    centerHorizontally: false,
    descent: 0,
    fixedWidth: false,
    fontHeight: null,
    fontId: null,
    fontName: 'webfont',
    fontStyle: '',
    fontWeight: '',
    formats: ['svg', 'ttf'],
    formatsOptions: {
      ttf: {
        copyright: null,
        ts: null,
        version: null,
      },
    },
    glyphTransformFn: undefined,
    ligatures: true,
    maxConcurrency: 100,
    metadata: null,
    metadataProvider: null,
    normalize: false,
    prependUnicode: false,
    round: 10e12,
    sort: true,
    startUnicode: 0xea01,
    ...initialOptions,
  }
}
