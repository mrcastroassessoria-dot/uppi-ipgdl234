import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-[120px] font-extrabold text-primary/20 leading-none tracking-tighter">
            404
          </h1>
          <h2 className="text-2xl font-bold text-foreground">
            Pagina nao encontrada
          </h2>
          <p className="text-muted-foreground">
            A pagina que voce esta procurando nao existe ou foi movida.
          </p>
        </div>

        <div className="flex flex-col gap-3 pt-4">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
          >
            Ir para o inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
