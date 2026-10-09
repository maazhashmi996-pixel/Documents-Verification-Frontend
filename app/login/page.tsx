import { redirect } from 'next/navigation';

// Login now lives on the landing page cards (/login/student, /login/university, /login/admin)
export default function LoginRedirect() {
    redirect('/');
}
