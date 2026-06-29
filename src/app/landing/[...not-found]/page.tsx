import { notFound } from 'next/navigation';

export default function LandingCatchAll() {
    notFound(); // Fuerza a que se pinte el not-found.tsx de su misma carpeta (landing)
}