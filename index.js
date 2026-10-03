import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys'
import pino from 'pino'
import express from 'express'
import qrcode from 'qrcode-terminal'
import fs from 'fs'

const app = express()
const PORT = process.env.PORT || 10000
app.get('/', (req,res) => res.send('<h1>Supernova Bot V5 - QR READY</h1>'))
app.listen(PORT, () => console.log('Server ON '+PORT))

// حذف المجلد القديم الفاسد عند كل تشغيل
if(fs.existsSync('./auth_info')) {
  try { fs.rmSync('./auth_info', { recursive: true, force: true }); console.log('Cleared old auth'); } catch(e){}
}

const CATALOG = "https://wa.me/c/213560668145"

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info')
  const sock = makeWASocket({
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    auth: state,
    browser: ["Supernova", "Chrome", "1.0"]
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', async (u) => {
    const { connection, lastDisconnect, qr } = u
    if(qr) {
      console.log(' ')
      console.log('=========== QR CODE - SCAN NOW ===========')
      qrcode.generate(qr, { small: true })
      console.log('==========================================')
      console.log('WhatsApp > Linked Devices > Link Device')
    }
    if(connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode
      console.log('Closed code:', code, 'Reason:', lastDisconnect?.error?.message)
      if(code === DisconnectReason.loggedOut) {
        if(fs.existsSync('./auth_info')) fs.rmSync('./auth_info', { recursive: true, force: true })
        console.log('Logged out, cleared')
      }
      setTimeout(() => startBot(), 3000)
    }
    if(connection === 'open') console.log('✅ CONNECTED 24/7!')
  })

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const m = messages[0]
    if(!m.message || m.key.fromMe) return
    const from = m.key.remoteJid
    const txt = (m.message.conversation || m.message.extendedTextMessage?.text || "").toLowerCase()
    if(txt.includes('سلام') || txt.includes('مرحبا')) {
      await sock.sendMessage(from, { text: `🌟 Supernova\n🛒 ${CATALOG}` })
    }
  })
}
startBot()
