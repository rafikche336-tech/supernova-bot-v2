import pkg from '@whiskeysockets/baileys'
const makeWASocket = pkg.default
const { useMultiFileAuthState, DisconnectReason, makeCacheableSignalKeyStore } = pkg
import pino from 'pino'
import express from 'express'
import qrcode from 'qrcode-terminal'

const app = express()
const PORT = process.env.PORT || 10000
app.get('/', (req,res) => res.send('<h1>Supernova Bot V5 Live - Scan QR in Logs</h1>'))
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))

const CATALOG_LINK = "https://wa.me/c/213560668145"

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info')
  const sock = makeWASocket({
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    auth: { 
      creds: state.creds, 
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })) 
    },
    browser: ["Supernova", "Chrome", "1.0"]
  })
  sock.ev.on('creds.update', saveCreds)
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update
    if(qr) {
      console.log('========== QR CODE ==========')
      qrcode.generate(qr, { small: true })
      console.log('Scan this QR in 【entity-WhatsApp¦canonical_name=WhatsApp】 -> Linked Devices -> Link Device')
      console.log('========== QR CODE ==========')
    }
    if(connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
      console.log('Connection closed, reconnecting:', shouldReconnect)
      if(shouldReconnect) {
        setTimeout(() => startBot(), 2000)
      }
    } else if(connection === 'open') {
      console.log('✅ Bot connected! 24/7 on Render - 750h FREE')
    }
  })
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0]
    if (!msg.message || msg.key.fromMe) return
    const from = msg.key.remoteJid
    const text = (msg.message.conversation || msg.message.extendedTextMessage?.text || "").toLowerCase()
    if (text.includes('سلام') || text.includes('مرحبا') || text.includes('salam')) {
      await sock.sendMessage(from, { text: `وعليكم السلام 🌟\nأهلاً بكم في وكالة Supernova\n\n📋 خدماتنا:\n• بوت PRO: 9,500 دج\n• متجر: 11,000 دج\n• صفحة هبوط: 5,000 دج\n\n🛒 كتالوجنا:\n${CATALOG_LINK}` })
    } else if (text.includes('كتالوج') || text.includes('catalog')) {
      await sock.sendMessage(from, { text: `🛒 كتالوج Supernova\n${CATALOG_LINK}` })
    }
  })
}
startBot()
