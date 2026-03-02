import { Controller, Post, Put, UseGuards, Request } from '@nestjs/common';
import { RolesService } from './roles.service';
import { JwtAuthGuard } from '../auth/auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('roles')
export class RolesController {
    constructor(private readonly rolesService: RolesService) { }

    @Post()
    createRole(@Request() req: any) {
        return { message: 'Role created', user: req.user };
    }

    @Put(':id')
    updateRole(@Request() req: any) {
        return { message: 'Role updated', user: req.user };
    }
}
