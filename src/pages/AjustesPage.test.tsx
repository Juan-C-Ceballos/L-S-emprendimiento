import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AjustesPage } from './AjustesPage'
import { ToastProvider } from '@/components/Toast'
import { MENSAJE_WHATSAPP_ORIGINAL } from '@/lib/whatsapp'
import { guardarAjustesWhatsApp, obtenerAjustesWhatsApp } from '@/services/ajustes'
import {
  crearEtiqueta,
  eliminarEtiqueta,
  listarEtiquetasAdmin,
  renombrarEtiqueta,
} from '@/services/etiquetas'
import type { EtiquetaAdmin } from '@/types/dominio'

vi.mock('@/services/ajustes', () => ({
  obtenerAjustesWhatsApp: vi.fn(),
  guardarAjustesWhatsApp: vi.fn(),
}))

vi.mock('@/services/etiquetas', () => ({
  listarEtiquetasAdmin: vi.fn(),
  crearEtiqueta: vi.fn(),
  renombrarEtiqueta: vi.fn(),
  eliminarEtiqueta: vi.fn(),
}))

const ETIQUETAS: EtiquetaAdmin[] = [
  { id: 't8', nombre: 'acero', usos: 7 },
  { id: 't5', nombre: 'anillos', usos: 0 },
  { id: 't6', nombre: 'dorado', usos: 8 },
]

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
  vi.mocked(listarEtiquetasAdmin).mockReset()
  vi.mocked(listarEtiquetasAdmin).mockResolvedValue(ETIQUETAS)
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

describe('AjustesPage · etiquetas', () => {
  it('renombrar a una que ya existe avisa que se unen y las une', async () => {
    const usuario = userEvent.setup()
    vi.mocked(renombrarEtiqueta).mockResolvedValue({ resultado: 'unida', id: 't6' })
    renderizar()
    expect(await screen.findByText('7 productos')).toBeInTheDocument()

    await usuario.click(screen.getByRole('button', { name: 'Renombrar etiqueta acero' }))
    const campo = screen.getByLabelText('Renombrar «acero»')
    await usuario.clear(campo)
    await usuario.type(campo, 'Dorado')
    expect(screen.getByText('Ya existe «dorado»: al guardar se unen las dos.')).toBeInTheDocument()

    vi.mocked(listarEtiquetasAdmin).mockResolvedValue([
      { id: 't5', nombre: 'anillos', usos: 0 },
      { id: 't6', nombre: 'dorado', usos: 11 },
    ])
    await usuario.keyboard('{Enter}')
    expect(renombrarEtiqueta).toHaveBeenCalledWith('t8', 'Dorado')
    expect(await screen.findByText('Unimos «acero» con «dorado».')).toBeInTheDocument()
    expect(await screen.findByText('11 productos')).toBeInTheDocument()
    expect(screen.queryByText('acero')).not.toBeInTheDocument()
  })

  it('Escape cancela el renombrado sin llamar a la base', async () => {
    const usuario = userEvent.setup()
    vi.mocked(renombrarEtiqueta).mockReset()
    renderizar()
    await usuario.click(await screen.findByRole('button', { name: 'Renombrar etiqueta acero' }))
    await usuario.keyboard('{Escape}')
    expect(screen.queryByLabelText('Renombrar «acero»')).not.toBeInTheDocument()
    expect(renombrarEtiqueta).not.toHaveBeenCalled()
  })

  it('eliminar pide confirmación con la cantidad de productos', async () => {
    const usuario = userEvent.setup()
    vi.mocked(eliminarEtiqueta).mockResolvedValue(undefined)
    renderizar()
    await usuario.click(await screen.findByRole('button', { name: 'Eliminar etiqueta acero' }))
    const confirmacion = screen.getByRole('alertdialog', { name: '¿Eliminar «acero»?' })
    expect(confirmacion).toHaveTextContent('Se va a quitar de 7 productos. Los productos no se borran.')

    await usuario.click(within(confirmacion).getByRole('button', { name: 'No' }))
    expect(eliminarEtiqueta).not.toHaveBeenCalled()

    await usuario.click(screen.getByRole('button', { name: 'Eliminar etiqueta anillos' }))
    expect(screen.getByRole('alertdialog')).toHaveTextContent('Ningún producto la usa.')
    await usuario.click(screen.getByRole('button', { name: 'Sí, eliminar' }))
    expect(eliminarEtiqueta).toHaveBeenCalledWith('t5')
    expect(await screen.findByText('Eliminaste la etiqueta «anillos».')).toBeInTheDocument()
  })

  it('agregar valida vacío y repetida, y crea la nueva', async () => {
    const usuario = userEvent.setup()
    vi.mocked(crearEtiqueta).mockResolvedValue('oro rosa')
    renderizar()
    await screen.findByText('7 productos')
    await usuario.click(screen.getByRole('button', { name: 'Agregar' }))
    expect(screen.getByText('Escribí el nombre de la etiqueta.')).toBeInTheDocument()

    await usuario.type(screen.getByLabelText('Nueva etiqueta'), ' Dorado ')
    await usuario.click(screen.getByRole('button', { name: 'Agregar' }))
    expect(screen.getByText('«dorado» ya existe.')).toBeInTheDocument()
    expect(crearEtiqueta).not.toHaveBeenCalled()

    await usuario.clear(screen.getByLabelText('Nueva etiqueta'))
    await usuario.type(screen.getByLabelText('Nueva etiqueta'), 'Oro rosa{Enter}')
    expect(crearEtiqueta).toHaveBeenCalledWith('oro rosa')
    expect(await screen.findByText('Creaste «oro rosa». Asignala desde cada producto.')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByLabelText('Nueva etiqueta')).toHaveValue('')
    })
  })
})
