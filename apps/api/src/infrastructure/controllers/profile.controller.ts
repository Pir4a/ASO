import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    NotFoundException,
    Param,
    Patch,
    Post,
    Put,
    Request,
    UnauthorizedException,
    UseGuards,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { GetUserAddressesUseCase } from '../../application/use-cases/users/get-user-addresses.use-case';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CreateUserAddressUseCase } from '../../application/use-cases/users/create-user-address.use-case';
import { UpdateUserAddressUseCase } from '../../application/use-cases/users/update-user-address.use-case';
import { DeleteUserAddressUseCase } from '../../application/use-cases/users/delete-user-address.use-case';
import { FindUserByIdUseCase } from '../../application/use-cases/users/find-user-by-id.use-case';
import { FindUserByEmailUseCase } from '../../application/use-cases/users/find-user-by-email.use-case';
import { UpdateUserUseCase } from '../../application/use-cases/users/update-user.use-case';
import { RequestEmailChangeUseCase } from '../../application/use-cases/users/request-email-change.use-case';
import {
    PASSWORD_TOO_WEAK_CODE,
    passwordMeetsPolicy,
} from '../../lib/password-policy';

interface AuthedRequest {
    user: { sub: string };
}

interface UpdateProfileBody {
    firstName?: string;
    lastName?: string;
    email?: string;
}

interface ChangePasswordBody {
    currentPassword?: string;
    newPassword?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
    constructor(
        private readonly getUserAddressesUseCase: GetUserAddressesUseCase,
        private readonly createUserAddressUseCase: CreateUserAddressUseCase,
        private readonly updateUserAddressUseCase: UpdateUserAddressUseCase,
        private readonly deleteUserAddressUseCase: DeleteUserAddressUseCase,
        private readonly findUserByIdUseCase: FindUserByIdUseCase,
        private readonly findUserByEmailUseCase: FindUserByEmailUseCase,
        private readonly updateUserUseCase: UpdateUserUseCase,
        private readonly requestEmailChangeUseCase: RequestEmailChangeUseCase,
    ) {}

    /* ── Personal info ─────────────────────────────────────── */

    @Get('me')
    async getMe(@Request() req: AuthedRequest) {
        const user = await this.findUserByIdUseCase.execute(req.user.sub);
        if (!user) throw new NotFoundException('Utilisateur introuvable.');
        return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            isVerified: user.isVerified,
            pendingEmail: user.pendingEmail ?? null,
            mfaEnabled: user.mfaEnabled === true,
            mfaBackupCodesRemaining: user.mfaBackupCodes?.length ?? 0,
        };
    }

    @Patch('me')
    async updateMe(@Request() req: AuthedRequest, @Body() body: UpdateProfileBody) {
        const user = await this.findUserByIdUseCase.execute(req.user.sub);
        if (!user) throw new NotFoundException('Utilisateur introuvable.');

        if (body.firstName !== undefined) {
            const trimmed = body.firstName.trim();
            if (trimmed.length === 0)
                throw new BadRequestException('Le prénom ne peut pas être vide.');
            user.firstName = trimmed;
        }
        if (body.lastName !== undefined) {
            const trimmed = body.lastName.trim();
            if (trimmed.length === 0)
                throw new BadRequestException('Le nom ne peut pas être vide.');
            user.lastName = trimmed;
        }

        let pendingEmail: string | null = user.pendingEmail ?? null;
        const updated = await this.updateUserUseCase.execute(user);

        if (body.email !== undefined) {
            const next = body.email.trim().toLowerCase();
            if (!EMAIL_RE.test(next))
                throw new BadRequestException("Email invalide.");
            if (next !== updated.email) {
                const result = await this.requestEmailChangeUseCase.execute(updated.id, next);
                pendingEmail = result.pendingEmail;
            }
        }

        return {
            id: updated.id,
            email: updated.email,
            firstName: updated.firstName,
            lastName: updated.lastName,
            role: updated.role,
            isVerified: updated.isVerified,
            pendingEmail,
        };
    }

    @Post('me/resend-email-change')
    async resendEmailChange(@Request() req: AuthedRequest) {
        const user = await this.findUserByIdUseCase.execute(req.user.sub);
        if (!user) throw new NotFoundException('Utilisateur introuvable.');
        if (!user.pendingEmail) {
            throw new BadRequestException("Aucun changement d'e-mail en attente.");
        }
        const result = await this.requestEmailChangeUseCase.execute(user.id, user.pendingEmail);
        return { pendingEmail: result.pendingEmail };
    }

    @Patch('me/password')
    async changePassword(
        @Request() req: AuthedRequest,
        @Body() body: ChangePasswordBody,
    ) {
        const user = await this.findUserByIdUseCase.execute(req.user.sub);
        if (!user) throw new NotFoundException('Utilisateur introuvable.');

        const current = body.currentPassword ?? '';
        const next = body.newPassword ?? '';
        if (!current)
            throw new BadRequestException('Mot de passe actuel requis.');
        if (!passwordMeetsPolicy(next))
            throw new BadRequestException(PASSWORD_TOO_WEAK_CODE);

        const ok = await bcrypt.compare(current, user.passwordHash);
        if (!ok) throw new UnauthorizedException('Mot de passe actuel incorrect.');

        user.passwordHash = await bcrypt.hash(next, 10);
        await this.updateUserUseCase.execute(user);
        return { success: true };
    }

    /* ── Addresses ─────────────────────────────────────────── */

    @Get('addresses')
    async getAddresses(@Request() req: AuthedRequest) {
        return this.getUserAddressesUseCase.execute(req.user.sub);
    }

    @Post('addresses')
    async createAddress(
        @Request() req: AuthedRequest,
        @Body()
        body: {
            firstName?: string;
            lastName?: string;
            street: string;
            address2?: string;
            city: string;
            region?: string;
            postalCode: string;
            country: string;
            phone?: string;
        },
    ) {
        return this.createUserAddressUseCase.execute(req.user.sub, body);
    }

    @Put('addresses/:id')
    async updateAddress(
        @Request() req: AuthedRequest,
        @Param('id') addressId: string,
        @Body()
        body: {
            firstName?: string;
            lastName?: string;
            street?: string;
            address2?: string;
            city?: string;
            region?: string;
            postalCode?: string;
            country?: string;
            phone?: string;
        },
    ) {
        return this.updateUserAddressUseCase.execute(
            req.user.sub,
            addressId,
            body,
        );
    }

    @Delete('addresses/:id')
    async deleteAddress(
        @Request() req: AuthedRequest,
        @Param('id') addressId: string,
    ) {
        return this.deleteUserAddressUseCase.execute(req.user.sub, addressId);
    }
}
