import { redirect } from 'next/navigation';
import { DEFAULT_AUTHENTICATION } from '@/utils/constants';

export default function Home() {
  redirect(DEFAULT_AUTHENTICATION);
}
