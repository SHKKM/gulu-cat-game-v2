import type { ActionId } from '../types/catalog.ts'
import type { AnimationId } from '../../animation/clips.ts'

/** References only: these do not change S1 content status or enable events. */
export const S3_ACTION_ANIMATIONS: Readonly<Record<AnimationId, { actionId: ActionId; animationId: string }>> = {
  idle: { actionId: 'G03', animationId: 'idle' }, walk: { actionId: 'G07', animationId: 'walk' },
  rest: { actionId: 'G02', animationId: 'rest' }, sleep: { actionId: 'G13', animationId: 'sleep_curl' },
  stretch: { actionId: 'G11', animationId: 'stretch' }, turn: { actionId: 'G08', animationId: 'turn' },
}
