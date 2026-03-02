import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private configService: ConfigService,
        private prisma: PrismaService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('jwt.secret') || 'fallback_secret',
        });
    }

    async validate(payload: any) {
        const user = await this.prisma.users.findUnique({
            where: { id: BigInt(payload.sub) },
        });

        if (!user || user.status !== 'ACTIVE') {
            throw new UnauthorizedException('User not found or inactive');
        }

        return {
            id: user.id.toString(),
            email: user.email,
            modelable_id: user.modelable_id.toString(),
            modelable_type: user.modelable_type
        };
    }
}
