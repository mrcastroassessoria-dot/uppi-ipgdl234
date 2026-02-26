import webpush from 'web-push'

const keys = webpush.generateVAPIDKeys()

console.log('\n=== CHAVES VAPID GERADAS ===\n')
console.log('Copie e cole nas variaveis de ambiente do seu projeto:\n')
console.log(`VAPID_PUBLIC_KEY=${keys.publicKey}`)
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`)
console.log(`VAPID_EMAIL=mailto:seu-email@exemplo.com`)
console.log('\n============================')
console.log('\nIMPORTANTE:')
console.log('- Gere as chaves UMA UNICA VEZ e guarde em local seguro')
console.log('- Nao regenere as chaves — isso invalida todas as subscriptions existentes')
console.log('- A VAPID_PUBLIC_KEY tambem deve ser colocada em NEXT_PUBLIC_VAPID_PUBLIC_KEY')
console.log('============================\n')
