import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

interface JwtPayload {
    sub: string;
    email: string;
    role: string;
    /** True when the session has cleared an MFA challenge (#7). */
    mfa?: boolean;
    /** Whether the user has MFA enrolled — drives the soft gate in RolesGuard. */
    mfaEnabled?: boolean;
    /** Optional cached locale so out-of-band emails can pick the right copy
     *  without an extra DB hop. Authoritative copy lives on the user row. */
    locale?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: process.env.JWT_SECRET || 'dev-secret',
        });
    }

    async validate(payload: JwtPayload) {
        return {
            sub: payload.sub,
            email: payload.email,
            role: payload.role,
            mfa: payload.mfa === true,
            mfaEnabled: payload.mfaEnabled === true,
            preferredLocale: payload.locale,
        };
    }
}
