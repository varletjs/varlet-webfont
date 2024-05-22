export type Format = 'svg' | 'ttf'

export type Formats = Array<Format>

export type FormatOption = {
  copyright: null
  ts: null
  version: null
}

export type FormatsOptions = Partial<Record<Format, FormatOption>>

export type Result = {
  config?: OptionsBase;
  glyphsData?: Array<GlyphData>;
  svg?: string | Buffer;
  ttf?: Buffer;
}

export type GlyphData = {
  contents: string
  metadata?: GlyphMetadata
  srcPath: string
}

export type GlyphTransformFn = (obj: GlyphMetadata) => GlyphMetadata | Promise<GlyphMetadata>

export type GlyphMetadata = {
  name: string
  unicode?: string[]
}

export type OptionsBase = {
  configFile?: string
  dest?: string
  destCreate?: boolean
  fontName?: string | unknown
  formats?: Formats
  fontId?: string | unknown
  fontStyle?: string | unknown
  fontWeight?: string | unknown
  fixedWidth?: string | unknown
  centerHorizontally?: boolean | unknown
  normalize?: boolean
  fontHeight?: string | unknown
  round?: string | number
  descent?: string | number
  ascent?: string
  startUnicode?: string | unknown
  prependUnicode?: boolean | unknown
  metadata?: unknown
  sort?: boolean
  ligatures?: boolean
  addHashInFontUrl?: boolean | unknown
}

export type InitialOptions = OptionsBase & {
  filePath?: string
  files: string | Array<string>
  glyphTransformFn?: GlyphTransformFn
}

export interface WebfontOptions extends InitialOptions {
  formatsOptions: FormatsOptions
  maxConcurrency: number
  metadataProvider: null
}

