import React, { useEffect, useState } from 'react'
import Link from 'next/link'

type Order = {
  id: string
  status: string
  total: number
}

export default function KuwaitAdmin() {
  const [orders, setOrders] = useState<Order[]>([])
  const [inventory, setInventory] = useState<any[]>([])

  useEffect(() => {
    // Fetch Kuwait orders from API (demo path)
    fetch('/api/kuwait/orders')
      .then((r) => r.json())
      .then((data) => {
        const list = (data?.orders ?? []) as Order[]
        setOrders(list)
      })
      // Fetch Kuwait inventory (demo path)
      fetch('/api/store/KUW/inventory')
        .then((r) => r.json())
        .then((data) => {
          setInventory(data?.inventory ?? [])
        })
  }, [])

  return (
    <div style={{ padding: 20 }}>
      <h1>Kuwait Admin Panel</h1>
      <nav>
        <Link href="/admin/kuwait/login">Login</Link>
      </nav>
      <section style={{ marginTop: 20 }}>
        <h2>Orders</h2>
        <table border={1} cellPadding={8} cellSpacing={0}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Status</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td>{o.id}</td>
                <td>{o.status}</td>
                <td>{o.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section style={{ marginTop: 20 }}>
        <h2>Inventory (Kuwait Store)</h2>
        <table border={1} cellPadding={8} cellSpacing={0}>
          <thead>
            <tr>
              <th>Product</th>
              <th>Quantity</th>
              <th>Store Price</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map((it, idx) => (
              <tr key={idx}>
                <td>{it?.product?.name ?? 'Unknown'}</td>
                <td>{it?.quantity ?? 0}</td>
                <td>{it?.price ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}
