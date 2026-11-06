import { useId, useState } from 'react'
import { GuluCharacter } from '../animation/GuluCharacter'
import { useGameArt } from '../game/assets/useGameArt.ts'
import { compatibleSceneImage } from '../scene/sceneAssets.ts'
import type { CSSProperties, ReactNode } from 'react'
import { INITIAL_ROOM } from '../scene/rooms'
import type { RoomDefinition } from '../scene/rooms'
import type { ArtworkKind, SceneItem } from '../scene/roomLayout'
import { SCENE_LAYERS } from '../scene/roomLayout'
import type { TimeOfDay } from '../scene/timeOfDay'
import { timeOfDayLabels } from '../scene/timeOfDay'

function PlaceholderArt({ kind }: { kind: ArtworkKind }) {
  if (kind === 'character') return (
    <div className="character-placeholder"><span aria-hidden="true">＋</span><span>咕嚕</span><small>角色預留</small></div>
  )
  return (
    <svg viewBox="0 0 120 100" preserveAspectRatio="none" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {kind === 'window' && <>
        <path className="window-sky" d="M8 4h104v85H8z" />
        <circle className="sky-orb" cx="82" cy="27" r="10" stroke="none" />
        <path className="window-cloud" d="M17 41q8-13 17-3 12-8 18 5M68 67q10-13 20-2 9-5 16 2" />
        <path className="window-frame" d="M5 3h110v88H5zM60 5v84M7 48h105M1 92h118v6H1z" />
        <path opacity=".4" d="m17 14-3 21M22 15l-2 10" stroke="white" />
      </>}
      {kind === 'shelf' && <>
        <path fill="#e8d5b9" d="M4 76h112v10H4z" /><path d="M19 87v10M102 86v11" />
        <path fill="#d3aa8e" d="m15 73-3-40 15-2 3 42z" /><path fill="#c4c8a0" d="M33 74V23h15v51z" /><path fill="#f1dfb5" d="m53 74 6-43 13 2-5 41z" />
        <path fill="#ecdfce" d="M83 74q-8-25 7-33V25h14v17q16 14 6 32Z" /><path d="M90 26h14M17 44l10-1M36 34h9" />
      </>}
      {kind === 'sofa' && <>
        <path fill="#d8c9e6" d="M17 61V22q0-13 16-13h54q16 0 16 13v39Z" />
        <path fill="#e5d9ed" d="M18 52q42-5 84 0v23H18Z" />
        <path fill="#c8b5da" d="M6 45q0-9 12-7l6 7v22h72V45q8-12 18-6v43H6Z" />
        <path d="M16 83v10M104 83v10M60 20v27M25 72h70" />
      </>}
      {kind === 'cat-bed' && <>
        <path fill="#e3c49d" d="M7 84V43L22 10l24 15h28l25-15 14 33v41q-52 15-106 0Z" />
        <path fill="#9d8066" d="M26 83V58q0-30 34-30t34 30v25Z" />
        <path fill="#e9dbbf" d="M24 80q35-20 72 0l-2 8H26Z" />
        <path d="m21 24 7 6m68-6-7 6" />
      </>}
      {kind === 'plant' && <>
        <path d="M60 62V20M60 43 32 27M60 34 86 13" />
        <path fill="#a8b58b" d="M56 35Q21 38 26 9q26 0 30 26ZM62 27Q61 0 95 4q-2 27-33 23ZM62 56q1-26 32-22-6 26-32 22Z" />
        <path fill="#c99879" d="m30 61 9 34h43l8-34z" /><path d="M27 59h66v8H27z" fill="#dfb392" />
      </>}
      {kind === 'mat' && <>
        <ellipse cx="60" cy="62" rx="55" ry="30" fill="#c6bea2" /><path fill="#ded8bb" d="M6 48q0-32 54-32t54 32q0 24-54 24T6 48Z" />
        <ellipse cx="60" cy="46" rx="42" ry="20" strokeDasharray="3 5" /><path d="m46 38 7 4m13 5 7-4" opacity=".4" />
      </>}
      {kind === 'box' && <>
        <path fill="#d5af7a" d="M17 28h86v65H17z" /><path fill="#e9c797" d="m17 28 20-17h63l3 17z" />
        <path fill="#efd1a1" d="m17 28-13 21 39 7 17-24 17 24 39-8-13-20" /><path d="M60 57v33M28 73l9 1m-9 5 13 1" /><path d="m52 17 22 1" opacity=".5" />
      </>}
      {kind === 'rug' && <>
        <path fill="#e3b69d" d="M11 13q47-6 99 0l5 73q-50 7-110 0Z" />
        <path d="M18 24q44-4 84 0l4 50q-44 5-93 0Z" stroke="#f5debd" strokeWidth="4" />
        <path d="M4 22H0m4 15H0m4 15H0m4 15H0m4 15H0m116-60h4m-4 15h4m-4 15h4m-4 15h4m-4 15h4" />
      </>}
    </svg>
  )
}

