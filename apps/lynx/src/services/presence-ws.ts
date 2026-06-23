import type { AnonymousMarker, MapFilters } from '@realmeety/shared'
import { WS_BASE_URL } from '../config.js'
import { getTokens } from './api.js'

type MessageHandler = (markers: AnonymousMarker[]) => void

export class PresenceWebSocket {
  private ws: WebSocket | null = null
  private handler: MessageHandler | null = null

  connect(onMarkers: MessageHandler): void {
    'background only'
    this.handler = onMarkers
    this.ws = new WebSocket(WS_BASE_URL)

    this.ws.onopen = () => {
      const token = getTokens()?.accessToken
      if (token) {
        this.ws?.send(JSON.stringify({ type: 'auth', token }))
      }
    }

    this.ws.onmessage = event => {
      const msg = JSON.parse(String(event.data)) as { type: string; markers?: AnonymousMarker[] }
      if (msg.type === 'markers' && msg.markers && this.handler) {
        this.handler(msg.markers)
      }
    }
  }

  subscribe(
    lat: number,
    lng: number,
    bounds: { north: number; south: number; east: number; west: number },
    filters: MapFilters,
  ): void {
    'background only'
    this.ws?.send(JSON.stringify({ type: 'subscribe', lat, lng, bounds, filters }))
  }

  disconnect(): void {
    'background only'
    this.ws?.close()
    this.ws = null
  }
}
