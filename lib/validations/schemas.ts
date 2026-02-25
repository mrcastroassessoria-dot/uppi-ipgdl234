import { z } from 'zod'

// ── Profile ──────────────────────────────────────────────────────────
export const profileUpdateSchema = z.object({
  full_name: z
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome muito longo')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras'),
  phone: z
    .string()
    .min(10, 'Telefone invalido')
    .max(15, 'Telefone invalido')
    .regex(/^[\d\s()+-]+$/, 'Formato de telefone invalido'),
})

// ── Driver Registration ──────────────────────────────────────────────
export const driverRegisterSchema = z.object({
  vehicle_type: z.enum(['car', 'motorcycle', 'van'], {
    errorMap: () => ({ message: 'Selecione o tipo de veiculo' }),
  }),
  vehicle_brand: z
    .string()
    .min(2, 'Marca obrigatoria')
    .max(50, 'Marca muito longa'),
  vehicle_model: z
    .string()
    .min(1, 'Modelo obrigatorio')
    .max(50, 'Modelo muito longo'),
  vehicle_color: z
    .string()
    .min(2, 'Cor obrigatoria')
    .max(30, 'Cor muito longa'),
  vehicle_plate: z
    .string()
    .min(6, 'Placa invalida')
    .max(8, 'Placa invalida')
    .regex(/^[A-Z0-9]{6,8}$/i, 'Placa deve conter letras e numeros'),
  vehicle_year: z
    .string()
    .regex(/^\d{4}$/, 'Ano invalido')
    .refine((val) => {
      const year = parseInt(val)
      const currentYear = new Date().getFullYear()
      return year >= 1980 && year <= currentYear + 1
    }, 'Ano deve ser entre 1980 e o atual'),
  license_number: z
    .string()
    .min(5, 'Numero da CNH obrigatorio')
    .max(20, 'CNH invalida'),
  license_category: z
    .string()
    .min(1, 'Categoria da CNH obrigatoria')
    .max(3, 'Categoria invalida'),
})

// ── Emergency Contact ────────────────────────────────────────────────
export const emergencyContactSchema = z.object({
  name: z
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome muito longo'),
  phone: z
    .string()
    .min(10, 'Telefone invalido')
    .max(15, 'Telefone invalido')
    .regex(/^[\d\s()+-]+$/, 'Formato de telefone invalido'),
  relationship: z
    .string()
    .min(1, 'Selecione o parentesco')
    .max(50, 'Parentesco muito longo'),
})

// ── Review / Rating ──────────────────────────────────────────────────
export const reviewSchema = z.object({
  rating: z
    .number()
    .min(1, 'Selecione uma avaliacao')
    .max(5, 'Avaliacao maxima e 5'),
  comment: z
    .string()
    .max(500, 'Comentario muito longo')
    .optional(),
  tags: z
    .array(z.string())
    .max(6, 'Maximo 6 tags')
    .optional(),
})

// ── Ride Request ─────────────────────────────────────────────────────
export const rideRequestSchema = z.object({
  pickup_address: z.string().min(3, 'Endereco de origem obrigatorio'),
  dropoff_address: z.string().min(3, 'Endereco de destino obrigatorio'),
  pickup_lat: z.number().min(-90).max(90),
  pickup_lng: z.number().min(-180).max(180),
  dropoff_lat: z.number().min(-90).max(90),
  dropoff_lng: z.number().min(-180).max(180),
  vehicle_type: z.enum(['car', 'moto', 'van']).default('car'),
  payment_method: z.enum(['pix', 'credit_card', 'debit_card', 'cash', 'wallet']).default('pix'),
  passenger_price_offer: z.number().min(1, 'Valor minimo R$ 1,00').optional(),
  notes: z.string().max(200, 'Observacao muito longa').optional(),
})

// ── Price Offer ──────────────────────────────────────────────────────
export const priceOfferSchema = z.object({
  offered_price: z
    .number()
    .min(1, 'Valor minimo R$ 1,00')
    .max(10000, 'Valor maximo R$ 10.000'),
  message: z
    .string()
    .max(150, 'Mensagem muito longa')
    .optional(),
})

// ── Coupon ───────────────────────────────────────────────────────────
export const couponApplySchema = z.object({
  code: z
    .string()
    .min(3, 'Codigo muito curto')
    .max(20, 'Codigo muito longo')
    .transform((val) => val.toUpperCase().trim()),
})

// ── Favorite Place ───────────────────────────────────────────────────
export const favoriteSchema = z.object({
  label: z
    .string()
    .min(1, 'Nome obrigatorio')
    .max(50, 'Nome muito longo'),
  address: z
    .string()
    .min(3, 'Endereco obrigatorio'),
  latitude: z.number(),
  longitude: z.number(),
})

export const favoriteLocationSchema = z.object({
  location_name: z
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(50, 'Nome muito longo'),
  address: z
    .string()
    .min(5, 'Endereco incompleto'),
  location_type: z.enum(['home', 'work', 'other'], {
    errorMap: () => ({ message: 'Selecione o tipo de local' }),
  }),
})

