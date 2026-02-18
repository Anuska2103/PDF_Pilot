import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-zinc-900 text-white font-sans px-6">
      
      
      <main className="max-w-3xl w-full flex flex-col items-center text-center gap-8">
        
        <div className="space-y-4">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            All in one<br></br> PDF<br></br> Assistant
          </h1>
          <p className="text-zinc-400 text-lg max-w-md mx-auto">
            Just with one PDF upload, let&apos;s see what we can build.
          </p>
        </div>

        
        <Link href="/dashboard">
          <button className="px-8 py-3 bg-white text-black font-semibold rounded-4xl border-3 border-white transition-all duration-300 hover:bg-black hover:text-white">
            Let&apos;s Go
          </button>
        </Link>

      </main>
    </div>
  );
}