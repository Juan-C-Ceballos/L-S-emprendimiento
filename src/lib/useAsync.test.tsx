import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useAsync } from './useAsync'

describe('useAsync', () => {
  it('pasa de cargando a listo con los datos', async () => {
    const fn = vi.fn(() => Promise.resolve(42))
    const { result } = renderHook(() => useAsync(fn))
    expect(result.current.estado).toBe('cargando')
    await waitFor(() => {
      expect(result.current.estado).toBe('listo')
    })
    expect(result.current.datos).toBe(42)
  })

  it('expone el error y permite recargar', async () => {
    const fn = vi.fn<() => Promise<number>>()
    fn.mockRejectedValueOnce(new Error('falló')).mockResolvedValueOnce(7)
    const { result } = renderHook(() => useAsync(fn))
    await waitFor(() => {
      expect(result.current.estado).toBe('error')
    })
    act(() => {
      result.current.recargar()
    })
    await waitFor(() => {
      expect(result.current.datos).toBe(7)
    })
    expect(fn).toHaveBeenCalledTimes(2)
  })
})
