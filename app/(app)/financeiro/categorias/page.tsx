import { redirect } from 'next/navigation';

// Categorias agora ficam em Opções.
export default function CategoriasAntigas() {
  redirect('/opcoes/categorias');
}
