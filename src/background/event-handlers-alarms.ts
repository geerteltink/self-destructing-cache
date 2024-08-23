import type browser from 'webextension-polyfill';
import { getLastHeartbeat, setLastHeartbeat } from './storage';
import { Alarm } from './types';
import { destroyData } from './destruction';

export async function onAlarm(alarm: browser.Alarms.Alarm) {
  await setLastHeartbeat();
  console.log(`onAlarm: ${alarm.name}`);
  if (alarm.name !== Alarm.DestroyData) {
    return;
  }

  await destroyData();
  await getLastHeartbeat().then((lastHeartbeat: number) => {
    console.log(lastHeartbeat);
  });
}
