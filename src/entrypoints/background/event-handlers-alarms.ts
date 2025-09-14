import { setLastHeartbeat } from './storage';
import { Alarm } from './types';
import { destroyData } from './destruction';

export async function onAlarm(alarm: any) {
  await setLastHeartbeat();
  if (alarm.name !== Alarm.DestroyData) {
    return;
  }

  await destroyData();
}
