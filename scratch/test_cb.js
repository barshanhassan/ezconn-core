const chargebee = require('chargebee');
const cb = new chargebee.Chargebee({ site: 'test', api_key: 'test' });
console.log('cb keys:', Object.keys(cb));
if (cb.customer) {
  console.log('cb.customer exists');
}
