export function isUrl(url: string): boolean {
  if (url.startsWith('https://') || url.startsWith('http://')) {
    return true;
  }

  return false;
}

export function getHostname(url: string): string {
  const hostname = new URL(url).hostname;

  return hostname.replace('www.', '');
}

export function getRootDomain(hostname: string): string {
  const elems = hostname.split('.');
  const iMax = elems.length - 1;

  const elem1 = elems[iMax - 1];
  const elem2 = elems[iMax];

  const isSecondLevelDomain = iMax >= 3 && (elem1 + elem2).length <= 5;
  return (isSecondLevelDomain ? elems[iMax - 2] + '.' : '') + elem1 + '.' + elem2;
}
