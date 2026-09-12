import {
  CachedRouteKind,
  IncrementalCacheKind,
} from '../../response-cache'
import FileSystemCache from './file-system-cache'

describe('FileSystemCache', () => {
  it('persists and cold-reads the RSC payload for a completed PPR page', async () => {
    const files = new Map<string, Buffer | string>()
    const fs = {
      mkdir: async () => undefined,
      writeFile: async (filePath: string, data: Buffer | string) => {
        files.set(filePath, data)
      },
      readFile: async (filePath: string) => {
        const value = files.get(filePath)
        if (value === undefined) {
          const error = new Error(`ENOENT: ${filePath}`) as NodeJS.ErrnoException
          error.code = 'ENOENT'
          throw error
        }
        return Buffer.isBuffer(value) ? value : Buffer.from(value)
      },
      stat: async (filePath: string) => {
        if (!files.has(filePath)) {
          const error = new Error(`ENOENT: ${filePath}`) as NodeJS.ErrnoException
          error.code = 'ENOENT'
          throw error
        }
        return { isFile: () => true }
      },
    }

    const cacheConfig = {
      fs: fs as any,
      serverDistDir: '/tmp/.next/server',
      flushToDisk: true,
      revalidatedTags: [],
      maxMemoryCacheSize: undefined,
    }

    const writerCache = new FileSystemCache(cacheConfig as any)

    await writerCache.set(
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

    expect(files.has('/tmp/.next/server/app/app/example.rsc')).toBe(true)

    const readerCache = new FileSystemCache(cacheConfig as any)
    const cached = await readerCache.get('app/example', {
      kind: IncrementalCacheKind.APP_PAGE,
      isFallback: false,
      isRoutePPREnabled: true,
    } as any)

    expect(cached).toMatchObject({
      value: {
        kind: CachedRouteKind.APP_PAGE,
        html: '<html></html>',
        rscData: Buffer.from('rsc'),
        postponed: undefined,
        status: 200,
      },
    })
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
