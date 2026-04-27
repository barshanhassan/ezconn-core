import { Module } from '@nestjs/common';
import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';
import { PrismaModule } from '../prisma/prisma.module';

import { CustomFieldsModule } from '../custom-fields/custom-fields.module';

@Module({
  imports: [PrismaModule, CustomFieldsModule],
  controllers: [ContactsController],
  providers: [ContactsService],
  exports: [ContactsService],
})
export class ContactsModule {}
