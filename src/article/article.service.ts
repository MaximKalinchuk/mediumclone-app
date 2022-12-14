import { Injectable, HttpException, HttpStatus, Query } from '@nestjs/common';
import { UserEntity } from '../user/user.entity';
import { CreateArticleDto } from './dto/createArticle.dto';
import { ArticleEntity } from './article.entity';
import { InjectRepository } from "@nestjs/typeorm";
import { DeleteResult, getRepository, Repository } from "typeorm";
import { AtricleResponseInterface } from "./types/articleResponse.interface";
import slugify from "slugify";
import { ArticlesResponseInterface } from './types/articlesResponse.interface';
import { FollowEntity } from 'src/profile/follow.entity';

@Injectable()
export class ArticleService {

    constructor(@InjectRepository(ArticleEntity) private readonly articleRepository: Repository<ArticleEntity>,
                @InjectRepository(UserEntity) private readonly userRepository: Repository<UserEntity>,
                @InjectRepository(FollowEntity) private readonly followRepository: Repository<FollowEntity>) {}


    async findAll(currentUserId: number, query: any): Promise<ArticlesResponseInterface> {
        const queryBuilder = getRepository(ArticleEntity)
                            .createQueryBuilder('articles')
                            .leftJoinAndSelect('articles.author', 'author');


        queryBuilder.orderBy('articles.createdAt', 'DESC')

        const articlesCount = await queryBuilder.getCount();


        if(query.tag) {
            queryBuilder.andWhere('articles.tagList LIKE :tag', {
                tag: `%${query.tag}%`
            })
        }

        if (query.author) {
            const author = await this.userRepository.findOne({
                username: query.author
            })

            queryBuilder.andWhere('articles.authorId = :id', {
                id: author.id
            })
        }

        if (query.favorited) {
            const author = await this.userRepository.findOne(
              {
                username: query.favorited,
              },
              { relations: ['favorites'] },
            );
            const ids = author.favorites.map((el) => el.id);
      
            if (ids.length > 0) {
              queryBuilder.andWhere('articles.authorId IN (:...ids)', { ids });
            } else {
              queryBuilder.andWhere('1=0');
            }
          }

        if(query.limit) {
            queryBuilder.limit(query.limit)
        }

        if(query.offset) {
            queryBuilder.offset(query.offset)
        }

        let favoriteIds: number[] = []

        if (currentUserId) {
            const currentUser = await this.userRepository.findOne(currentUserId, { relations: ['favorites'] })
            favoriteIds = currentUser.favorites.map((favorite) => favorite.id)
        }

        const articles = await queryBuilder.getMany();

        const articlesWithFavorites = articles.map((article) => {
            const favorited = favoriteIds.includes(article.id);
            return { ...article, favorited }
        })

        return {
            articles: articlesWithFavorites, articlesCount
        }
    }

    async getFeed(currentUserId: number, query: any): Promise<ArticlesResponseInterface> {
        const follows = await this.followRepository.find({followerId: currentUserId})
        
        if (follows.length === 0) {
            return { articles: [], articlesCount: 0}
        }

        const followingUsersIds = follows.map((follow) => follow.followingId)
        const queryBuilder = getRepository(ArticleEntity).createQueryBuilder('articles').leftJoinAndSelect('articles.author', 'author').where('articles.authorId IN (:...ids)', {ids: followingUsersIds})

        queryBuilder.orderBy('articles.createdAt', "DESC")

        const articlesCount = await queryBuilder.getCount()

        if(query.limit) {
            queryBuilder.limit(query.limit)
        }
        
        if(query.offset) {
            queryBuilder.limit(query.offset)
        }

        const articles = await queryBuilder.getMany()

        return {articles, articlesCount}
    }

    async create(currentUser: UserEntity, createArticleDto: CreateArticleDto): Promise<ArticleEntity> {
        const article = new ArticleEntity();
        Object.assign(article, createArticleDto);

        if(!article.tagList) {
            article.tagList = []
        }
        

        article.slug = this.getSlug(createArticleDto.title)
        article.author = currentUser

        return await this.articleRepository.save(article)
    }

    async findBySlug(slug: string): Promise<ArticleEntity> {
        return this.articleRepository.findOne({slug: slug})
    }

    async deleteArticle(currentUserId: number, slug: string): Promise<DeleteResult> {
        const article = await this.findBySlug(slug)

        if(!article) {
            throw new HttpException('Article does not exist', HttpStatus.NOT_FOUND)
        }

        if (article.author.id !== currentUserId) {
            throw new HttpException('You are not an author', HttpStatus.FORBIDDEN)
        }

        return await this.articleRepository.delete(article)
    }

    async updateArticleBySlug(currentUserId: number, slug: string, updateArticleDto: CreateArticleDto): Promise<ArticleEntity> {
        const article = await this.findBySlug(slug)

        if(!article) {
            throw new HttpException('Article does not exist', HttpStatus.NOT_FOUND)
        }

        if (article.author.id !== currentUserId) {
            throw new HttpException('You are not an author', HttpStatus.FORBIDDEN)
        }

        Object.assign(article, updateArticleDto)

        return await  this.articleRepository.save(article)

    }

    async addArticleToFavorites(currentUserId: number, slug: string): Promise<ArticleEntity> {
        const article = await this.findBySlug(slug)
        const user = await this.userRepository.findOne(currentUserId, {
            relations: ['favorites']
        })

        const isNotFavorited = user.favorites.findIndex((post) => post.id === article.id) === -1

        if(isNotFavorited) {
            user.favorites.push(article);
            article.favoritesCount += 1;
            await this.userRepository.save(user);
            await this.articleRepository.save(article);
        }

        return article;
    }

    async deleteArticleToFavorites(currentUserId: number, slug: string): Promise<ArticleEntity> {
        const article = await this.findBySlug(slug)
        const user = await this.userRepository.findOne(currentUserId, {
            relations: ['favorites']
        })

        const articleIndex = user.favorites.findIndex((post) => post.id === article.id);

        if(articleIndex >= 0) {
            user.favorites.splice(articleIndex, 1);
            article.favoritesCount -= 1;

            await this.userRepository.save(user);
            await this.articleRepository.save(article);
        }

        return article

    }

    buildArticleResponse(article: ArticleEntity): AtricleResponseInterface {
        return {
            article
        }
    }

    private getSlug(title: string): string {
        return slugify(title, {lower: true}) + '-' + ((Math.random() * Math.pow(36, 6)) | 0).toString(36)
    }



}