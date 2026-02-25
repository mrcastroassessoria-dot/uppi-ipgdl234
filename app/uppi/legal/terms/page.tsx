import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/uppi/settings">
            <Button variant="ghost" size="icon" className="bg-transparent">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-blue-900">Termos de Uso</h1>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl p-6 shadow-lg space-y-6 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-blue-900 mb-3">1. Aceitação dos Termos</h2>
            <p>
              Ao acessar e usar o aplicativo Uppi, você concorda em cumprir e estar vinculado aos
              seguintes termos e condições de uso. Se você não concordar com qualquer parte destes
              termos, não use nosso aplicativo.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-blue-900 mb-3">2. Descrição do Serviço</h2>
            <p>
              O Uppi é uma plataforma que conecta passageiros e motoristas para serviços de
              transporte. Permitimos que passageiros proponham preços e motoristas façam ofertas,
              promovendo transparência e negociação justa.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-blue-900 mb-3">3. Cadastro e Conta</h2>
            <p>
              Para usar o Uppi, você deve criar uma conta fornecendo informações precisas e
              atualizadas. Você é responsável por manter a confidencialidade de sua conta e senha.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-blue-900 mb-3">4. Uso do Serviço</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Você deve ter pelo menos 18 anos para usar o serviço</li>
              <li>Motoristas devem possuir CNH válida e documentação do veículo em dia</li>
              <li>É proibido usar o serviço para atividades ilegais ou fraudulentas</li>
              <li>Você deve tratar todos os usuários com respeito e cortesia</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-blue-900 mb-3">5. Pagamentos e Tarifas</h2>
            <p>
              Os preços são negociados entre passageiros e motoristas. O Uppi cobra uma taxa de
              serviço sobre cada corrida concluída. Cancelamentos após aceitação podem incorrer em
              taxa de 10% do valor da corrida.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-blue-900 mb-3">6. Segurança</h2>
            <p>
              Implementamos medidas de segurança, incluindo verificação de motoristas, sistema de
              avaliações e botão de emergência. Em caso de emergência, entre em contato
              imediatamente com as autoridades locais.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-blue-900 mb-3">7. Limitação de Responsabilidade</h2>
            <p>
              O Uppi atua como intermediário entre passageiros e motoristas. Não somos responsáveis
              por danos, perdas ou lesões que possam ocorrer durante o uso do serviço. O transporte
              é fornecido por motoristas independentes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-blue-900 mb-3">8. Modificações</h2>
            <p>
              Reservamos o direito de modificar estes termos a qualquer momento. Notificaremos você
              sobre mudanças significativas através do aplicativo ou por e-mail.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-blue-900 mb-3">9. Contato</h2>
            <p>
              Para dúvidas sobre estes termos, entre em contato através do suporte no aplicativo ou
              pelo e-mail: suporte@uppi.app
            </p>
          </section>

          <div className="pt-4 text-sm text-gray-500">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </div>
        </div>
      </div>
    </div>
  )
}
