
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ContactsService } from './contacts/contacts.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const contactsService = app.get(ContactsService);
  const res = await contactsService.getContacts(BigInt(1), { search: '' });
  console.log('Contacts API response:', JSON.stringify(res, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2).substring(0, 1000));
  await app.close();
}

bootstrap();
