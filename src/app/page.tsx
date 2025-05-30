import { redirect } from 'next/navigation';

export default function HomePage(): null {
  redirect('/board/my-tasks');
  return null;
} 