// ── Support Ticket ───────────────────────────────────────────────────
export const supportTicketSchema = z.object({
  subject: z
    .string()
    .min(5, 'Assunto deve ter pelo menos 5 caracteres')
    .max(200, 'Assunto muito longo'),
  category: z.enum(['ride_issue', 'payment', 'driver', 'app_bug', 'account', 'other'], {
    errorMap: () => ({ message: 'Selecione uma categoria' }),
  }),
  message: z
    .string()
    .min(10, 'Descreva melhor o problema')
    .max(1000, 'Mensagem muito longa'),
})

// ── Chat Message ─────────────────────────────────────────────────────
export const chatMessageSchema = z.object({
  message: z
    .string()
    .min(1, 'Mensagem vazia')
    .max(500, 'Mensagem muito longa')
    .trim(),
})

// ── Scheduled Ride ───────────────────────────────────────────────────
export const scheduledRideSchema = z.object({
  scheduled_time: z
    .string()
    .refine((val) => {
      const date = new Date(val)
      return date > new Date()
    }, 'Horario deve ser no futuro'),
  max_price: z.number().min(1, 'Valor minimo R$ 1,00').optional(),
})

// ── Wallet Transaction ───────────────────────────────────────────────
export const walletTransactionSchema = z.object({
  amount: z
    .number()
    .min(1, 'Valor minimo R$ 1,00')
    .max(50000, 'Valor maximo R$ 50.000'),
  payment_method: z.enum(['pix', 'credit_card', 'debit_card', 'bank_transfer'], {
    errorMap: () => ({ message: 'Selecione o metodo de pagamento' }),
  }),
})

// ── Social Post ──────────────────────────────────────────────────────
export const socialPostSchema = z.object({
  content: z
    .string()
    .min(1, 'Post vazio')
    .max(500, 'Post muito longo')
    .trim(),
  media_url: z.string().url('URL invalida').optional(),
})

// ── Comment ──────────────────────────────────────────────────────────
export const commentSchema = z.object({
  content: z
    .string()
    .min(1, 'Comentario vazio')
    .max(300, 'Comentario muito longo')
    .trim(),
})

// ── Driver Documents ─────────────────────────────────────────────────
export const driverDocumentsSchema = z.object({
  document_type: z.enum(['cnh', 'crlv', 'profile_photo', 'vehicle_photo'], {
    errorMap: () => ({ message: 'Tipo de documento obrigatorio' }),
  }),
  file: z.any().refine((val) => val instanceof File || typeof val === 'string', {
    message: 'Arquivo obrigatorio',
  }),
})

// ── Payment Method ───────────────────────────────────────────────────
export const paymentMethodSchema = z.object({
  type: z.enum(['credit_card', 'debit_card', 'pix'], {
    errorMap: () => ({ message: 'Selecione o tipo de pagamento' }),
  }),
  card_number: z
    .string()
    .regex(/^\d{16}$/, 'Numero do cartao invalido')
    .optional(),
  card_holder: z
    .string()
    .min(3, 'Nome do titular obrigatorio')
    .max(100, 'Nome muito longo')
    .optional(),
  card_expiry: z
    .string()
    .regex(/^\d{2}\/\d{2}$/, 'Formato: MM/AA')
    .optional(),
  card_cvv: z
    .string()
    .regex(/^\d{3,4}$/, 'CVV invalido')
    .optional(),
  pix_key: z
    .string()
    .min(5, 'Chave PIX invalida')
    .optional(),
}).refine((data) => {
  if (data.type === 'pix') return !!data.pix_key
  return !!(data.card_number && data.card_holder && data.card_expiry && data.card_cvv)
}, {
  message: 'Preencha todos os campos do pagamento',
})

// ── Settings ─────────────────────────────────────────────────────────
export const settingsSchema = z.object({
  notifications_enabled: z.boolean().default(true),
  location_sharing: z.boolean().default(true),
  audio_recording: z.boolean().default(false),
  ride_preferences: z.object({
    allow_shared_rides: z.boolean().default(true),
    auto_accept_offers: z.boolean().default(false),
    preferred_payment: z.enum(['pix', 'credit_card', 'debit_card', 'cash', 'wallet']).default('pix'),
  }).optional(),
})

// ── Referral ─────────────────────────────────────────────────────────
export const referralSchema = z.object({
  phone: z
    .string()
    .min(10, 'Telefone invalido')
    .max(15, 'Telefone invalido')
    .regex(/^[\d\s()+-]+$/, 'Formato de telefone invalido'),
})

// ── Group Ride ───────────────────────────────────────────────────────
export const groupRideSchema = z.object({
  max_passengers: z
    .number()
    .min(2, 'Minimo 2 passageiros')
    .max(6, 'Maximo 6 passageiros'),
  split_fare: z.boolean().default(true),
})

// Helper to validate and return errors
export function validateForm<T>(schema: z.ZodSchema<T>, data: unknown): { 
  success: boolean
  data?: T
  errors?: Record<string, string> 
} {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  const errors: Record<string, string> = {}
  result.error.errors.forEach((err) => {
    const path = err.path.join('.')
    if (!errors[path]) {
      errors[path] = err.message
    }
  })
  return { success: false, errors }
}
