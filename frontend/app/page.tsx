import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-6 py-20 text-center">
        <h1 className="text-4xl font-semibold text-green-700 mb-4">Hinga</h1>
        <p className="text-gray-500 text-lg mb-10 max-w-xl mx-auto">
          Ibiciro by&apos;isoko, ikirere, isuzuma ry&apos;ibihingwa, n&apos;isoko — yose hamwe, mu Kinyarwanda.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/register" className="px-6 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 text-sm font-medium">
            Iyandikishe
          </Link>
          <Link href="/login" className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium">
            Injira
          </Link>
        </div>
      </main>
    </>
  );
}
