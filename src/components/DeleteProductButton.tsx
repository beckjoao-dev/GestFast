'use client'
import { useState } from 'react'
export default function DeleteProductButton({ productId }: { productId: string }) {
  const [loading, setLoading] = useState(false)
  async function handleDelete() {
    if (!confirm('Excluir este produto? Esta ação não pode ser desfeita.')) return
    setLoading(true)
    try { await fetch(`/api/products/${productId}`, { method: 'DELETE' }); window.location.reload() }
    catch { alert('Erro ao excluir.') }
    finally { setLoading(false) }
  }
  return (
    <button onClick={handleDelete} disabled={loading} className="btn-danger-soft">
      {loading ? '...' : 'Excluir'}
    </button>
  )
}
