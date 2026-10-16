import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AjustesPage } from './AjustesPage'
import { ToastProvider } from '@/components/Toast'
import { MENSAJE_WHATSAPP_ORIGINAL } from '@/lib/whatsapp'
import { guardarAjustesWhatsApp, obtenerAjustesWhatsApp } from '@/services/ajustes'

vi.mock('@/services/ajustes', () => ({
  obtenerAjustesWhatsApp: vi.fn(),
  guardarAjustesWhatsApp: vi.fn(),
}))

const obtenerMock = vi.mocked(obtenerAjustesWhatsApp)
const guardarMock = vi.mocked(guardarAjustesWhatsApp)

function renderizar() {
  render(
    <ToastProvider>
      <AjustesPage />
    </ToastProvider>,
  )
}

beforeEach(() => {
  obtenerMock.mockReset()
  guardarMock.mockReset()
  obtenerMock.mockResolvedValue({ numero: '', mensaje: MENSAJE_WHATSAPP_ORIGINAL })
})

describe('AjustesPage', () => {
  it('muestra la vista previa armada con el pedido de ejemplo', async () => {
    renderizar()
    expect(await screen.findByText(/Te escribo por mi pedido #0007 de L&S/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Volver al mensaje original' })).not.toBeInTheDocument()
  })

  it('valida antes de guardar', async () => {
    const usuario = userEvent.setup()
    renderizar()
    const mensaje = await screen.findByLabelText('Mensaje')
    await usuario.clear(mensaje)
    await usuario.type(mensaje, 'Hola')
    await usuario.click(screen.getByRole('button', { name: 'Guardar número y mensaje' }))

    expect(screen.getByText('Ingresá el número de WhatsApp de la tienda.')).toBeInTheDocument()
    expect(
      screen.getByText('Incluí {items} para que el mensaje diga qué piezas pidió el cliente.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Revisá los campos marcados.')
    expect(guardarMock).not.toHaveBeenCalled()
  })

  it('inserta un dato y guarda el número solo con dígitos', async () => {
    guardarMock.mockImplementation((ajustes) => Promise.resolve(ajustes))
    const usuario = userEvent.setup()
    renderizar()
    const mensaje = await screen.findByLabelText('Mensaje')
    await usuario.clear(mensaje)
    await usuario.type(mensaje, 'Pedido:')
    await usuario.click(screen.getByRole('button', { name: 'Insertar Piezas' }))
    expect(mensaje).toHaveValue('Pedido: {items}')
    expect(screen.getByRole('button', { name: 'Volver al mensaje original' })).toBeInTheDocument()

    await usuario.type(screen.getByLabelText('Número'), '+54 9 351 555-1234')
    await usuario.click(screen.getByRole('button', { name: 'Guardar número y mensaje' }))

    expect(guardarMock).toHaveBeenCalledWith({ numero: '5493515551234', mensaje: 'Pedido: {items}' })
    expect(await screen.findByText('Guardamos el número y el mensaje.')).toBeInTheDocument()
    expect(screen.getByLabelText('Número')).toHaveValue('+5493515551234')
    expect(screen.queryByRole('button', { name: 'Descartar' })).not.toBeInTheDocument()
  })

  it('Descartar vuelve a lo guardado', async () => {
    obtenerMock.mockResolvedValue({ numero: '5491100000000', mensaje: MENSAJE_WHATSAPP_ORIGINAL })
    const usuario = userEvent.setup()
    renderizar()
    const numero = await screen.findByLabelText('Número')
    await usuario.type(numero, '9')
    await usuario.click(screen.getByRole('button', { name: 'Descartar' }))
    expect(numero).toHaveValue('+5491100000000')
  })
})