function SceneObject({ item, size, roomId, approvedOnly }: { item: SceneItem; size: RoomDefinition['size']; roomId: string; approvedOnly: boolean }) {
  const art = useGameArt()
  const approved = art.assets[`image.item.${roomId}.${item.id}`]
  const src = approvedOnly
    ? (!item.assetId || approved?.definition.assetId === item.assetId ? compatibleSceneImage(approved, item)?.urls[0] : undefined)
    : item.src
  const [failedSrc, setFailedSrc] = useState<string>()
  const style: CSSProperties = {
    left: `${item.x / size.width * 100}%`, top: `${item.y / size.height * 100}%`,
    width: `${item.width / size.width * 100}%`, height: `${item.height / size.height * 100}%`,
    zIndex: item.layer,
  }
  return <div className={`scene-object object-${item.kind}`} data-item-id={item.id} data-scene-asset-id={src && failedSrc !== src ? approved?.definition.assetId : undefined} data-scene-art-state={src && failedSrc !== src ? 'published' : 'fallback'} style={style} role="img" aria-label={item.label}>
    {src && failedSrc !== src
      ? <img src={src} alt="" draggable={false} onError={() => setFailedSrc(src)} />
      : <PlaceholderArt kind={item.kind} />}
  </div>
}

export function RoomScene({ timeOfDay, room = INITIAL_ROOM, variant = 'default', eventLayer }: { timeOfDay: TimeOfDay; room?: RoomDefinition; variant?: 'default' | 'homepage'; eventLayer?: ReactNode }) {
  const descriptionId = useId()
  const art = useGameArt()
  const image = (layer: string) => {
    const asset = art.assets[`image.room.${room.id}.${layer}`]
    return compatibleSceneImage(asset, room.size)
  }
  const background = variant === 'homepage' ? image('background') : undefined
  const foreground = variant === 'homepage' ? image('foreground') : undefined
  return (
    <div className={`room-scene time-${timeOfDay} ${variant === 'homepage' ? 'home-room-scene' : ''}`} aria-describedby={descriptionId} style={{ '--room-aspect': `${room.size.width} / ${room.size.height}`, ...(variant === 'default' ? { aspectRatio: `${room.size.width} / ${room.size.height}` } : {}) } as CSSProperties}>
      <p id={descriptionId} className="sr-only">{timeOfDayLabels[timeOfDay]}的小屋：左上窗戶、右側淡紫沙發、左下開放式圓窩、中央地毯與活動空間、右下盆栽及少量牆面裝飾。{background ? '使用正式場景美術。' : '場景素材尚未載入。'}</p>
      <div className="scene-art">
        <div className="scene-layer scene-background-layer" data-scene-layer="background" data-scene-asset-id={background?.definition.assetId} data-scene-art-state={background ? 'published' : 'fallback'}>
          {background ? <img className="room-approved-image" src={background.urls[0]} alt="" /> : <><div className="room-wall" aria-hidden="true" /><div className="room-floor" aria-hidden="true" /><div className="window-light" aria-hidden="true" /></>}
        </div>
        <div className="scene-layer scene-wall-furniture-layer" data-scene-layer="wall-furniture">
          {room.items.filter(item => item.kind !== 'character' && item.layer === SCENE_LAYERS.wall).map(item => <SceneObject key={item.id} item={item} size={room.size} roomId={room.id} approvedOnly={variant === 'homepage'} />)}
        </div>
        <div className="scene-layer scene-furniture-layer" data-scene-layer="floor-furniture">
          {room.items.filter(item => item.kind !== 'character' && item.layer > SCENE_LAYERS.wall && item.layer < SCENE_LAYERS.foreground).map(item => <SceneObject key={item.id} item={item} size={room.size} roomId={room.id} approvedOnly={variant === 'homepage'} />)}
        </div>
        <div className="scene-layer scene-character-layer" data-scene-layer="character">
          {room.items.filter(item => item.kind === 'character').map(item => variant !== 'homepage' && item.src ? <SceneObject key={item.id} item={item} size={room.size} roomId={room.id} approvedOnly={false} /> : <GuluCharacter key={item.id} item={item} room={room} approvedOnly={variant === 'homepage'} />)}
        </div>
        <div className="scene-layer scene-foreground-layer" data-scene-layer="foreground">{foreground && <img className="room-approved-image" src={foreground.urls[0]} alt="" />}{room.items.filter(item => item.kind !== 'character' && item.layer >= SCENE_LAYERS.foreground).map(item => <SceneObject key={item.id} item={item} size={room.size} roomId={room.id} approvedOnly={variant === 'homepage'} />)}</div>
        <div className="room-event-layer">{eventLayer}</div>
      </div>
      <span className="room-label" aria-hidden="true">HOME, SWEET HOME</span>
    </div>
  )
}







