import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { User } from "src/user/decorators/user.decorator";
import { AuthGuard } from "src/user/guards/auth.guard";
import { UserEntity } from "src/user/user.entity";
import { ArticleService } from "./article.service";
import { CreateArticleDto } from './dto/createArticle.dto';
import { AtricleResponseInterface } from "./types/articleResponse.interface";
import { ArticlesResponseInterface } from './types/articlesResponse.interface';


@Controller('articles')
export class ArticleController {

    constructor(private readonly articleService: ArticleService) {}

    @Get()
    async findAll(@User('id') currentUserId: number, @Query() query: any):Promise<ArticlesResponseInterface> {
        return await this.articleService.findAll(currentUserId, query)
    }

    @Get('feed')
    @UseGuards(AuthGuard)
    async getFeed(@User('id') currentUserId: number, @Query() query: any):Promise<ArticlesResponseInterface> {
        return await this.articleService.getFeed(currentUserId, query)
    }

    @Post()
    @UseGuards(AuthGuard)
    @UsePipes(new ValidationPipe())
    async create(@User() currentUser: UserEntity, @Body('article') createArticleDto: CreateArticleDto): Promise<AtricleResponseInterface> {
        const article = await this.articleService.create(currentUser, createArticleDto)
        return this.articleService.buildArticleResponse(article)
    }

    @Get(':slug')
    async getSingleArticle(@Param('slug') slug: string): Promise<AtricleResponseInterface> {
        const article = await this.articleService.findBySlug(slug);
        return this.articleService.buildArticleResponse(article);
    }
    
    @Delete(':slug')
    @UseGuards(AuthGuard)
    async deleteArticle(@User('id') currentUserId: number, @Param('slug') slug: string) {
        return await this.articleService.deleteArticle(currentUserId, slug)
    }

    @Put(':slug')
    @UseGuards(AuthGuard)
    @UsePipes(new ValidationPipe())
    async updateArticleBySlug(@User('id') currentUserId: number, @Param('slug') slug: string, @Body('article') updateArticleDto: CreateArticleDto): Promise<AtricleResponseInterface>{
        const article = await this.articleService.updateArticleBySlug(currentUserId, slug, updateArticleDto)
        return await this.articleService.buildArticleResponse(article)
    }

    @Post(':slug/favorite')
    @UseGuards(AuthGuard)
    async addArticleToFavorites(@User('id') currentUserId: number, @Param('slug') slug: string): Promise<AtricleResponseInterface> {
        const article = await this.articleService.addArticleToFavorites(currentUserId, slug);
        return this.articleService.buildArticleResponse(article);
    }

    @Delete(':slug/favorite')
    @UseGuards(AuthGuard)
    async deleteArticleToFavorites(@User('id') currentUserId: number, @Param('slug') slug: string): Promise<AtricleResponseInterface> {
        const article = await this.articleService.deleteArticleToFavorites(currentUserId, slug);
        return this.articleService.buildArticleResponse(article);
    }

}