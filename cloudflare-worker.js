// Cloudflare Worker для SPA routing
// Этот worker перенаправляет все запросы без расширения файла на index.html

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest (request) {
  const url = new URL(request.url)
  const pathname = url.pathname

  // Список расширений файлов, которые нужно проксировать как есть
  const fileExtensions = [
    '.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg',
    '.ico', '.json', '.txt', '.xml', '.map', '.woff', '.woff2',
    '.ttf', '.eot', '.otf', '.webp', '.avif'
  ]

  // Если путь имеет расширение файла, проксируем запрос к GCS
  const hasFileExtension = fileExtensions.some(ext => pathname.endsWith(ext))

  if (hasFileExtension) {
    // Проксируем к Google Cloud Storage
    const gcsUrl = `https://storage.googleapis.com/order.dolinaflo.com${pathname}`
    return fetch(gcsUrl, {
      cf: {
        cacheTtl: 31536000, // Кэш на 1 год для статических файлов
        cacheEverything: true
      }
    })
  }

  // Для всех остальных путей (роуты React) возвращаем index.html
  const indexUrl = `https://storage.googleapis.com/order.dolinaflo.com/index.html`

  const response = await fetch(indexUrl, {
    cf: {
      cacheTtl: 300, // Кэш на 5 минут для index.html
      cacheEverything: true
    }
  })

  // Создаем новый response с правильным URL в истории браузера
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  })
}

