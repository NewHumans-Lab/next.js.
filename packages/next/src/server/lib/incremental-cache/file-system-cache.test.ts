import { CachedRouteKind } from '../../response-cache'
import FileSystemCache from './file-system-cache'

describe('FileSystemCache', () => {
  it('persists the RSC payload for a completed PPR page', async () => {
    const writes: string[] = []
    const fs = {
      mkdir: async () => undefined,
      writeFile: async (filePath: string) => {
        writes.push(filePath)
      },
    }

    const cache = new FileSystemCache({
      fs: fs as any,
      serverDistDir: '/tmp/.next/server',
      flushToDisk: true,
      revalidatedTags: [],
      maxMemoryCacheSize: undefined,
    } as any)

    await cache.set(
      'app/example',
      {
        kind: CachedRouteKind.APP_PAGE,
        html: '<html></html>',
        rscData: Buffer.from('rsc'),
        postponed: undefined,
        headers: undefined,
        status: 200,
        segmentData: undefined,
      },
      {
        fetchCache: false,
        isFallback: false,
        isRoutePPREnabled: true,
      } as any
    )

    expect(writes).toContain('/tmp/.next/server/app/app/example.rsc')
  })

  it('does not persist an RSC payload for a postponed PPR page', async () => {
    const writes: string[] = []
    const fs = {
      mkdir: async () => undefined,
      writeFile: async (filePath: string) => {
        writes.push(filePath)
      },
    }

    const cache = new FileSystemCache({
      fs: fs as any,
      serverDistDir: '/tmp/.next/server',
      flushToDisk: true,
      revalidatedTags: [],
      maxMemoryCacheSize: undefined,
    } as any)

    await cache.set(
      'app/example',
      {
        kind: CachedRouteKind.APP_PAGE,
        html: '<html></html>',
        rscData: Buffer.from('rsc'),
        postponed: 'postponed',
        headers: undefined,
        status: 200,
        segmentData: undefined,
      },
      {
        fetchCache: false,
        isFallback: false,
        isRoutePPREnabled: true,
      } as any
    )

    expect(writes).not.toContain('/tmp/.next/server/app/app/example.rsc')
  })

  it('does not persist an RSC payload for a fallback page', async () => {
    const writes: string[] = []
    const fs = {
      mkdir: async () => undefined,
      writeFile: async (filePath: string) => {
        writes.push(filePath)
      },
    }

    const cache = new FileSystemCache({
      fs: fs as any,
      serverDistDir: '/tmp/.next/server',
      flushToDisk: true,
      revalidatedTags: [],
      maxMemoryCacheSize: undefined,
    } as any)

    await cache.set(
      'app/example',
      {
        kind: CachedRouteKind.APP_PAGE,
        html: '<html></html>',
        rscData: Buffer.from('rsc'),
        postponed: undefined,
        headers: undefined,
        status: 200,
        segmentData: undefined,
      },
      {
        fetchCache: false,
        isFallback: true,
        isRoutePPREnabled: true,
      } as any
    )

    expect(writes).not.toContain('/tmp/.next/server/app/app/example.rsc')
  })
})
