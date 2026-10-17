import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DURACION_TOAST_MS, ToastProvider } from './Toast'
import { useToast } from './useToast'

function Disparador() {
  const { mostrarToast } = useToast()
  return (
    <button
      type="button"
      onClick={() => {
        mostrarToast('Agregado al carrito')
      }}
    >
      Agregar
    </button>
  )
}

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('aparece y desaparece a los 2,8 s', () => {
    render(
      <ToastProvider>
        <Disparador />
      </ToastProvider>,
    )
    const region = screen.getByRole('status')
    expect(region).toBeEmptyDOMElement()

    act(() => {
      screen.getByRole('button', { name: 'Agregar' }).click()
    })
    expect(region).toHaveTextContent('Agregado al carrito')

    act(() => {
      vi.advanceTimersByTime(DURACION_TOAST_MS - 1)
    })
    expect(region).toHaveTextContent('Agregado al carrito')

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(region).toBeEmptyDOMElement()
  })
})
