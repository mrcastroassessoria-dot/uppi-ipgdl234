import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function PrivacyPage() {
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
          <h1 className="text-2xl font-bold text-blue-900">Política de Privacidade</h1>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl p-6 shadow-lg space-y-6 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-blue-900 mb-3">1. Coleta de Informações</h2>
            <p>Coletamos as seguintes informações quando você usa o Uppi:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Informações de cadastro (nome, e-mail, telefone)</li>
              <li>Dados de localização durante o uso do aplicativo</li>
              <li>Histórico de corridas e transações</li>
              <li>Avaliações e comentários</li>
              <li>Informações do dispositivo e logs de uso</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-blue-900 mb-3">2. Uso das Informações</h2>
            <p>Utilizamos suas informações para:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Conectar passageiros e motoristas</li>
              <li>Processar pagamentos e emitir recibos</li>
              <li>Melhorar nossos serviços e experiência do usuário</li>
              <li>Enviar notificações relevantes sobre suas corridas</li>
              <li>Garantir segurança e prevenir fraudes</li>
              <li>Cumprir obrigações legais</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-blue-900 mb-3">3. Compartilhamento de Dados</h2>
            <p>
              Seus dados pessoais são compartilhados apenas quando necessário para fornecer o
              serviço:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Com motoristas: nome, foto e localização de embarque/desembarque</li>
              <li>Com passageiros: informações do motorista e veículo</li>
              <li>Com processadores de pagamento para transações</li>
              <li>Com autoridades quando exigido por lei</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-blue-900 mb-3">4. Dados de Localização</h2>
            <p>
              Coletamos sua localização em tempo real apenas quando você está usando o aplicativo
              ativamente ou durante uma corrida. Você pode desativar o compartilhamento de
              localização nas configurações do dispositivo, mas isso limitará sua capacidade de usar
              o serviço.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-blue-900 mb-3">5. Segurança dos Dados</h2>
            <p>
              Implementamos medidas de segurança técnicas e organizacionais para proteger suas
              informações contra acesso não autorizado, alteração, divulgação ou destruição. Isso
              inclui criptografia de dados sensíveis e acesso restrito às informações pessoais.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-blue-900 mb-3">6. Seus Direitos</h2>
            <p>Você tem o direito de:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Acessar suas informações pessoais</li>
              <li>Corrigir dados incorretos ou desatualizados</li>
              <li>Solicitar a exclusão de sua conta e dados</li>
              <li>Exportar seus dados em formato legível</li>
              <li>Opor-se ao processamento de seus dados para marketing</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-blue-900 mb-3">7. Cookies e Tecnologias</h2>
            <p>
              Utilizamos cookies e tecnologias similares para melhorar sua experiência, analisar o
              uso do aplicativo e personalizar conteúdo. Você pode gerenciar preferências de cookies
              nas configurações do aplicativo.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-blue-900 mb-3">8. Retenção de Dados</h2>
            <p>
              Mantemos suas informações pelo tempo necessário para fornecer nossos serviços e
              cumprir obrigações legais. Após a exclusão da conta, alguns dados podem ser retidos
              por período adicional conforme exigido por lei.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-blue-900 mb-3">9. Alterações na Política</h2>
            <p>
              Podemos atualizar esta política periodicamente. Notificaremos você sobre mudanças
              significativas através do aplicativo ou por e-mail. Continue usando o serviço após as
              alterações constitui aceitação da nova política.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-blue-900 mb-3">10. Contato</h2>
            <p>
              Para exercer seus direitos ou esclarecer dúvidas sobre privacidade, entre em contato:
            </p>
            <p className="mt-2">
              E-mail: privacidade@uppi.app<br />
              Suporte no aplicativo
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
