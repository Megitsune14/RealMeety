import type { FastifyInstance } from 'fastify'
import type { WebSocket } from 'ws'
import { queryNearbyMarkers } from '../modules/presence/service.js'

interface WsClient {
  socket: WebSocket
  userId: string
  lat: number
  lng: number
  bounds: { north: number; south: number; east: number; west: number }
  filters: { ageMin: number; ageMax: number; orientations: string[] }
}

const clients = new Map<WebSocket, WsClient>()

export async function wsRoutes(app: FastifyInstance): Promise<void> {
  app.get('/ws/presence', { websocket: true }, (socket, request) => {
    let authenticated = false
    let client: WsClient | null = null

    socket.on('message', async raw => {
      try {
        const msg = JSON.parse(String(raw)) as Record<string, unknown>

        if (msg.type === 'auth') {
          const token = msg.token as string
          try {
            const decoded = app.jwt.verify<{ sub: string }>(token)
            authenticated = true
            client = {
              socket,
              userId: decoded.sub,
              lat: 0,
              lng: 0,
              bounds: { north: 90, south: -90, east: 180, west: -180 },
              filters: { ageMin: 18, ageMax: 99, orientations: [] },
            }
            clients.set(socket, client)
            socket.send(JSON.stringify({ type: 'auth', ok: true }))
          } catch {
            socket.send(JSON.stringify({ type: 'auth', ok: false }))
          }
          return
        }

        if (!authenticated || !client) {
          socket.send(JSON.stringify({ type: 'error', message: 'Non authentifié' }))
          return
        }

        if (msg.type === 'subscribe') {
          client.lat = msg.lat as number
          client.lng = msg.lng as number
          client.bounds = msg.bounds as WsClient['bounds']
          client.filters = msg.filters as WsClient['filters']
          await sendMarkers(client)
        }
      } catch {
        socket.send(JSON.stringify({ type: 'error', message: 'Message invalide' }))
      }
    })

    socket.on('close', () => {
      clients.delete(socket)
    })
  })
}

async function sendMarkers(client: WsClient): Promise<void> {
  const markers = await queryNearbyMarkers(
    client.userId,
    client.lat,
    client.lng,
    client.bounds,
    {
      ageMin: client.filters.ageMin,
      ageMax: client.filters.ageMax,
      orientations: client.filters.orientations as Parameters<typeof queryNearbyMarkers>[4]['orientations'],
    },
  )
  client.socket.send(JSON.stringify({ type: 'markers', markers }))
}

export function broadcastPresenceUpdate(): void {
  for (const client of clients.values()) {
    sendMarkers(client).catch(() => {})
  }
}
