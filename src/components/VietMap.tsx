'use client'

import vietmapgl from "@vietmap/vietmap-gl-js/dist/vietmap-gl";
import '@vietmap/vietmap-gl-js/dist/vietmap-gl.css';
import { useEffect, useRef } from "react";

interface VietMapProps {
	apiKey: string,
	center?: [number, number] // [longitude, latitude]
	zoom?: number
	className?: string
}

export default function VietMap({
	apiKey,
	center = [105.8412, 21.0245], // Hanoi default
	zoom = 12,
	className = '',
}: VietMapProps) {
	const mapContainerRef = useRef<HTMLDivElement>(null)
	const mapRef = useRef<vietmapgl.Map | null>(null)

	useEffect(() => {
		if (!mapContainerRef.current || mapRef.current) return

		mapRef.current = new vietmapgl.Map({
			container: mapContainerRef.current, // ID of the map container
			style: `https://maps.vietmap.vn/maps/styles/tm/style.json?apikey=${apiKey}`,
			center: [106.697699, 10.901423], // Initial map center coordinates [longitude, latitude]
			zoom: 12, // Initial zoom level
		});

		// Add marker after map loads
		mapRef.current.on('load', () => {
			new vietmapgl.Marker({ color: '#000f8f' })
				.setLngLat([106.697699, 10.901423])
				.addTo(mapRef.current!)
		})

		// Add navigation controls (zoom in/out + compass)
		mapRef.current.addControl(new vietmapgl.NavigationControl(), 'top-right')

		return () => {
			mapRef.current?.remove()
			mapRef.current = null
		}
	}, [apiKey])

	return (
		<div
			id="map"
			ref={mapContainerRef}
			className={`w-full h-full ${className}`}
			style={{ minHeight: 400 }}
		/>
	)
}
