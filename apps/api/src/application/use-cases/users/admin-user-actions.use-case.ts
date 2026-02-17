import { Injectable } from '@nestjs/common';

@Injectable()
export class AdminUserActionsUseCase {
  async resetPassword(id: string) {
    return { success: true, message: "Mot de passe réinitialisé", userId: id };
  }

  async toggleStatus(id: string, active: boolean) {
    return { success: true, id, active };
  }

  async deleteUserRGPD(id: string) {
    return { success: true, id, deleted: true };
  }

  async sendAdminEmail(to: string, subject: string, content: string) {
    return { success: true, sentTo: to };
  }

  async bulkUpdateStatus(ids: string[], active: boolean) {
    return { success: true, count: ids.length, active };
  }

  async updateOrder(ids: string[]) {
    return { success: true, newOrder: ids };
  }
}