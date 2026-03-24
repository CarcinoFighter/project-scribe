const webpush = require('web-push');
const fs = require('fs');
const keys = webpush.generateVAPIDKeys();
console.log('Public Key:', keys.publicKey);
console.log('Private Key:', keys.privateKey);
const envLines = `
NEXT_PUBLIC_VAPID_PUBLIC_KEY=${keys.publicKey}
VAPID_PRIVATE_KEY=${keys.privateKey}
`;
fs.appendFileSync('.env', envLines);
fs.writeFileSync('push-keys.json', JSON.stringify(keys, null, 2));
