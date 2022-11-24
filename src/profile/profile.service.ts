import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from 'src/user/user.entity';
import { Repository } from 'typeorm';
import { FollowEntity } from './follow.entity';
import { ProfileResponseInterface } from './types/profileResponse.interface';
import { UserProfileInterface } from './types/userProfile.interfase';

@Injectable()
export class ProfileService {

    constructor(@InjectRepository(UserEntity) private readonly userRepository: Repository<UserEntity>,
                @InjectRepository(FollowEntity) private readonly followRepository: Repository<FollowEntity>) {}
    
    async getProfile(username:string, currentUserId: number): Promise<UserProfileInterface> {
        const user = await this.userRepository.findOne({username})

        if(!user) {
            throw new HttpException('Profile is not exist', HttpStatus.NOT_FOUND)
        }

        const follow = await this.followRepository.findOne({
            followerId: currentUserId,
            followingId: user.id,
        })

        return {
            username: user.username,
            bio: user.bio,
            image: user.image,
            following: Boolean(follow)
        }
    }

    async followProfile(currentUserId: number, username: string): Promise<UserProfileInterface> {
        const user = await this.userRepository.findOne({username})

        if(!user) {
            throw new HttpException('Profile is not exist', HttpStatus.NOT_FOUND)
        }

        if (currentUserId === user.id) {
            throw new HttpException('Follower and following cant be equal', HttpStatus.BAD_REQUEST)
        }

        const follow = await this.followRepository.findOne({
            followerId: currentUserId,
            followingId: user.id,
        })
        

        if (!follow) {
            const followToCreate = new FollowEntity()
            followToCreate.followerId = currentUserId
            followToCreate.followingId = user.id

            await this.followRepository.save(followToCreate)
        }

        return {
            username: user.username,
            bio: user.bio,
            image: user.image,
            following: true
        }

    }


    async unfollowProfile(currentUserId: number, username: string): Promise<UserProfileInterface> {
        const user = await this.userRepository.findOne({username})

        if(!user) {
            throw new HttpException('Profile is not exist', HttpStatus.NOT_FOUND)
        }

        if (currentUserId === user.id) {
            throw new HttpException('Follower and following cant be equal', HttpStatus.BAD_REQUEST)
        }

        const follow = await this.followRepository.findOne({
            followerId: currentUserId,
            followingId: user.id,
        })

        if (follow) {
            const followToCreate = new FollowEntity()
            followToCreate.followerId = currentUserId
            followToCreate.followingId = user.id

            await this.followRepository.delete({followerId: currentUserId, followingId: user.id})
        }

        return {
            username: user.username,
            bio: user.bio,
            image: user.image,
            following: false,
        }
    }

    buildProfileResponse(user: UserProfileInterface): ProfileResponseInterface {
        return { profile: user};
    }
}
