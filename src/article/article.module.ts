import { Module } from "@nestjs/common";
import { ArticleController } from "./article.controller";
import { ArticleService } from "./article.service";
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArticleEntity } from "./article.entity";
import { UserEntity } from "src/user/user.entity";
import { FollowEntity } from "src/profile/follow.entity";


@Module({
  providers: [ArticleService],
  controllers: [ArticleController],
  imports: [TypeOrmModule.forFeature([ArticleEntity, UserEntity, FollowEntity])],
  exports: [],
})
export class ArticleModule {}