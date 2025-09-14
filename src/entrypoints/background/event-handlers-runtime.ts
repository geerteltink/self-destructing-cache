import { destroyAllData } from './destruction';

export async function onStartup() {
  await destroyAllData();
}

export function onSuspend() {
}
