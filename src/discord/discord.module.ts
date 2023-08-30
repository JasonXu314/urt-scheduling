import { Module } from '@nestjs/common';
import { DataModule } from 'src/data/data.module';
import { DiscordService } from './discord.service';

@Module({
	imports: [DataModule],
	controllers: [],
	providers: [DiscordService],
	exports: [DiscordService]
})
export class DiscordModule {}

