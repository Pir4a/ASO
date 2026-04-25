import { Body, Controller, Post } from '@nestjs/common';
import { ChatService } from '../../services/chat.service';
import { ChatMessageDto } from '../../dto/chat/chat.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async chat(@Body() body: ChatMessageDto) {
    const reply = await this.chatService.chat(body.message, body.history);
    return { reply };
  }
}
