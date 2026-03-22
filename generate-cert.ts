import selfsigned from 'selfsigned';
import fs from 'fs';
import path from 'path';

const attrs = [{ name: 'commonName', value: 'localhost' }];
const options = { 
  days: 365,
  keySize: 2048,
  algorithm: 'sha256'
};

const pems = await selfsigned.generate(attrs, options);

const certDir = path.join(process.cwd(), 'certs');
if (!fs.existsSync(certDir)) {
  fs.mkdirSync(certDir);
}

if (pems.private && pems.cert) {
  fs.writeFileSync(path.join(certDir, 'key.pem'), pems.private);
  fs.writeFileSync(path.join(certDir, 'cert.pem'), pems.cert);
  console.log('✅ تم إنشاء الشهادات في مجلد certs/');
  console.log('📁 cert.pem - الشهادة');
  console.log('🔑 key.pem - المفتاح الخاص');
} else {
  console.error('❌ فشل في توليد الشهادات');
}
