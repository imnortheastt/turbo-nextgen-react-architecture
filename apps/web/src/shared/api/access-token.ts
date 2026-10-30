// The access token lives only in memory: never in localStorage, sessionStorage or
// a readable cookie. After a reload it is restored from the httpOnly refresh cookie.
let accessToken: string | undefined

export const getAccessToken = (): string | undefined => accessToken

export function setAccessToken(token: string | undefined): void {
  accessToken = token
}

export function clearAccessToken(): void {
  accessToken = undefined
}
