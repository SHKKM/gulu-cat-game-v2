export interface ArtApproval { readonly by: string; readonly at: string }
export interface RuntimeFrame { readonly src: string; readonly sha256: string }
export interface RuntimeAsset {
  readonly assetId: string
  readonly version: string
  readonly kind: 'animation' | 'image'
  readonly status: 'published'
  readonly approval: ArtApproval
  readonly publishedAt: string
  readonly canvas: { readonly width: number; readonly height: number }
  readonly anchor: { readonly x: number; readonly y: number }
  readonly frames: readonly RuntimeFrame[]
  readonly fps: number
  readonly loop: boolean
  readonly playback: 'forward' | 'ping-pong'
  readonly facing: 'left' | 'right'
  readonly mirrorAllowed: boolean
  readonly markers: readonly { readonly frame: number; readonly key: string }[]
}
export type AssetProblem = 'missing' | 'unapproved' | 'incompatible' | 'invalid' | 'load-failed' | 'hash-mismatch' | 'decode-failed'
export interface AssetIssue { readonly key: string; readonly code: AssetProblem; readonly message: string }
export interface ParsedAssets { readonly assets: Readonly<Record<string, RuntimeAsset>>; readonly issues: readonly AssetIssue[] }
export interface DecodedAsset { readonly definition: RuntimeAsset; readonly images: readonly CanvasImageSource[]; readonly urls: readonly string[]; readonly dispose: () => void }
export interface LoadedAssets { readonly assets: Readonly<Record<string, DecodedAsset>>; readonly issues: readonly AssetIssue[] }

