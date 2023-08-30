import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DataModule } from './data/data.module';
import { DiscordModule } from './discord/discord.module';

@Module({
	imports: [DataModule, DiscordModule],
	controllers: [AppController],
	providers: [AppService]
})
export class AppModule {}

