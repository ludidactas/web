'use client'

import { useState } from "react";
import PingClient from "./ping"

export default function TestClient() {
  const [montar, setMontar] = useState(false)
  const [url, setUrl] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-4 p-8">
      <input  className="border border-zinc-700 p-2 rounded w-[480px]" type="text" value={url ?? ''} onChange={(e) => setUrl(e.target.value)} />
      <button className="border border-zinc-700 p-2 rounded w-[480px]" onClick={() => setMontar(true)}>Montar cliente</button>
      <button className="border border-zinc-700 p-2 rounded w-[480px]" onClick={() => setMontar(false)}>Desmontar cliente</button>
      {montar && url && <PingClient url={url} />}
    </div>
  )
}
