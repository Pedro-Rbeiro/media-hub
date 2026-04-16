/**
 * Path para Link/router do Next: segmentos em texto normal, unidos por `/`.
 * Não usar encodeURIComponent aqui — o Next codifica o pathname uma vez; se
 * codificarmos nós, o Link volta a codificar `%` e aparece %2520 no espaço.
 */
function appPathFromSegments(segments: string[]): string {
  return segments.join("/")
}

export function browseHref(segments: string[]): string {
  const p = appPathFromSegments(segments)
  return p ? `/browse/${p}` : "/browse"
}

export function watchHref(segments: string[]): string {
  return `/watch/${appPathFromSegments(segments)}`
}

/** Path para pedidos HTTP ao NGINX: uma codificação por segmento. */
export function encodeServerPathSegments(segments: string[]): string {
  return segments.map((s) => encodeURIComponent(s)).join("/")
}

export function segmentsToFilePath(segments: string[]): string {
  return segments.join("/")
}

/** `useParams().path` em rotas `[[...path]]` — já vem decodificado pelo Next. */
export function normalizedSegments(
  path: string | string[] | undefined
): string[] {
  if (path == null) return []
  return Array.isArray(path) ? path : [path]
}
