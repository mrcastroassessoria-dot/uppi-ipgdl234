'use client'

import { ReactNode, useEffect, useState } from 'react'

interface GoogleMapsProviderProps {
  children: ReactNode
}

export function GoogleMapsProvider({ children }: GoogleMapsProviderProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const [Provider, setProvider] = useState<any>(null)

  useEffect(() => {
    if (!apiKey) return
    
    import('@vis.gl/react-google-maps').then((mod) => {
      setProvider(() => mod.APIProvider)
    }).catch(() => {
      console.error('[v0] Failed to load Google Maps')
    })
  }, [apiKey])

  if (!apiKey || !Provider) {
    return <>{children}</>
  }

  return (
    <Provider apiKey={apiKey} libraries={['places', 'geometry']}>
      {children}
    </Provider>
  )
}
