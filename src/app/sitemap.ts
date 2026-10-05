import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://na-leer.org'

  const publicPages = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 1.0 },
    { url: `${baseUrl}/login`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.6 },
    { url: `${baseUrl}/register`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.6 },
    { url: `${baseUrl}/pricing`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: 'yearly' as const, priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: 'yearly' as const, priority: 0.3 },
  ]

  return publicPages
}
