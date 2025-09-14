import { browser } from 'wxt/browser';
import { onStartup, onSuspend } from './event-handlers-runtime';
import { onTabRemoved, onActivated, onTabUpdated } from './event-handlers-tabs';
import { onAlarm } from './event-handlers-alarms';
import { Alarm } from './types';
import { destroyData } from './destruction';

export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(onStartup);
  browser.runtime.onStartup.addListener(onStartup);
  browser.runtime.onSuspend.addListener(onSuspend);

  browser.tabs.onActivated.addListener(onActivated);
  browser.tabs.onUpdated.addListener(onTabUpdated);
  browser.tabs.onRemoved.addListener(onTabRemoved);

  browser.alarms.create(Alarm.DestroyData, {
    delayInMinutes: 1,
    periodInMinutes: 1,
  });

  // Register alarm handler
  browser.alarms.onAlarm.addListener(onAlarm);

  destroyData();

  console.log('background.js started', { id: browser.runtime.id });
});
