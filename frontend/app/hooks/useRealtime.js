import { useEffect } from "react"
import io from "socket.io-client"

export default function useRealtime(event, handler) {
  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_API_URL)

    socket.on(event, handler)

    return () => socket.disconnect()
  }, [event, handler])
}
