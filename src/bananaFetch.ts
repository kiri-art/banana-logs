const BANANA_API_URL_BASE = "https://app.banana.dev/api";

let proxy = "UNSET_PROXY";
let accessToken = "UNSET_ACCESS_TOKEN";

export function setProxy(_proxy: string) {
  proxy = _proxy;
}

export function setAccessToken(_accessToken: string) {
  accessToken = _accessToken;
}

export default function bananaFetch(path: string, init?: RequestInit) {
  const qs = new URLSearchParams({
    url: BANANA_API_URL_BASE + path,
  });
  const url = proxy + "?" + qs.toString();
  return fetch(url, {
    headers: {
      Authorization: "Bearer " + accessToken,
      ...init?.headers,
    },
    ...init,
  });
}
