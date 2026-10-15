import { useParams } from 'react-router'
import { TituloPagina } from '@/components/TituloPagina'

export function ProductoFormPage() {
  const { id } = useParams()
  return <TituloPagina>{id === undefined ? 'Nuevo producto' : 'Editar producto'}</TituloPagina>
}
