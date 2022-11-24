import { Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ProfileResponseInterface } from './types/profileResponse.interface';
import { AuthGuard } from '../user/guards/auth.guard';
import { User } from 'src/user/decorators/user.decorator';

@Controller('profiles')
export class ProfileController {

    constructor(private readonly profileService: ProfileService) {}

    @Get(':username')
    async getProfile(@Param('username') username: string, @User('id') currentUserId: number): Promise<ProfileResponseInterface> {
        const userProfile = await this.profileService.getProfile(username, currentUserId)
        return this.profileService.buildProfileResponse(userProfile)
    }

    @Post(':username/follow')
    @UseGuards(AuthGuard)
    async followProfile(@User('id') currentUserId: number, @Param('username') username: string): Promise<ProfileResponseInterface> {
        const userProfile = await this.profileService.followProfile(currentUserId, username)
        return this.profileService.buildProfileResponse(userProfile)
    }

    @Delete(':username/follow')
    @UseGuards(AuthGuard)
    async unfollowProfile(@User('id') currentUserId: number, @Param('username') username: string): Promise<ProfileResponseInterface> {
        const userProfile = await this.profileService.unfollowProfile(currentUserId, username)
        return this.profileService.buildProfileResponse(userProfile)
    }
}
