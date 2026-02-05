import React, { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import './LocationMap.css'

const LocationMap = ({ center, zoom = 10, marker }) => {
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)

  // Инициализация карты
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    const initialCenter = Array.isArray(center) && center.length === 2 && !isNaN(center[0]) && !isNaN(center[1])
      ? [center[1], center[0]]
      : [37.6173, 55.7558] // Москва по умолчанию [lng, lat]

    // Стиль с растровыми тайлами OpenStreetMap
    const osmStyle = {
      version: 8,
      sources: {
        osm: {
          type: 'raster',
          tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution: '© OpenStreetMap contributors'
        }
      },
      layers: [
        {
          id: 'osm',
          type: 'raster',
          source: 'osm'
        }
      ]
    }

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: osmStyle,
      center: initialCenter,
      zoom,
      attributionControl: false
    })

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')

    mapRef.current = map

    return () => {
      if (markerRef.current) {
        markerRef.current.remove()
        markerRef.current = null
      }
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Обновление центра/зума
  useEffect(() => {
    if (!mapRef.current || !Array.isArray(center) || center.length !== 2) return
    const lngLat = [center[1], center[0]]
    mapRef.current.setCenter(lngLat)
    if (zoom) {
      mapRef.current.setZoom(zoom)
    }
  }, [center, zoom])

  // Обновление маркера
  useEffect(() => {
    if (!mapRef.current) return

    if (Array.isArray(marker) && marker.length === 2) {
      const lngLat = [marker[1], marker[0]]

      if (!markerRef.current) {
        markerRef.current = new maplibregl.Marker({ color: '#0ABAB5' })
          .setLngLat(lngLat)
          .addTo(mapRef.current)
      } else {
        markerRef.current.setLngLat(lngLat)
      }
    } else if (markerRef.current) {
      markerRef.current.remove()
      markerRef.current = null
    }
  }, [marker])

  return (
    <div className="location-map-container">
      <div ref={mapContainerRef} className="location-map" />
    </div>
  )
}

export default LocationMap

