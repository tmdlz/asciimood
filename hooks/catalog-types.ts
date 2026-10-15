// The shape of an ascii.rest piece module, as the mod uses it.
export type PieceMeta = { cols: number; rows: number; cell?: number; palette?: readonly string[]; ground?: string }
export type PieceFrame = (t: number, env?: { paper?: boolean; color?: Uint8Array }) => string
export type PieceModule = { meta: PieceMeta; default: () => PieceFrame }
