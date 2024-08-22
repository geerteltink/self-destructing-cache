import { destroyAllData } from './destruction';

export async function onStartup() {
  console.log('[onStartup]');
  await destroyAllData();
}

export function onSuspend() {
  console.log('[onSuspend]');
}
