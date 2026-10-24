import { redirect } from 'next/navigation';

// A Nova OS agora fica dentro do Atendimento; mantém links antigos funcionando.
export default async function NovaOS({ searchParams }: { searchParams: Promise<{ cliente?: string }> }) {
  const { cliente } = await searchParams;
  redirect(cliente ? `/atendimento?cliente=${cliente}` : '/atendimento');
}
